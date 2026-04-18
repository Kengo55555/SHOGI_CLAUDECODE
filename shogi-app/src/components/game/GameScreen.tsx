'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Action, Position, Player, KomaType, MoveAction } from '@/lib/shogi/core/types';
import {
  createGame, applyMove, resign, undoMove, isGameOver,
  generateLegalMoves, getPieceAt, getMochigoma,
  promotionStatus, opponent,
} from '@/lib/shogi/core';
import { thinkMove } from '@/lib/shogi/ai';
import { ShogiBoard } from '../board/ShogiBoard';
import { MochigomaBar } from '../board/MochigomaBar';
import { GameControls } from './GameControls';
import { GameEndOverlay } from './GameEndOverlay';
import { PromotionDialog } from './PromotionDialog';
import { TimeDisplay } from './TimeDisplay';

interface GameScreenProps {
  matchId: string;
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
  matchId, isCpuGame, cpuLevel, myPlayer, timeControlMinutes, opponentName, myName,
}: GameScreenProps) {
  const [game, setGame] = useState<GameState>(createGame);
  const [interaction, setInteraction] = useState<InteractionState>({ type: 'idle' });
  const [senteTime, setSenteTime] = useState(timeControlMinutes * 60 * 1000);
  const [goteTime, setGoteTime] = useState(timeControlMinutes * 60 * 1000);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [remainingUndos, setRemainingUndos] = useState(3);
  const [lastMove, setLastMove] = useState<{ from?: Position; to: Position } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMyTurn = game.teban === myPlayer;
  const opponentPlayer = opponent(myPlayer);

  // タイマー管理
  useEffect(() => {
    if (isGameOver(game) || timeControlMinutes === 0) return;

    timerRef.current = setInterval(() => {
      if (game.teban === 'sente') {
        setSenteTime((t) => {
          if (t <= 0) return 0;
          return t - 1000;
        });
      } else {
        setGoteTime((t) => {
          if (t <= 0) return 0;
          return t - 1000;
        });
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
    // 非同期でCPU思考（UIブロック回避のためsetTimeout使用）
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

    // 成り確認ダイアログ中
    if (interaction.type === 'promotion_dialog') return;

    // 持ち駒選択中 → 打ち先を選択
    if (interaction.type === 'mochigoma_selected') {
      if (interaction.legalDrops.some((p) => p.suji === pos.suji && p.dan === pos.dan)) {
        const action: Action = { type: 'drop', piece: interaction.piece, to: pos };
        executeAction(action);
      } else {
        setInteraction({ type: 'idle' });
      }
      return;
    }

    // 駒選択中 → 移動先を選択
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

      // 別の自分の駒をクリック → 選択変更
      if (piece && piece.owner === myPlayer) {
        selectPiece(pos);
        return;
      }

      // その他 → 選択解除
      setInteraction({ type: 'idle' });
      return;
    }

    // 何も選択していない → 自分の駒を選択
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
    // 2手戻す（自分の手＋CPUの手）
    let g = game;
    const undo1 = undoMove(g);
    if (!undo1) return;
    const undo2 = undoMove(undo1);
    if (!undo2) return;
    setGame(undo2);
    setRemainingUndos((r) => r - 1);
    setLastMove(null);
    setInteraction({ type: 'idle' });
  }

  function handleAbort() {
    setGame({ ...game, status: { type: 'resign', winner: opponentPlayer } });
  }

  // 合法手ターゲット
  const legalTargets: Position[] =
    interaction.type === 'piece_selected' ? interaction.legalMoves :
    interaction.type === 'mochigoma_selected' ? interaction.legalDrops :
    [];

  const selectedPos = interaction.type === 'piece_selected' ? interaction.position : null;

  // 上側のプレイヤー・下側のプレイヤー
  const topPlayer = opponentPlayer;
  const bottomPlayer = myPlayer;

  return (
    <div className="flex flex-col items-center gap-2 py-4 px-2">
      {/* 上側プレイヤー情報 */}
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

      {/* 上側持ち駒 */}
      <div className="w-full max-w-[500px]">
        <MochigomaBar
          mochigoma={getMochigoma(game.boardState, topPlayer)}
          owner={topPlayer}
          isMyTurn={false}
          selectedPiece={null}
          onSelect={() => {}}
        />
      </div>

      {/* 将棋盤 */}
      <ShogiBoard
        boardState={game.boardState}
        perspective={myPlayer}
        lastMove={lastMove}
        legalTargets={legalTargets}
        selectedPosition={selectedPos}
        onSquareClick={handleSquareClick}
      />

      {/* 下側持ち駒 */}
      <div className="w-full max-w-[500px]">
        <MochigomaBar
          mochigoma={getMochigoma(game.boardState, bottomPlayer)}
          owner={bottomPlayer}
          isMyTurn={isMyTurn && !isGameOver(game)}
          selectedPiece={interaction.type === 'mochigoma_selected' ? interaction.piece : null}
          onSelect={handleMochigomaSelect}
        />
      </div>

      {/* 下側プレイヤー情報 */}
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

      {/* 操作ボタン */}
      {!isGameOver(game) && (
        <GameControls
          isCpuGame={isCpuGame}
          remainingUndos={isCpuGame ? remainingUndos : undefined}
          onResign={handleResign}
          onUndo={isCpuGame ? handleUndo : undefined}
          onAbort={isCpuGame ? handleAbort : undefined}
        />
      )}

      {/* 成り確認ダイアログ */}
      {interaction.type === 'promotion_dialog' && (
        <PromotionDialog pieceType={interaction.pieceType} onChoice={handlePromotion} />
      )}

      {/* 対局終了オーバーレイ */}
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
