'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Action, Position, Player, KomaType, MoveAction } from '@/lib/shogi/core/types';
import {
  createGame, applyMove, resign, undoMove, isGameOver,
  generateLegalMoves, getPieceAt, getMochigoma,
  promotionStatus, opponent, gameToKif,
} from '@/lib/shogi/core';
import type { KifMetadata } from '@/lib/shogi/core';
import { thinkMove } from '@/lib/shogi/ai';
import { ShogiBoard } from '../board/ShogiBoard';
import { MochigomaBar } from '../board/MochigomaBar';
import { GameControls } from './GameControls';
import { GameEndOverlay } from './GameEndOverlay';
import { PromotionDialog } from './PromotionDialog';
import { TimeDisplay } from './TimeDisplay';

interface GameScreenProps {
  matchId: string;
  userId: string;
  isCpuGame: boolean;
  cpuLevel?: 1 | 2 | 3;
  myPlayer: Player;
  timeControlMinutes: number;
  opponentName: string;
  myName: string;
}

type InteractionState =
  | { type: 'idle' }
  | { type: 'piece_selected'; position: Position; legalMoves: Position[] }
  | { type: 'mochigoma_selected'; piece: KomaType; legalDrops: Position[] }
  | { type: 'promotion_dialog'; from: Position; to: Position; pieceType: KomaType };

