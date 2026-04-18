import type { Piece, PieceType, KomaType, NariKomaType } from './types';

// ==========================================
// 駒の動き定義
// ==========================================

/**
 * 駒の移動可能方向（先手基準）
 * dx: 筋の変化量（正=左, 負=右）
 * dy: 段の変化量（正=下, 負=上） ※先手にとって「前」は上方向=負
 * range: trueなら走り駒（複数マス移動可能）
 * jump: trueなら途中の駒を飛び越える（桂馬）
 */
interface MoveDirection {
  dx: number;
  dy: number;
  range: boolean;
  jump?: boolean;
}

const ALL_DIRECTIONS_ONE: MoveDirection[] = [
  { dx: -1, dy: -1, range: false },
  { dx: 0, dy: -1, range: false },
  { dx: 1, dy: -1, range: false },
  { dx: -1, dy: 0, range: false },
  { dx: 1, dy: 0, range: false },
  { dx: -1, dy: 1, range: false },
  { dx: 0, dy: 1, range: false },
  { dx: 1, dy: 1, range: false },
];

const KIN_MOVES: MoveDirection[] = [
  { dx: -1, dy: -1, range: false }, // 左前
  { dx: 0, dy: -1, range: false },  // 前
  { dx: 1, dy: -1, range: false },  // 右前
  { dx: -1, dy: 0, range: false },  // 左
  { dx: 1, dy: 0, range: false },   // 右
  { dx: 0, dy: 1, range: false },   // 後
];

export const PIECE_MOVES: Record<PieceType, MoveDirection[]> = {
  // 王将・玉将：全方向1マス
  ou: ALL_DIRECTIONS_ONE,
  gyoku: ALL_DIRECTIONS_ONE,

  // 飛車：十字方向に走る
  hisha: [
    { dx: 0, dy: -1, range: true },
    { dx: 0, dy: 1, range: true },
    { dx: -1, dy: 0, range: true },
    { dx: 1, dy: 0, range: true },
  ],

  // 角行：斜め4方向に走る
  kaku: [
    { dx: -1, dy: -1, range: true },
    { dx: 1, dy: -1, range: true },
    { dx: -1, dy: 1, range: true },
    { dx: 1, dy: 1, range: true },
  ],

  // 金将：前・左前・右前・左・右・後の6方向
  kin: KIN_MOVES,

  // 銀将：前・左前・右前・左後・右後の5方向
  gin: [
    { dx: -1, dy: -1, range: false },
    { dx: 0, dy: -1, range: false },
    { dx: 1, dy: -1, range: false },
    { dx: -1, dy: 1, range: false },
    { dx: 1, dy: 1, range: false },
  ],

  // 桂馬：前方2マス＋左右1マス（跳ねる）
  kei: [
    { dx: -1, dy: -2, range: false, jump: true },
    { dx: 1, dy: -2, range: false, jump: true },
  ],

  // 香車：前方向に走る
  kyou: [
    { dx: 0, dy: -1, range: true },
  ],

  // 歩兵：前方1マス
  fu: [
    { dx: 0, dy: -1, range: false },
  ],

  // 龍王（成飛車）：飛車の動き＋斜め1マス
  ryuu: [
    { dx: 0, dy: -1, range: true },
    { dx: 0, dy: 1, range: true },
    { dx: -1, dy: 0, range: true },
    { dx: 1, dy: 0, range: true },
    { dx: -1, dy: -1, range: false },
    { dx: 1, dy: -1, range: false },
    { dx: -1, dy: 1, range: false },
    { dx: 1, dy: 1, range: false },
  ],

  // 龍馬（成角行）：角の動き＋十字1マス
  uma: [
    { dx: -1, dy: -1, range: true },
    { dx: 1, dy: -1, range: true },
    { dx: -1, dy: 1, range: true },
    { dx: 1, dy: 1, range: true },
    { dx: 0, dy: -1, range: false },
    { dx: 0, dy: 1, range: false },
    { dx: -1, dy: 0, range: false },
    { dx: 1, dy: 0, range: false },
  ],

  // 成駒（と金・成銀・成桂・成香）：金と同じ動き
  tokin: KIN_MOVES,
  narigin: KIN_MOVES,
  narikei: KIN_MOVES,
  narikyou: KIN_MOVES,
};

// ==========================================
// 成り対応表
// ==========================================

