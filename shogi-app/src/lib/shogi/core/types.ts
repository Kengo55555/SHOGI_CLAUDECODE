/** 手番 */
export type Player = 'sente' | 'gote';

/** 駒の種類（成り前） */
export type KomaType =
  | 'gyoku'   // 玉将（後手の王）
  | 'ou'      // 王将（先手の王）
  | 'hisha'   // 飛車
  | 'kaku'    // 角行
  | 'kin'     // 金将
  | 'gin'     // 銀将
  | 'kei'     // 桂馬
  | 'kyou'    // 香車
  | 'fu';     // 歩兵

/** 成駒の種類 */
export type NariKomaType =
  | 'ryuu'     // 龍王（成飛車）
  | 'uma'      // 龍馬（成角行）
  | 'narigin'  // 成銀
  | 'narikei'  // 成桂
  | 'narikyou' // 成香
  | 'tokin';   // と金（成歩）

/** 駒（成り含む） */
export type PieceType = KomaType | NariKomaType;

/** 盤上の駒 */
export interface Piece {
  type: PieceType;
  owner: Player;
}

/**
 * 盤面座標
 * 将棋の慣例：右上が1一(1,1)、左下が9九(9,9)
 */
export interface Position {
  suji: number;  // 筋 (1-9, 右から左)
  dan: number;   // 段 (1-9, 上から下)
}

/** 持ち駒（種類ごとの枚数） */
export type Mochigoma = Partial<Record<KomaType, number>>;

/** 盤面の状態 */
export interface BoardState {
  /** 9×9の盤面。board[dan-1][suji-1] でアクセス */
  board: (Piece | null)[][];
  /** 先手の持ち駒 */
  senteMochigoma: Mochigoma;
  /** 後手の持ち駒 */
  goteMochigoma: Mochigoma;
}

/** 駒の移動 */
export interface MoveAction {
  type: 'move';
  from: Position;
  to: Position;
  promote: boolean;
}

/** 駒を打つ */
export interface DropAction {
  type: 'drop';
  piece: KomaType;
  to: Position;
}

/** 指し手 */
export type Action = MoveAction | DropAction;

/** ゲームの状態 */
export interface GameState {
  boardState: BoardState;
  teban: Player;
  moveHistory: Action[];
  positionHistory: string[];
  status: GameStatus;
  moveCount: number;
}

/** ゲームのステータス */
export type GameStatus =
  | { type: 'playing' }
  | { type: 'checkmate'; winner: Player }
  | { type: 'resign'; winner: Player }
  | { type: 'timeout'; winner: Player }
  | { type: 'disconnect'; winner: Player }
  | { type: 'draw'; reason: 'sennichite' | 'jishogi' }
  | { type: 'foul'; loser: Player; reason: FoulType };

/** 反則の種類 */
export type FoulType = 'nifu' | 'uchifuzume' | 'oute_hochi' | 'ikinokori_nashi';
