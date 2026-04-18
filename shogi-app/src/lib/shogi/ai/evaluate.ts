import type { BoardState, Player, PieceType, Position } from '../core/types';
import { getPieceAt, getMochigoma, findOu, opponent } from '../core/board';
import { PIECE_VALUES, isPromoted, demote } from '../core/constants';
import { isAttackedBy } from '../core/rules';

/** 駒得評価 */
export function materialScore(state: BoardState, player: Player): number {
  let score = 0;
  const opp = opponent(player);

  for (let dan = 1; dan <= 9; dan++) {
    for (let suji = 1; suji <= 9; suji++) {
      const piece = getPieceAt(state, { suji, dan });
      if (!piece) continue;
      const val = PIECE_VALUES[piece.type];
      score += piece.owner === player ? val : -val;
    }
  }

  // 持ち駒（盤上の駒より少し低く評価）
  const myMochi = getMochigoma(state, player);
  const oppMochi = getMochigoma(state, opp);

  for (const [type, count] of Object.entries(myMochi)) {
    score += (PIECE_VALUES[type as PieceType] || 0) * (count || 0) * 0.85;
  }
  for (const [type, count] of Object.entries(oppMochi)) {
    score -= (PIECE_VALUES[type as PieceType] || 0) * (count || 0) * 0.85;
  }

  return score;
}

/** 駒の位置評価（中央寄りに加点） */
export function positionalScore(state: BoardState, player: Player): number {
  let score = 0;
  for (let dan = 1; dan <= 9; dan++) {
    for (let suji = 1; suji <= 9; suji++) {
      const piece = getPieceAt(state, { suji, dan });
      if (!piece || piece.owner !== player) continue;
      // 中央(5,5)に近いほど加点（王以外）
      if (piece.type !== 'ou' && piece.type !== 'gyoku') {
        const centerDist = Math.abs(suji - 5) + Math.abs(dan - 5);
        score += (8 - centerDist) * 2;
      }
    }
  }
  return score;
}

/** 王の安全度（王の周囲の味方駒数） */
export function kingSafetyScore(state: BoardState, player: Player): number {
  const ouPos = findOu(state, player);
  if (!ouPos) return -9999;

  let safety = 0;
  for (let dd = -1; dd <= 1; dd++) {
    for (let ds = -1; ds <= 1; ds++) {
      if (dd === 0 && ds === 0) continue;
      const pos: Position = { suji: ouPos.suji + ds, dan: ouPos.dan + dd };
      if (pos.suji < 1 || pos.suji > 9 || pos.dan < 1 || pos.dan > 9) continue;
      const piece = getPieceAt(state, pos);
      if (piece && piece.owner === player) safety += 30;
      // 相手に攻撃されているマスはペナルティ
      if (isAttackedBy(state, pos, opponent(player))) safety -= 20;
    }
  }
  return safety;
}

/** 初級評価（駒得のみ） */
export function evaluateSimple(state: BoardState, player: Player): number {
  return materialScore(state, player);
}

/** 中級評価（駒得 + 位置 + 王安全度） */
export function evaluateMedium(state: BoardState, player: Player): number {
  return materialScore(state, player)
    + positionalScore(state, player) * 0.3
    + kingSafetyScore(state, player) * 0.5;
}

/** 上級評価（中級 + 追加要素） */
export function evaluateAdvanced(state: BoardState, player: Player): number {
  return evaluateMedium(state, player);
  // MVP版は中級と同じ。2ndでOSSエンジン統合時に置き換え。
}