/** 成り前 → 成り後 */
export const PROMOTION_MAP: Partial<Record<KomaType, NariKomaType>> = {
  hisha: 'ryuu',
  kaku: 'uma',
  gin: 'narigin',
  kei: 'narikei',
  kyou: 'narikyou',
  fu: 'tokin',
};
// 金将・王将/玉将は成れない

/** 成り後 → 成り前（取った駒を持ち駒にする際に使用） */
export const DEMOTION_MAP: Record<NariKomaType, KomaType> = {
  ryuu: 'hisha',
  uma: 'kaku',
  narigin: 'gin',
  narikei: 'kei',
  narikyou: 'kyou',
  tokin: 'fu',
};

/** 成駒かどうかを判定 */
export function isPromoted(type: PieceType): type is NariKomaType {
  return type in DEMOTION_MAP;
}

/** 駒を元に戻す（成駒なら元の駒、そうでなければそのまま） */
export function demote(type: PieceType): KomaType {
  if (isPromoted(type)) {
    return DEMOTION_MAP[type];
  }
  return type as KomaType;
}

// ==========================================
// 初期配置
// ==========================================

const G = (type: PieceType): Piece => ({ type, owner: 'gote' });
const S = (type: PieceType): Piece => ({ type, owner: 'sente' });
const _ = null;

/**
 * 初期配置（平手）
 * board[dan-1][suji-1] でアクセス
 * 配列のインデックス: [0]=9筋, [1]=8筋, ..., [8]=1筋
 * ※内部配列は9筋(左)→1筋(右)の順序
 */
export const INITIAL_BOARD: (Piece | null)[][] = [
  // 1段目（後手陣）: 9筋から1筋
  [G('kyou'), G('kei'), G('gin'), G('kin'), G('gyoku'), G('kin'), G('gin'), G('kei'), G('kyou')],
  // 2段目: 飛(8筋=index1)、角(2筋=index7)
  [_, G('hisha'), _, _, _, _, _, G('kaku'), _],
  // 3段目: 歩×9
  [G('fu'), G('fu'), G('fu'), G('fu'), G('fu'), G('fu'), G('fu'), G('fu'), G('fu')],
  // 4段目: 空
  [_, _, _, _, _, _, _, _, _],
  // 5段目: 空
  [_, _, _, _, _, _, _, _, _],
  // 6段目: 空
  [_, _, _, _, _, _, _, _, _],
  // 7段目: 歩×9
  [S('fu'), S('fu'), S('fu'), S('fu'), S('fu'), S('fu'), S('fu'), S('fu'), S('fu')],
  // 8段目: 角(8筋=index1)、飛(2筋=index7)
  [_, S('kaku'), _, _, _, _, _, S('hisha'), _],
  // 9段目（先手陣）: 9筋から1筋
  [S('kyou'), S('kei'), S('gin'), S('kin'), S('ou'), S('kin'), S('gin'), S('kei'), S('kyou')],
];

// ==========================================
// 駒の表示名
// ==========================================

export const PIECE_NAMES: Record<PieceType, string> = {
  ou: '王将',
  gyoku: '玉将',
  hisha: '飛車',
  kaku: '角行',
  kin: '金将',
  gin: '銀将',
  kei: '桂馬',
  kyou: '香車',
  fu: '歩兵',
  ryuu: '龍王',
  uma: '龍馬',
  narigin: '成銀',
  narikei: '成桂',
  narikyou: '成香',
  tokin: 'と金',
};

/** KIF表記用の短縮名 */
export const PIECE_KANJI: Record<PieceType, string> = {
  ou: '王',
  gyoku: '玉',
  hisha: '飛',
  kaku: '角',
  kin: '金',
  gin: '銀',
  kei: '桂',
  kyou: '香',
  fu: '歩',
  ryuu: '龍',
  uma: '馬',
  narigin: '成銀',
  narikei: '成桂',
  narikyou: '成香',
  tokin: 'と',
};

/** 数字→漢数字の変換 */
export const SUJI_KANJI = ['', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
export const DAN_KANJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 駒の価値（AI評価関数用） */
export const PIECE_VALUES: Record<PieceType, number> = {
  fu: 100,
  kyou: 300,
  kei: 350,
  gin: 500,
  kin: 550,
  kaku: 800,
  hisha: 1000,
  ou: 0,
  gyoku: 0,
  tokin: 600,
  narikyou: 550,
  narikei: 550,
  narigin: 550,
  uma: 1050,
  ryuu: 1200,
};
