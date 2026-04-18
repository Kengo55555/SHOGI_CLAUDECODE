import type { BoardState, Piece, Position, Player, KomaType, Mochigoma } from './types';
import { INITIAL_BOARD } from './constants';

/** 初期盤面を生成 */
export function createInitialBoard(): BoardState {
  return {
    board: INITIAL_BOARD.map(row => row.map(p => p ? { ...p } : null)),
    senteMochigoma: {},
    goteMochigoma: {},
  };
}

/** 盤面をディープコピー */
export function cloneBoard(state: BoardState): BoardState {
  return {
    board: state.board.map(row => row.map(p => p ? { ...p } : null)),
    senteMochigoma: { ...state.senteMochigoma },
    goteMochigoma: { ...state.goteMochigoma },
  };
}

/**
 * 指定位置の駒を取得
 * board[dan-1][suji-1] でアクセス
 * ※内部配列は 9筋=index0, 8筋=index1, ..., 1筋=index8
 * つまり suji → index変換: index = 9 - suji
 */
export function getPieceAt(state: BoardState, pos: Position): Piece | null {
  if (!isValidPosition(pos)) return null;
  return state.board[pos.dan - 1][9 - pos.suji];
}

/** 指定位置に駒を配置（新しいBoardStateを返す） */
export function setPieceAt(state: BoardState, pos: Position, piece: Piece | null): BoardState {
  const newState = cloneBoard(state);
  newState.board[pos.dan - 1][9 - pos.suji] = piece;
  return newState;
}

/** 指定プレイヤーの持ち駒を取得 */
export function getMochigoma(state: BoardState, player: Player): Mochigoma {
  return player === 'sente' ? state.senteMochigoma : state.goteMochigoma;
}

/** 持ち駒に1枚追加 */
export function addMochigoma(state: BoardState, player: Player, piece: KomaType): BoardState {
  const newState = cloneBoard(state);
  const mochi = player === 'sente' ? newState.senteMochigoma : newState.goteMochigoma;
  mochi[piece] = (mochi[piece] || 0) + 1;
  return newState;
}

/** 持ち駒から1枚削除 */
export function removeMochigoma(state: BoardState, player: Player, piece: KomaType): BoardState {
  const newState = cloneBoard(state);
  const mochi = player === 'sente' ? newState.senteMochigoma : newState.goteMochigoma;
  const count = mochi[piece] || 0;
  if (count <= 1) {
    delete mochi[piece];
  } else {
    mochi[piece] = count - 1;
  }
  return newState;
}

/** 盤面のハッシュ文字列を生成（千日手判定用） */
export function boardHash(state: BoardState, teban: Player): string {
  const parts: string[] = [teban];

  // 盤面
  for (let dan = 0; dan < 9; dan++) {
    for (let suji = 0; suji < 9; suji++) {
      const p = state.board[dan][suji];
      parts.push(p ? `${p.owner[0]}${p.type}` : '_');
    }
  }

  // 持ち駒
  const mochiStr = (m: Mochigoma) =>
    Object.entries(m)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join('');

  parts.push('S' + mochiStr(state.senteMochigoma));
  parts.push('G' + mochiStr(state.goteMochigoma));

  return parts.join('|');
}

/** 指定プレイヤーの王の位置を取得 */
export function findOu(state: BoardState, player: Player): Position | null {
  const ouType = player === 'sente' ? 'ou' : 'gyoku';
  for (let dan = 1; dan <= 9; dan++) {
    for (let suji = 1; suji <= 9; suji++) {
      const piece = getPieceAt(state, { suji, dan });
      if (piece && piece.owner === player && piece.type === ouType) {
        return { suji, dan };
      }
    }
  }
  return null;
}

/** 座標が有効範囲内かチェック */
export function isValidPosition(pos: Position): boolean {
  return pos.suji >= 1 && pos.suji <= 9 && pos.dan >= 1 && pos.dan <= 9;
}

/** 相手プレイヤーを返す */
export function opponent(player: Player): Player {
  return player === 'sente' ? 'gote' : 'sente';
}
