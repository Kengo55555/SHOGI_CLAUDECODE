import type { GameState, Action, Player } from './types';
import { createInitialBoard, boardHash, opponent } from './board';
import {
  validateMove,
  applyActionToBoard,
  isCheckmate,
  isSennichite,
  isJishogi,
  generateLegalMoves,
} from './rules';

/** 新規ゲームを開始 */
export function createGame(): GameState {
  const boardState = createInitialBoard();
  const teban: Player = 'sente';
  const hash = boardHash(boardState, teban);

  return {
    boardState,
    teban,
    moveHistory: [],
    positionHistory: [hash],
    status: { type: 'playing' },
    moveCount: 0,
  };
}

/**
 * 指し手を適用する
 * 1. 合法性チェック
 * 2. 盤面更新
 * 3. 手番交代
 * 4. 終局判定
 */
export function applyMove(
  game: GameState,
  action: Action
): { success: true; game: GameState } | { success: false; reason: string } {
  // ゲームが終了していないか
  if (game.status.type !== 'playing') {
    return { success: false, reason: '対局は既に終了しています' };
  }

  // 合法性チェック
  const validation = validateMove(game, action);
  if (!validation.legal) {
    return { success: false, reason: validation.reason };
  }

  // 盤面更新
  const newBoardState = applyActionToBoard(game.boardState, action, game.teban);
  const newTeban = opponent(game.teban);
  const newMoveCount = game.moveCount + 1;
  const hash = boardHash(newBoardState, newTeban);

  let newGame: GameState = {
    boardState: newBoardState,
    teban: newTeban,
    moveHistory: [...game.moveHistory, action],
    positionHistory: [...game.positionHistory, hash],
    status: { type: 'playing' },
    moveCount: newMoveCount,
  };

  // 終局判定
  newGame = checkGameEnd(newGame);

  return { success: true, game: newGame };
}

/** 終局判定 */
function checkGameEnd(game: GameState): GameState {
  // 詰み判定（現在の手番のプレイヤーが詰んでいるか）
  if (isCheckmate(game)) {
    return {
      ...game,
      status: { type: 'checkmate', winner: opponent(game.teban) },
    };
  }

  // 千日手判定
  if (isSennichite(game)) {
    return {
      ...game,
      status: { type: 'draw', reason: 'sennichite' },
    };
  }

  // 持将棋判定
  if (isJishogi(game)) {
    return {
      ...game,
      status: { type: 'draw', reason: 'jishogi' },
    };
  }

  return game;
}

/** 投了 */
export function resign(game: GameState): GameState {
  if (game.status.type !== 'playing') return game;

  return {
    ...game,
    status: { type: 'resign', winner: opponent(game.teban) },
  };
}

/** ゲームが終了しているか */
export function isGameOver(game: GameState): boolean {
  return game.status.type !== 'playing';
}

/** 待った（1手戻す）- CPU戦のみ使用 */
export function undoMove(game: GameState): GameState | null {
  if (game.moveHistory.length === 0) return null;

  // ゲームを最初から再生して1手前の状態を作る
  let state = createGame();
  const targetMoves = game.moveHistory.slice(0, -1);

  for (const move of targetMoves) {
    const result = applyMove(state, move);
    if (!result.success) return null; // 理論上ありえないが安全策
    state = result.game;
  }

  return state;
}

/**
 * 指定プレイヤーの合法手の数を返す（ユーティリティ）
 */
export function countLegalMoves(game: GameState): number {
  return generateLegalMoves(game).length;
}
