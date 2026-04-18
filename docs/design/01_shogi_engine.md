# 将棋エンジン設計書

| 項目 | 内容 |
|------|------|
| 文書ID | DD-01 |
| 対象機能 | 将棋ルールエンジン（ゲームロジック） |
| 関連要件 | F-04, F-05, F-08, F-16, CLAUDE.md |
| バージョン | 1.0 |

---

## 1. 概要

将棋のルールを正確に実装する純粋TypeScriptモジュール。クライアント（UX向上のための先行判定）とサーバー（正式判定・不正防止）の両方で動作する。ゲームの正当性を保証する最も重要なモジュールである。

**設計原則：**
- 純粋関数で実装し、副作用を持たない
- イミュータブルなデータ構造を基本とする
- クライアント・サーバーで同一コードを共有する（`src/lib/shogi/core/`）

---

## 2. モジュール構成

```
src/lib/shogi/core/
├── types.ts          # 型定義（駒、盤面、座標、指し手等）
├── constants.ts      # 定数（初期配置、駒の動き定義）
├── board.ts          # 盤面操作（生成、コピー、表示）
├── move.ts           # 指し手の生成・実行
├── rules.ts          # ルール判定（合法手、禁じ手、詰み等）
├── game.ts           # ゲーム進行管理（状態遷移）
├── notation.ts       # 棋譜表記変換（KIF, CSA）
└── index.ts          # エクスポート
```

---

## 3. 型定義（types.ts）

```typescript
/** 手番 */
export type Player = 'sente' | 'gote';

/** 駒の種類（成り前） */
export type KomaType =
  | 'gyoku'   // 玉将 (後手の王)
  | 'ou'      // 王将 (先手の王)
  | 'hisha'   // 飛車
  | 'kaku'    // 角行
  | 'kin'     // 金将
  | 'gin'     // 銀将
  | 'kei'     // 桂馬
  | 'kyou'    // 香車
  | 'fu';     // 歩兵

/** 成駒の種類 */
export type NariKomaType =
  | 'ryuu'    // 龍王（成飛車）
  | 'uma'     // 龍馬（成角行）
  | 'narigin' // 成銀
  | 'narikei' // 成桂
  | 'narikyou'// 成香
  | 'tokin';  // と金（成歩）

/** 駒（成り含む） */
export type PieceType = KomaType | NariKomaType;

/** 盤上の駒 */
export interface Piece {
  type: PieceType;
  owner: Player;
}

/** 盤面座標（筋: 1-9, 段: 1-9）
 *  将棋の慣例：右上が1一(1,1)、左下が9九(9,9)
 */
export interface Position {
  suji: number;  // 筋 (1-9, 右から左)
  dan: number;   // 段 (1-9, 上から下)
}

/** 持ち駒（種類ごとの枚数） */
export type Mochigoma = Partial<Record<KomaType, number>>;
// 注：持ち駒には成駒は含まない（取った時点で元に戻る）
// 注：'ou'/'gyoku'は持ち駒にならない

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
  promote: boolean;  // 成るかどうか
}

/** 駒を打つ */
export interface DropAction {
  type: 'drop';
  piece: KomaType;   // 打つ駒の種類（成駒は打てない）
  to: Position;
}

/** 指し手 */
export type Action = MoveAction | DropAction;

/** ゲームの状態 */
export interface GameState {
  boardState: BoardState;
  teban: Player;          // 現在の手番
  moveHistory: Action[];  // 指し手履歴
  positionHistory: string[]; // 局面ハッシュ履歴（千日手判定用）
  status: GameStatus;
  moveCount: number;      // 手数
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
```

---

## 4. 定数定義（constants.ts）

### 4.1 初期配置

```typescript
/**
 * 初期配置（平手）
 * 将棋の標準初期配置を正確に再現する
 * 配列は [段][筋] = board[dan-1][suji-1]
 */
export const INITIAL_BOARD: (Piece | null)[][] = [
  // 1段目（後手側）: 香桂銀金王金銀桂香（9筋→1筋）
  [
    { type: 'kyou', owner: 'gote' },
    { type: 'kei',  owner: 'gote' },
    { type: 'gin',  owner: 'gote' },
    { type: 'kin',  owner: 'gote' },
    { type: 'gyoku',owner: 'gote' },
    { type: 'kin',  owner: 'gote' },
    { type: 'gin',  owner: 'gote' },
    { type: 'kei',  owner: 'gote' },
    { type: 'kyou', owner: 'gote' },
  ],
  // 2段目: 飛(8筋)、角(2筋)
  // ... 省略（実装時に完全な配列を定義）
  // 3段目: 歩×9
  // 4〜6段目: 空
  // 7段目: 歩×9
  // 8段目: 角(8筋)、飛(2筋)
  // 9段目（先手側）: 香桂銀金王金銀桂香
];
```

### 4.2 駒の動き定義

