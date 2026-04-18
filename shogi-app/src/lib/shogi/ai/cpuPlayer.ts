import type { GameState, Action } from '../core/types';
import { generateLegalMoves } from '../core/rules';
import { minimaxSearch, alphaBetaSearch } from './search';
import { evaluateMedium, evaluateAdvanced } from './evaluate';

export interface AiConfig {
  level: 1 | 2 | 3;
  maxDepth: number;
  maxTimeMs: number;
  randomness: number;
}

export interface AiResult {
  bestMove: Action;
  score: number;
  depth: number;
  nodesSearched: number;
  thinkingTimeMs: number;
}

const LEVEL_CONFIGS: Record<number, AiConfig> = {
  1: { level: 1, maxDepth: 2, maxTimeMs: 1000, randomness: 0.4 },
  2: { level: 2, maxDepth: 4, maxTimeMs: 3000, randomness: 0.1 },
  3: { level: 3, maxDepth: 5, maxTimeMs: 5000, randomness: 0.05 },
};

/**
 * CPU思考メイン関数
 */
export function thinkMove(game: GameState, level: 1 | 2 | 3): AiResult {
  const config = LEVEL_CONFIGS[level];
  const startTime = Date.now();
  const moves = generateLegalMoves(game);

  if (moves.length === 0) {
    throw new Error('No legal moves available');
  }

  if (moves.length === 1) {
    return {
      bestMove: moves[0],
      score: 0,
      depth: 0,
      nodesSearched: 1,
      thinkingTimeMs: Date.now() - startTime,
    };
  }

  let result;

  if (level === 1) {
    // 初級: 浅いMinimax + ランダム性
    result = minimaxSearch(game, config.maxDepth, game.teban);

    // ランダム性を追加（上位50%からランダム選択）
    if (Math.random() < config.randomness) {
      const randomIndex = Math.floor(Math.random() * moves.length);
      result = { ...result, bestMove: moves[randomIndex] };
    }
  } else if (level === 2) {
    // 中級: Alpha-Beta + 中級評価関数
    result = alphaBetaSearch(game, config.maxDepth, game.teban, evaluateMedium, config.maxTimeMs);
  } else {
    // 上級: Alpha-Beta + 上級評価関数
    result = alphaBetaSearch(game, config.maxDepth, game.teban, evaluateAdvanced, config.maxTimeMs);
  }

  return {
    ...result,
    thinkingTimeMs: Date.now() - startTime,
  };
}
