import type { GameState, Action, Player } from '../core/types';
import { generateLegalMoves, applyActionToBoard } from '../core/rules';
import { opponent, boardHash } from '../core/board';
import { evaluateSimple, evaluateMedium, evaluateAdvanced } from './evaluate';

type EvalFn = (state: GameState['boardState'], player: Player) => number;

export interface SearchResult {
  bestMove: Action;
  score: number;
  depth: number;
  nodesSearched: number;
}

/**
 * Minimax探索（初級AI用）
 */
export function minimaxSearch(
  game: GameState,
  depth: number,
  maximizingPlayer: Player,
): SearchResult {
  let nodesSearched = 0;

  function minimax(g: GameState, d: number, isMax: boolean): { score: number; move: Action | null } {
    nodesSearched++;
    const moves = generateLegalMoves(g);

    if (d === 0 || moves.length === 0 || g.status.type !== 'playing') {
      return { score: evaluateSimple(g.boardState, maximizingPlayer), move: null };
    }

    let bestScore = isMax ? -Infinity : Infinity;
    let bestMove: Action | null = null;

    for (const move of moves) {
      const newBoard = applyActionToBoard(g.boardState, move, g.teban);
      const newTeban = opponent(g.teban);
      const newHash = boardHash(newBoard, newTeban);
      const newGame: GameState = {
        boardState: newBoard,
        teban: newTeban,
        moveHistory: [...g.moveHistory, move],
        positionHistory: [...g.positionHistory, newHash],
        status: { type: 'playing' },
        moveCount: g.moveCount + 1,
      };

      const result = minimax(newGame, d - 1, !isMax);

      if (isMax ? result.score > bestScore : result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    }

    return { score: bestScore, move: bestMove };
  }

  const result = minimax(game, depth, true);
  return {
    bestMove: result.move!,
    score: result.score,
    depth,
    nodesSearched,
  };
}

/**
 * Alpha-Beta探索（中級・上級AI用）
 */
export function alphaBetaSearch(
  game: GameState,
  maxDepth: number,
  maximizingPlayer: Player,
  evalFn: EvalFn = evaluateMedium,
  timeLimitMs: number = 3000,
): SearchResult {
  let nodesSearched = 0;
  const startTime = Date.now();
  let bestMoveOverall: Action | null = null;
  let bestScoreOverall = -Infinity;

  function alphaBeta(
    g: GameState,
    depth: number,
    alpha: number,
    beta: number,
    isMax: boolean,
  ): number {
    nodesSearched++;

    // 時間切れチェック
    if (Date.now() - startTime > timeLimitMs) return evalFn(g.boardState, maximizingPlayer);

    const moves = generateLegalMoves(g);

    if (depth === 0 || moves.length === 0 || g.status.type !== 'playing') {
      return evalFn(g.boardState, maximizingPlayer);
    }

    if (isMax) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = applyActionToBoard(g.boardState, move, g.teban);
        const newTeban = opponent(g.teban);
        const newHash = boardHash(newBoard, newTeban);
        const newGame: GameState = {
          boardState: newBoard,
          teban: newTeban,
          moveHistory: [...g.moveHistory, move],
          positionHistory: [...g.positionHistory, newHash],
          status: { type: 'playing' },
          moveCount: g.moveCount + 1,
        };

        const score = alphaBeta(newGame, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = applyActionToBoard(g.boardState, move, g.teban);
        const newTeban = opponent(g.teban);
        const newHash = boardHash(newBoard, newTeban);
        const newGame: GameState = {
          boardState: newBoard,
          teban: newTeban,
          moveHistory: [...g.moveHistory, move],
          positionHistory: [...g.positionHistory, newHash],
          status: { type: 'playing' },
          moveCount: g.moveCount + 1,
        };

        const score = alphaBeta(newGame, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // 反復深化
  for (let d = 1; d <= maxDepth; d++) {
    if (Date.now() - startTime > timeLimitMs) break;

    const moves = generateLegalMoves(game);
    let bestScore = -Infinity;
    let bestMove: Action | null = null;

    for (const move of moves) {
      const newBoard = applyActionToBoard(game.boardState, move, game.teban);
      const newTeban = opponent(game.teban);
      const newHash = boardHash(newBoard, newTeban);
      const newGame: GameState = {
        boardState: newBoard,
        teban: newTeban,
        moveHistory: [...game.moveHistory, move],
        positionHistory: [...game.positionHistory, newHash],
        status: { type: 'playing' },
        moveCount: game.moveCount + 1,
      };

      const score = alphaBeta(newGame, d - 1, -Infinity, Infinity, false);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      if (Date.now() - startTime > timeLimitMs) break;
    }

    if (bestMove) {
      bestMoveOverall = bestMove;
      bestScoreOverall = bestScore;
    }
  }

  return {
    bestMove: bestMoveOverall!,
    score: bestScoreOverall,
    depth: maxDepth,
    nodesSearched,
  };
}