```typescript
/** 駒の移動可能方向（先手基準、後手は反転） */
export const PIECE_MOVES: Record<PieceType, { dx: number; dy: number; range: boolean }[]> = {
  ou:    [/* 全方向1マス: 8方向 */],
  gyoku: [/* ouと同じ */],
  hisha: [/* 十字方向に走る（range: true） */],
  kaku:  [/* 斜め4方向に走る（range: true） */],
  kin:   [/* 前・左前・右前・左・右・後の6方向1マス */],
  gin:   [/* 前・左前・右前・左後・右後の5方向1マス */],
  kei:   [/* 前方2マス＋左右1マスの2方向（跳ねる） */],
  kyou:  [/* 前方向に走る（range: true） */],
  fu:    [/* 前方1マス */],
  ryuu:  [/* 飛車の動き＋斜め1マス */],
  uma:   [/* 角の動き＋十字1マス */],
  tokin: [/* 金と同じ動き */],
  narigin: [/* 金と同じ動き */],
  narikei: [/* 金と同じ動き */],
  narikyou:[/* 金と同じ動き */],
};

/** 成り対応表 */
export const PROMOTION_MAP: Partial<Record<KomaType, NariKomaType>> = {
  hisha: 'ryuu',
  kaku:  'uma',
  gin:   'narigin',
  kei:   'narikei',
  kyou:  'narikyou',
  fu:    'tokin',
};
// 金将・王将/玉将は成れない

/** 成り駒→元駒の対応（取った駒を持ち駒にする際に使用） */
export const DEMOTION_MAP: Record<NariKomaType, KomaType> = {
  ryuu:     'hisha',
  uma:      'kaku',
  narigin:  'gin',
  narikei:  'kei',
  narikyou: 'kyou',
  tokin:    'fu',
};
```

---

## 5. 盤面操作（board.ts）

### 5.1 公開関数

```typescript
/** 初期盤面を生成 */
function createInitialBoard(): BoardState;

/** 盤面をディープコピー */
function cloneBoard(state: BoardState): BoardState;

/** 指定位置の駒を取得 */
function getPieceAt(state: BoardState, pos: Position): Piece | null;

/** 指定位置に駒を配置（新しいBoardStateを返す） */
function setPieceAt(state: BoardState, pos: Position, piece: Piece | null): BoardState;

/** 指定プレイヤーの持ち駒を取得 */
function getMochigoma(state: BoardState, player: Player): Mochigoma;

/** 持ち駒に1枚追加 */
function addMochigoma(state: BoardState, player: Player, piece: KomaType): BoardState;

/** 持ち駒から1枚削除 */
function removeMochigoma(state: BoardState, player: Player, piece: KomaType): BoardState;

/** 盤面のハッシュ文字列を生成（千日手判定用） */
function boardHash(state: BoardState, teban: Player): string;

/** 指定プレイヤーの王の位置を取得 */
function findOu(state: BoardState, player: Player): Position | null;
```

---

## 6. ルール判定（rules.ts）

### 6.1 合法手生成

```typescript
/**
 * 指定プレイヤーの全合法手を生成する
 * 王手放置・自殺手を除外した、完全な合法手リスト
 */
function generateLegalMoves(game: GameState): Action[];

/**
 * 駒の移動候補を生成（合法手フィルタ前）
 */
function generatePseudoMoves(state: BoardState, player: Player): MoveAction[];

/**
 * 打ち手の候補を生成（合法手フィルタ前）
 */
function generatePseudoDrops(state: BoardState, player: Player): DropAction[];
```

### 6.2 合法性チェック

```typescript
/**
 * 指し手が合法かどうかを判定する
 * サーバーサイドでの最終判定に使用
 * @returns { legal: true } | { legal: false; reason: string }
 */
function validateMove(game: GameState, action: Action):
  | { legal: true }
  | { legal: false; reason: FoulType | 'invalid' };
```

### 6.3 判定ロジック（内部関数）

```typescript
/** 王手されているか */
function isInCheck(state: BoardState, player: Player): boolean;

/** 指し手を適用した結果、自玉が王手されるか（自殺手判定） */
function wouldBeInCheck(state: BoardState, action: Action, player: Player): boolean;

/**
 * 二歩判定
 * 同じ筋に未成の歩が既にある場合は禁じ手
 */
function isNifu(state: BoardState, suji: number, player: Player): boolean;

/**
 * 打ち歩詰め判定
 * 歩を打って相手の王が詰みになる場合は禁じ手
 * ※突き歩詰め（盤上の歩を進めて詰み）は合法
 */
function isUchifuzume(state: BoardState, dropPos: Position, player: Player): boolean;

/**
 * 行き所のない駒の判定
 * 歩・香：相手の1段目（先手なら1段目、後手なら9段目）に打てない/移動時は強制成り
 * 桂：相手の1〜2段目に打てない/移動時は強制成り
 */
function hasNoLegalSquare(pieceType: KomaType, pos: Position, player: Player): boolean;

/**
 * 成り判定
 * - 敵陣（相手側3段）に入る・出る・動く際に成れる
 * - 行き所がなくなる場合は強制成り
 * @returns 'must' | 'can' | 'cannot'
 */
function promotionStatus(piece: Piece, from: Position, to: Position): 'must' | 'can' | 'cannot';

/** 詰み判定 */
function isCheckmate(game: GameState): boolean;

/**
 * 千日手判定
 * 同一局面（盤面＋持ち駒＋手番）が4回出現したら千日手
 */
function isSennichite(game: GameState): boolean;

/**
 * 持将棋判定（簡易版・MVP）
 * 双方の王が入玉（4段目以上に進出）している場合に判定
 * 大駒（飛車・角）5点、小駒1点で計算、双方24点以上なら引き分け
 */
function isJishogi(game: GameState): boolean;
```

