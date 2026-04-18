# 戦績管理・棋譜機能設計書

| 項目 | 内容 |
|------|------|
| 文書ID | DD-06 |
| 対象機能 | F-12 勝敗記録, F-13 棋譜保存・再生, F-14 レーティング（2nd）, F-15 統計分析（2nd） |
| 関連要件 | 要件定義書 §3.5 |
| バージョン | 1.0 |

---

## 1. 概要

対局結果の記録・戦績の閲覧・棋譜の保存と再生機能を提供する。MVPでは基本的な勝敗記録と棋譜保存・再生を実装する。

---

## 2. 戦績記録

### 2.1 記録されるデータ

対局終了時に自動的に記録される項目：

| 項目 | 保存先 | 説明 |
|------|--------|------|
| 対局日時 | matches.started_at / ended_at | 開始・終了時刻 |
| 対戦相手 | matches.sente_id / gote_id / cpu_level | 人間またはCPUレベル |
| 先手/後手 | matches.sente_id | 自分がどちらだったか |
| 勝敗 | matches.winner_id | 勝者のユーザーID |
| 決まり手 | matches.result_type | 詰み/投了/時間切れ/接続断/引き分け |
| 総手数 | matches.total_moves | 対局の手数 |
| 消費時間 | matches.sente_time_used / gote_time_used | 各プレイヤーの消費時間 |
| 棋譜 | game_records.kifu_kif / moves_json | KIF形式テキスト＋JSON |

### 2.2 対局終了時の保存処理

```typescript
async function saveMatchResult(room: GameRoom): Promise<void> {
  const { gameState, matchId } = room;

  await db.$transaction(async (tx) => {
    // 1. matchesレコード更新
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: 'finished',
        winnerId: determineWinner(gameState),
        resultType: gameState.status.type,
        totalMoves: gameState.moveCount,
        senteTimeUsed: calculateTimeUsed(room, 'sente'),
        goteTimeUsed: calculateTimeUsed(room, 'gote'),
        endedAt: new Date(),
      }
    });

    // 2. 棋譜保存
    await tx.gameRecord.create({
      data: {
        matchId,
        kifuKif: gameToKif(gameState, buildKifMetadata(room)),
        movesJson: gameState.moveHistory,
      }
    });
  });
}
```

---

## 3. 戦績一覧API

### 3.1 GET /api/matches

**クエリパラメータ：**
- `limit`: number（デフォルト20、最大50）
- `cursor`: string（ページネーション、ended_atベース）
- `opponent`: 'cpu' | 'human' | 'all'（デフォルト'all'）

**レスポンス：**
```json
{
  "matches": [
    {
      "id": "uuid",
      "opponent": {
        "type": "human",
        "handleName": "将棋太郎"
      },
      "mySide": "sente",
      "result": "win",
      "resultType": "checkmate",
      "totalMoves": 87,
      "myTimeUsed": 423,
      "timeControl": 15,
      "startedAt": "2026-04-19T20:00:00Z",
      "endedAt": "2026-04-19T20:23:45Z"
    },
    {
      "id": "uuid",
      "opponent": {
        "type": "cpu",
        "level": 2,
        "levelName": "中級"
      },
      "mySide": "gote",
      "result": "lose",
      "resultType": "timeout",
      "totalMoves": 52,
      "myTimeUsed": 600,
      "timeControl": 10,
      "startedAt": "2026-04-19T19:00:00Z",
      "endedAt": "2026-04-19T19:10:32Z"
    }
  ],
  "summary": {
    "totalGames": 42,
    "wins": 25,
    "losses": 15,
    "draws": 2
  },
  "nextCursor": "2026-04-18T18:00:00Z"
}
```

---

## 4. 棋譜保存・再生

### 4.1 棋譜データ形式

**DB保存形式：**
- `kifu_kif`（TEXT）：KIF形式の文字列（人間可読・エクスポート用）
- `moves_json`（JSONB）：指し手配列（プログラム処理用）

```typescript
// moves_json の構造
interface StoredMove {
  action: Action;           // 指し手データ
  timestamp: number;        // 指し手のタイムスタンプ（対局開始からの経過秒）
  timeRemaining: number;    // 残り持ち時間（秒）
}
```

### 4.2 GET /api/matches/:id/kifu

**レスポンス：**
```json
{
  "matchId": "uuid",
  "kifText": "開始日時：2026/04/19...\n1 ７六歩(77)\n...",
  "moves": [
    {
      "moveNumber": 1,
      "action": { "type": "move", "from": {"suji":7,"dan":7}, "to": {"suji":7,"dan":6}, "promote": false },
      "timestamp": 5,
      "timeRemaining": 595,
      "notation": "７六歩"
    }
  ],
  "metadata": {
    "sente": "将棋太郎",
    "gote": "CPU（中級）",
    "timeControl": 10,
    "result": "まで87手で先手の勝ち",
    "startedAt": "2026-04-19T20:00:00Z"
  }
}
```

