// 型定義
export type {
  Player,
  KomaType,
  NariKomaType,
  PieceType,
  Piece,
  Position,
  Mochigoma,
  BoardState,
  MoveAction,
  DropAction,
  Action,
  GameState,
  GameStatus,
  FoulType,
} from './types';

// 定数
export {
  PIECE_MOVES,
  PROMOTION_MAP,
  DEMOTION_MAP,
  INITIAL_BOARD,
  PIECE_NAMES,
  PIECE_KANJI,
  PIECE_VALUES,
  SUJI_KANJI,
  DAN_KANJI,
  isPromoted,
  demote,
} from './constants';

// 盤面操作
export {
  createInitialBoard,
  cloneBoard,
  getPieceAt,
  setPieceAt,
  getMochigoma,
  addMochigoma,
  removeMochigoma,
  boardHash,
  findOu,
  isValidPosition,
  opponent,
} from './board';

// ルール判定
export {
  generatePseudoMoves,
  generatePseudoDrops,
  generateLegalMoves,
  validateMove,
  isInCheck,
  isAttackedBy,
  wouldBeInCheck,
  applyActionToBoard,
  isNifu,
  isUchifuzume,
  hasNoLegalSquare,
  promotionStatus,
  isCheckmate,
  isSennichite,
  isJishogi,
} from './rules';

// ゲーム進行
export {
  createGame,
  applyMove,
  resign,
  isGameOver,
  undoMove,
  countLegalMoves,
} from './game';

// 棋譜表記
export type { KifMetadata } from './notation';
export {
  moveToKif,
  gameToKif,
  parseKif,
} from './notation';