---

## 7. ゲーム進行管理（game.ts）

### 7.1 公開関数

```typescript
/** 新規ゲームを開始 */
function createGame(): GameState;

/**
 * 指し手を適用する
 * 1. 合法性チェック
 * 2. 盤面更新（駒移動、取り駒処理、成り処理）
 * 3. 手番交代
 * 4. 終局判定（詰み、千日手）
 * @returns 更新後のGameState（不正な手の場合はエラー）
 */
function applyMove(game: GameState, action: Action):
  | { success: true; game: GameState }
  | { success: false; reason: string };

/** 投了 */
function resign(game: GameState): GameState;

/** ゲームが終了しているか */
function isGameOver(game: GameState): boolean;

/** 待った（CPU戦のみ・1手戻す） */
function undoMove(game: GameState): GameState | null;
```

### 7.2 指し手適用フロー

```
applyMove(game, action)
  │
  ├── validateMove(game, action)
  │     ├── 手番チェック
  │     ├── 移動: from に自分の駒があるか
  │     ├── 移動: to が移動可能か（駒の動きルール）
  │     ├── 移動: to に自分の駒がないか
  │     ├── 移動: 走り駒の経路に駒がないか
  │     ├── 移動: 成りの可否チェック
  │     ├── 打ち: 持ち駒にその駒があるか
  │     ├── 打ち: to が空きマスか
  │     ├── 打ち: 二歩チェック（歩の場合）
  │     ├── 打ち: 行き所チェック
  │     ├── 共通: 自殺手チェック（王手放置）
  │     └── 打ち: 打ち歩詰めチェック（歩の場合）
  │
  ├── executeMoveOnBoard(boardState, action)
  │     ├── 駒を移動 / 配置
  │     ├── 取り駒があれば持ち駒に追加（成駒は元に戻す）
  │     └── 成りの場合は駒種を変更
  │
  ├── updateGameState()
  │     ├── 手番交代
  │     ├── 手数+1
  │     ├── 指し手履歴に追加
  │     └── 局面ハッシュ履歴に追加
  │
  └── checkGameEnd()
        ├── isCheckmate() → 詰み判定
        ├── isSennichite() → 千日手判定
        └── isJishogi() → 持将棋判定（簡易）
```

---

## 8. 棋譜表記変換（notation.ts）

### 8.1 公開関数

```typescript
/** 指し手をKIF形式の文字列に変換 */
function moveToKif(action: Action, prevAction: Action | null, piece: Piece): string;
// 例: "７六歩", "同　銀成", "３四角打"

/** ゲーム全体をKIF形式に変換 */
function gameToKif(game: GameState, metadata: KifMetadata): string;

/** KIF形式の文字列をパースしてAction配列に変換 */
function parseKif(kif: string): { metadata: KifMetadata; moves: Action[] };

/** CSA形式への変換（将来対応） */
function moveToCsa(action: Action): string;
```

### 8.2 KIF形式の仕様

```
# ---- ヘッダ ----
開始日時：2026/04/19 20:00:00
先手：ユーザーA
後手：ユーザーB
手合割：平手

# ---- 指し手 ----
   1 ７六歩(77)
   2 ３四歩(34)
   3 ２六歩(27)
   ...
  42 投了

# ---- 結果 ----
まで41手で先手の勝ち
```

---

## 9. テスト戦略

### 9.1 テストカテゴリ

| カテゴリ | テスト内容 | 件数目安 |
|---------|-----------|---------|
| 駒の動き | 全駒種の移動可能マス生成 | 各駒5-10ケース |
| 成り判定 | 成り可能/強制成り/成り不可の判定 | 20ケース |
| 禁じ手 | 二歩、打ち歩詰め、行き所なし、王手放置 | 各5-10ケース |
| 合法手生成 | 特定局面での全合法手リスト | 10ケース |
| 詰み判定 | 詰み局面、不詰み局面 | 20ケース |
| 千日手 | 同一局面4回出現の検出 | 5ケース |
| KIF変換 | 指し手→KIF文字列の正確性 | 全駒種×主要パターン |

### 9.2 テスト方針

- **ルールの正確性が最優先**。テストカバレッジ100%を目指す
- 有名な詰将棋（3手詰め等）をテストケースとして使用
- エッジケース：入玉局面、持ち駒が大量にある局面、王手の連続
- プロパティベーステスト：ランダム局面から生成した合法手は全て実行可能であること