### 4.3 棋譜再生コンポーネント設計

```typescript
interface KifuPlayerProps {
  moves: StoredMove[];
  metadata: KifuMetadata;
}

interface KifuPlayerState {
  currentMoveIndex: number;    // 現在表示中の手数（-1 = 初期局面）
  isAutoPlaying: boolean;      // 自動再生中か
  autoPlaySpeed: number;       // 自動再生速度（ミリ秒/手）
  boardState: BoardState;      // 現在の盤面
}

// 操作
function goToStart(): void;      // 初期局面へ
function goBack(): void;         // 1手戻る
function goForward(): void;      // 1手進める
function goToEnd(): void;        // 最終局面へ
function goToMove(n: number): void; // n手目へジャンプ
function toggleAutoPlay(): void; // 自動再生ON/OFF
function setSpeed(ms: number): void; // 速度変更
```

### 4.4 KIFエクスポート

```typescript
// GET /api/matches/:id/kifu/download
// Content-Type: text/plain; charset=Shift_JIS
// Content-Disposition: attachment; filename="kifu_20260419.kif"
```

**注意：** KIF形式の標準文字コードはShift_JISだが、UTF-8版も提供する。

---

## 5. 画面設計

### 5.1 S-08 戦績一覧画面

```
┌──────────────────────────────┐
│  戦績                         │
│                              │
│  通算: 42戦 25勝 15敗 2分    │
│  勝率: 62.5%                 │
│                              │
│  フィルタ: [全て▼]            │
│                              │
│  ┌──────────────────────────┐│
│  │ 04/19 20:00              ││
│  │ vs 将棋太郎  ☗先手        ││
│  │ ◯ 勝ち（詰み・87手）     ││
│  │ 15分切れ負け              ││
│  │          [棋譜を見る]     ││
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ 04/19 19:00              ││
│  │ vs CPU（中級）☖後手       ││
│  │ ✕ 負け（時間切れ・52手）  ││
│  │ 10分切れ負け              ││
│  │          [棋譜を見る]     ││
│  └──────────────────────────┘│
│                              │
│  [もっと見る]                 │
└──────────────────────────────┘
```

### 5.2 S-09 棋譜再生画面

```
┌──────────────────────────────────────┐
│  棋譜再生                              │
│  将棋太郎 vs 駒太郎 (2026/04/19)       │
│                                      │
│  ┌─────────────────┐  ┌────────────┐ │
│  │                 │  │ 棋譜リスト  │ │
│  │                 │  │            │ │
│  │    将棋盤        │  │ 1 ７六歩   │ │
│  │                 │  │ 2 ３四歩   │ │
│  │                 │  │ 3 ２六歩   │ │
│  │                 │  │ 4 ８四歩   │ │
│  │                 │  │ ...        │ │
│  │                 │  │ 87 投了    │ │
│  └─────────────────┘  └────────────┘ │
│                                      │
│  [|◁] [◁] [  ▶  ] [▷] [▷|]          │
│  初手  戻る  再生  進む  最終           │
│                                      │
│  速度: [遅い ──●── 速い]              │
│                                      │
│  23手目 / 87手                        │
│                                      │
│  [KIFダウンロード]                     │
└──────────────────────────────────────┘
```

---

## 6. 2ndリリース：レーティング（設計メモ）

### 6.1 イロレーティング方式

```typescript
const K = 32;  // K値（初期は32、対局数が増えたら16に下げる）

function calculateNewRating(
  myRating: number,
  opponentRating: number,
  result: 1 | 0 | 0.5  // 勝ち | 負け | 引き分け
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  return Math.round(myRating + K * (result - expected));
}
```

- 初期レーティング：1500
- CPU対戦はレーティング対象外
- オンライン対戦のみレーティング変動

### 6.2 2ndリリース：統計分析（設計メモ）

- 勝率の推移グラフ（直近20局の移動平均）
- 先手/後手別の勝率
- 決まり手の分布（詰み/投了/時間切れ）
- 平均手数
- 対局時間帯の分布

---

## 7. テスト観点

| テスト項目 | 内容 |
|-----------|------|
| 対局結果保存 | 全項目が正しく保存されること |
| 棋譜KIF形式 | 生成されたKIF文字列が仕様に準拠すること |
| 棋譜再生 | 任意の手数に移動して正しい盤面が表示されること |
| 棋譜再生 | 初手→最終手→初手の往復で盤面が一致すること |
| 戦績集計 | 勝敗数・勝率が正しいこと |
| ページネーション | カーソルベースのページングが正しく動作すること |
| KIFエクスポート | ダウンロードしたファイルが他の将棋ソフトで読めること |