export function GameScreen({
  matchId, userId, isCpuGame, cpuLevel, myPlayer, timeControlMinutes, opponentName, myName,
}: GameScreenProps) {
  const [game, setGame] = useState<GameState>(createGame);
  const [interaction, setInteraction] = useState<InteractionState>({ type: 'idle' });
  const [senteTime, setSenteTime] = useState(timeControlMinutes * 60 * 1000);
  const [goteTime, setGoteTime] = useState(timeControlMinutes * 60 * 1000);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [remainingUndos, setRemainingUndos] = useState(3);
  const [lastMove, setLastMove] = useState<{ from?: Position; to: Position } | null>(null);
  const resultSavedRef = useRef(false);
  const gameRef = useRef(game);
  const senteTimeRef = useRef(senteTime);
  const goteTimeRef = useRef(goteTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // refを最新値に同期（beforeunloadで使うため）
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { senteTimeRef.current = senteTime; }, [senteTime]);
  useEffect(() => { goteTimeRef.current = goteTime; }, [goteTime]);

  const isMyTurn = game.teban === myPlayer;
  const opponentPlayer = opponent(myPlayer);

  /** DB保存関数 */
  const saveResult = useCallback((g: GameState, isAbort: boolean = false) => {
    if (resultSavedRef.current) return;
    resultSavedRef.current = true;

    const status = g.status;
    let playerWon: boolean | null = null;
    let resultType = isAbort ? 'aborted' : '';

    if (!isAbort) {
      if (status.type === 'checkmate' || status.type === 'resign' || status.type === 'timeout' || status.type === 'disconnect') {
        resultType = status.type;
        playerWon = status.winner === myPlayer;
      } else if (status.type === 'draw') {
        resultType = 'draw';
        playerWon = null;
      } else if (status.type === 'foul') {
        resultType = 'foul';
        playerWon = status.loser !== myPlayer;
      } else {
        // まだ playing → 中断扱い
        resultType = 'aborted';
      }
    }

    const kifMeta: KifMetadata = {
      startedAt: new Date(),
      sente: myPlayer === 'sente' ? myName : opponentName,
      gote: myPlayer === 'gote' ? myName : opponentName,
      timeControl: timeControlMinutes,
    };

    const payload = {
      playerWon,
      resultType,
      totalMoves: g.moveCount,
      senteTimeUsed: Math.floor((timeControlMinutes * 60 * 1000 - senteTimeRef.current) / 1000),
      goteTimeUsed: Math.floor((timeControlMinutes * 60 * 1000 - goteTimeRef.current) / 1000),
      kifuKif: g.moveCount > 0 ? gameToKif(g, kifMeta) : '',
      movesJson: g.moveHistory,
    };

    // sendBeacon を試行（ページ離脱時でも送信される）
    const url = `/api/matches/${matchId}/finish`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }, [matchId, myPlayer, myName, opponentName, timeControlMinutes]);

  // 終局時に自動保存
  useEffect(() => {
    if (isGameOver(game) && !resultSavedRef.current) {
      saveResult(game);
    }
  }, [game.status.type, saveResult]);

  // ページ離脱・ブラウザバック時に保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!resultSavedRef.current && gameRef.current.moveCount > 0) {
        saveResult(gameRef.current, !isGameOver(gameRef.current));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveResult]);

  // タイマー管理
  useEffect(() => {
    if (isGameOver(game) || timeControlMinutes === 0) return;

    timerRef.current = setInterval(() => {
      if (game.teban === 'sente') {
        setSenteTime((t) => Math.max(0, t - 1000));
      } else {
        setGoteTime((t) => Math.max(0, t - 1000));
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game.teban, game.status.type, timeControlMinutes]);

  // CPU手番の処理
  useEffect(() => {
    if (!isCpuGame || !cpuLevel || isMyTurn || isGameOver(game) || cpuThinking) return;

    setCpuThinking(true);
    const minDelay = cpuLevel === 1 ? 500 : cpuLevel === 2 ? 1000 : 2000;

    const start = Date.now();
    setTimeout(() => {
      try {
        const result = thinkMove(game, cpuLevel);
        const elapsed = Date.now() - start;
        const wait = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          executeAction(result.bestMove);
          setCpuThinking(false);
        }, wait);
      } catch {
        setCpuThinking(false);
      }
    }, 50);
  }, [game.teban, game.status.type, isCpuGame, cpuLevel, isMyTurn]);

  const executeAction = useCallback((action: Action) => {
    const result = applyMove(game, action);
    if (result.success) {
      setGame(result.game);
      setLastMove({
        from: action.type === 'move' ? action.from : undefined,
        to: action.type === 'move' ? action.to : action.to,
      });
      setInteraction({ type: 'idle' });
    }
  }, [game]);

  function handleSquareClick(pos: Position) {
    if (!isMyTurn || isGameOver(game) || cpuThinking) return;

    const piece = getPieceAt(game.boardState, pos);

    if (interaction.type === 'promotion_dialog') return;

    if (interaction.type === 'mochigoma_selected') {
      if (interaction.legalDrops.some((p) => p.suji === pos.suji && p.dan === pos.dan)) {
        executeAction({ type: 'drop', piece: interaction.piece, to: pos });
      } else {
        setInteraction({ type: 'idle' });
      }
      return;
    }

    if (interaction.type === 'piece_selected') {
      if (interaction.legalMoves.some((p) => p.suji === pos.suji && p.dan === pos.dan)) {
        const fromPiece = getPieceAt(game.boardState, interaction.position);
        if (!fromPiece) return;

        const ps = promotionStatus(fromPiece, interaction.position, pos);

        if (ps === 'must') {
          executeAction({ type: 'move', from: interaction.position, to: pos, promote: true });
        } else if (ps === 'can') {
          setInteraction({
            type: 'promotion_dialog',
            from: interaction.position,
            to: pos,
            pieceType: fromPiece.type as KomaType,
          });
        } else {
          executeAction({ type: 'move', from: interaction.position, to: pos, promote: false });
        }
        return;
      }

      if (piece && piece.owner === myPlayer) {
        selectPiece(pos);
        return;
      }

      setInteraction({ type: 'idle' });
      return;
    }

    if (piece && piece.owner === myPlayer) {
      selectPiece(pos);
    }
  }

  function selectPiece(pos: Position) {
    const legalMoves = generateLegalMoves(game)
      .filter((m): m is MoveAction => m.type === 'move' && m.from.suji === pos.suji && m.from.dan === pos.dan)
      .map((m) => m.to)
      .filter((to, i, arr) => arr.findIndex((t) => t.suji === to.suji && t.dan === to.dan) === i);

    setInteraction({ type: 'piece_selected', position: pos, legalMoves });
  }

  function handleMochigomaSelect(piece: KomaType) {
    if (!isMyTurn || isGameOver(game)) return;

    const legalDrops = generateLegalMoves(game)
      .filter((m) => m.type === 'drop' && m.piece === piece)
      .map((m) => m.to);

    setInteraction({ type: 'mochigoma_selected', piece, legalDrops });
  }

  function handlePromotion(promote: boolean) {
    if (interaction.type !== 'promotion_dialog') return;
    executeAction({
      type: 'move',
      from: interaction.from,
      to: interaction.to,
      promote,
    });
  }

  function handleResign() {
    setGame(resign(game));
  }

  function handleUndo() {
    if (remainingUndos <= 0 || game.moveHistory.length < 2) return;
    const undo1 = undoMove(game);
    if (!undo1) return;
    const undo2 = undoMove(undo1);
    if (!undo2) return;
    setGame(undo2);
    setRemainingUndos((r) => r - 1);
    setLastMove(null);
    setInteraction({ type: 'idle' });
  }

  function handleAbort() {
    const abortedGame = { ...game, status: { type: 'resign' as const, winner: opponentPlayer } };
    setGame(abortedGame);
  }

  const legalTargets: Position[] =
    interaction.type === 'piece_selected' ? interaction.legalMoves :
    interaction.type === 'mochigoma_selected' ? interaction.legalDrops :
    [];

  const selectedPos = interaction.type === 'piece_selected' ? interaction.position : null;
  const topPlayer = opponentPlayer;
  const bottomPlayer = myPlayer;

  return (
    <div className="flex flex-col items-center gap-2 py-4 px-2">
      <div className="w-full max-w-[500px] flex items-center justify-between px-2">
        <div>
          <span className="text-sm font-medium">
            {topPlayer === 'sente' ? '☗' : '☖'} {opponentName}
          </span>
          {cpuThinking && <span className="text-xs text-gray-500 ml-2">思考中...</span>}
        </div>
        {timeControlMinutes > 0 && (
          <TimeDisplay
            remainingMs={topPlayer === 'sente' ? senteTime : goteTime}
            isActive={game.teban === topPlayer && !isGameOver(game)}
          />
        )}
      </div>

      <div className="w-full max-w-[500px]">
        <MochigomaBar
          mochigoma={getMochigoma(game.boardState, topPlayer)}
          owner={topPlayer}
          isMyTurn={false}
          selectedPiece={null}
          onSelect={() => {}}
        />
      </div>

      <ShogiBoard
        boardState={game.boardState}
        perspective={myPlayer}
        lastMove={lastMove}
        legalTargets={legalTargets}
        selectedPosition={selectedPos}
        onSquareClick={handleSquareClick}
      />

      <div className="w-full max-w-[500px]">
        <MochigomaBar
          mochigoma={getMochigoma(game.boardState, bottomPlayer)}
          owner={bottomPlayer}
          isMyTurn={isMyTurn && !isGameOver(game)}
          selectedPiece={interaction.type === 'mochigoma_selected' ? interaction.piece : null}
          onSelect={handleMochigomaSelect}
        />
      </div>

      <div className="w-full max-w-[500px] flex items-center justify-between px-2">
        <span className="text-sm font-medium">
          {bottomPlayer === 'sente' ? '☗' : '☖'} {myName}
        </span>
        {timeControlMinutes > 0 && (
          <TimeDisplay
            remainingMs={bottomPlayer === 'sente' ? senteTime : goteTime}
            isActive={game.teban === bottomPlayer && !isGameOver(game)}
          />
        )}
      </div>

      {!isGameOver(game) && (
        <GameControls
          isCpuGame={isCpuGame}
          remainingUndos={isCpuGame ? remainingUndos : undefined}
          onResign={handleResign}
          onUndo={isCpuGame ? handleUndo : undefined}
          onAbort={isCpuGame ? handleAbort : undefined}
        />
      )}

      {interaction.type === 'promotion_dialog' && (
        <PromotionDialog pieceType={interaction.pieceType} onChoice={handlePromotion} />
      )}

      {isGameOver(game) && (
        <GameEndOverlay
          status={game.status}
          myPlayer={myPlayer}
          moveCount={game.moveCount}
          matchId={matchId}
        />
      )}
    </div>
  );
}
