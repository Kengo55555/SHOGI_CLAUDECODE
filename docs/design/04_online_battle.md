# オンライン対戦設計書

| 項目 | 内容 |
|------|------|
| 文書ID | DD-04 |
| 対象機能 | F-06 対戦募集シグナル, F-07 対戦応諾, F-08 対局進行 |
| 関連要件 | 要件定義書 §3.3 |
| バージョン | 1.0 |

---

## 1. 概要

「対戦募集シグナル → 応諾制」によるオンライン対戦マッチングシステム。WebSocketによるリアルタイム対局進行を実現する。

---

## 2. マッチングフロー

### 2.1 全体シーケンス

```
[ユーザーA]           [サーバー]           [ユーザーB]        [全ユーザー]
    │                    │                    │                  │
    ├── 対戦募集作成 ───→│                    │                  │
    │                    ├── match_requests作成│                  │
    │                    ├── 通知作成（全員）──│──────────────────→│
    │                    ├── メール送信（opt-in）                 │
    │←── 募集完了 ───────┤                    │                  │
    │                    │                    │                  │
    │                    │←── 応諾リクエスト ─┤                  │
    │                    ├── トランザクション開始                  │
    │                    │   ├── 募集ステータスチェック（open?）    │
    │                    │   ├── status→accepted                 │
    │                    │   ├── 先手/後手ランダム決定             │
    │                    │   ├── matchesレコード作成               │
    │                    │   └── コミット                         │
    │                    │                    │                  │
    │←── 対局開始通知 ──┤──→ 対局開始通知 ──→│                  │
    │                    │                    │                  │
    │── join_match ────→│←── join_match ─────┤                  │
    │←── match_joined ──┤──→ match_joined ──→│                  │
    │                    │                    │                  │
    │   ======== 対局進行（§3参照）========    │                  │
```

### 2.2 同時応諾の排他制御

複数ユーザーが同時に応諾ボタンを押すケースへの対策：

```sql
-- PostgreSQLの行ロックで先着1名に限定
UPDATE match_requests
SET status = 'accepted', responder_id = $1
WHERE id = $2 AND status = 'open'
RETURNING *;
-- 影響行数が0なら「既に応諾済み」としてエラー返却
```

---

## 3. API詳細設計

### 3.1 POST /api/match-requests（対戦募集作成）

**リクエスト：**
```json
{
  "timeControl": 10
}
```

**処理：**
1. 既に自分のopen募集がないかチェック（1件制限）
2. レート制限チェック（3件/時間）
3. match_requestsに`open`ステータスで作成（expires_at = now + 30分）
4. 全ユーザーへの通知作成（notificationsテーブル一括insert）
5. WebSocketで接続中の全ユーザーへリアルタイム通知
6. メール通知対象ユーザーへメール送信（非同期キュー）

**レスポンス：**
```json
{
  "id": "uuid",
  "timeControl": 10,
  "status": "open",
  "expiresAt": "2026-04-19T21:00:00Z"
}
```

### 3.2 GET /api/match-requests（募集一覧）

**クエリパラメータ：**
- `status`: open（デフォルト）

**レスポンス：**
```json
{
  "requests": [
    {
      "id": "uuid",
      "requester": {
        "id": "uuid",
        "handleName": "将棋太郎"
      },
      "timeControl": 10,
      "expiresAt": "2026-04-19T21:00:00Z",
      "createdAt": "2026-04-19T20:30:00Z"
    }
  ]
}
```

### 3.3 POST /api/match-requests/:id/accept（応諾）

**処理：**
1. 自分の募集に自分で応諾していないかチェック
2. トランザクション内で：
   a. 募集のstatus=openをチェック＆accepted更新（行ロック）
   b. 先手/後手をランダムに決定
   c. matchesレコード作成（status=playing）
   d. 募集者への通知作成
3. 両ユーザーにWebSocketで対局開始を通知

**レスポンス（成功時）：**
```json
{
  "matchId": "uuid",
  "senteId": "uuid",
  "goteId": "uuid",
  "timeControl": 10
}
```

**レスポンス（既に応諾済み）：**
```json
{
  "error": {
    "code": "MATCH_REQUEST_ALREADY_ACCEPTED",
    "message": "この募集は既に他のユーザーに応諾されています"
  }
}
```

### 3.4 DELETE /api/match-requests/:id（キャンセル）

**処理：**
1. 自分の募集であることを確認
2. status=openであることを確認
3. status→cancelledに更新

---

## 4. 対局進行（WebSocket）

### 4.1 対局ルーム管理

```typescript
// サーバーサイド
interface GameRoom {
  matchId: string;
  gameState: GameState;
  senteSocketId: string | null;
  goteSocketId: string | null;
  senteTimeRemaining: number;  // 残り時間（ミリ秒）
  goteTimeRemaining: number;
  lastMoveTimestamp: number;    // 最終指し手のタイムスタンプ
  timerId: NodeJS.Timer | null; // 時間管理タイマー
}

// メモリ上のRoom管理（Map）
const gameRooms = new Map<string, GameRoom>();
```

### 4.2 指し手処理フロー

```
[クライアント]              [サーバー]               [相手クライアント]
    │                         │                         │
    ├── move { from, to,      │                         │
    │         promote }  ────→│                         │
    │                         ├── 手番チェック            │
    │                         ├── 将棋エンジンで合法性検証│
    │                         ├── 時間消費計算            │
    │                         ├── GameState更新           │
    │                         ├── 終局判定                │
    │                         │                         │
    │←── move_accepted ───────┤───→ move_accepted ──────→│
    │    { move, gameState,   │    （同一データ）          │
    │      timeRemaining }    │                         │
    │                         │                         │
    │  [終局の場合]            │                         │
    │←── game_over ───────────┤───→ game_over ──────────→│
    │    { result, winner,    │                         │
    │      kifu }             │                         │
```

### 4.3 時間管理

```typescript
/**
 * 持ち時間管理
 * - 手番のプレイヤーの時間を1秒ごとに減算
 * - 0になったら時間切れ負け
 */
function startTimer(room: GameRoom): void {
  const currentPlayer = room.gameState.teban;
  room.lastMoveTimestamp = Date.now();

  room.timerId = setInterval(() => {
    const elapsed = Date.now() - room.lastMoveTimestamp;
    if (currentPlayer === 'sente') {
      room.senteTimeRemaining -= 1000;
      if (room.senteTimeRemaining <= 0) {
        handleTimeout(room, 'sente');
      }
    } else {
      room.goteTimeRemaining -= 1000;
      if (room.goteTimeRemaining <= 0) {
        handleTimeout(room, 'gote');
      }
    }
    // 両者に残り時間を送信
    emitTimeUpdate(room);
  }, 1000);
}

function onMoveMade(room: GameRoom): void {
  // 消費時間を正確に計算（タイマーの粒度ではなく実時間で）
  const elapsed = Date.now() - room.lastMoveTimestamp;
  const currentPlayer = room.gameState.teban; // 移動前の手番
  if (currentPlayer === 'sente') {
    room.senteTimeRemaining -= elapsed;
  } else {
    room.goteTimeRemaining -= elapsed;
  }

  clearInterval(room.timerId!);
  startTimer(room);  // 次の手番のタイマー開始
}
```

### 4.4 接続断の処理

```
[プレイヤーA切断]             [サーバー]               [プレイヤーB]
    ×                          │                         │
    │                          ├── 切断検知               │
    │                          ├── 60秒タイマー開始        │
    │                          │──→ opponent_disconnected →│
    │                          │    { timeout: 60 }       │
    │                          │                         │
    │  [60秒以内に再接続]       │                         │
    ├── reconnect ────────────→│                         │
    │                          ├── ゲーム状態復元          │
    │←── match_joined ─────────┤──→ opponent_reconnected →│
    │                          │                         │
    │  [60秒超過で復帰なし]     │                         │
    │                          ├── 切断側の負け判定        │
    │                          │──→ game_over ───────────→│
```

**再接続の仕組み：**
1. Socket.IOの自動再接続機能を利用
2. 再接続時にセッショントークンで認証
3. 進行中の対局があればGameRoomに再参加
4. 最新のGameStateをクライアントに送信

---

## 5. 募集の有効期限管理

### 5.1 期限切れ処理

```typescript
// 定期実行（1分ごとのcronジョブまたはsetInterval）
async function expireOldRequests(): Promise<void> {
  await db.matchRequest.updateMany({
    where: {
      status: 'open',
      expiresAt: { lt: new Date() }
    },
    data: { status: 'expired' }
  });
}
```

### 5.2 リアルタイム更新

- 募集一覧画面を開いているユーザーにはWebSocketで期限切れを通知
- クライアント側でもexpiresAtに基づくカウントダウン表示

---

## 6. 画面設計

### 6.1 S-05 対戦募集作成画面

```
┌──────────────────────────────┐
│  対戦募集                     │
│                              │
│  持ち時間                     │
│  ○ 10分切れ負け              │
│  ● 15分切れ負け              │
│                              │
│  ※全登録ユーザーに通知が       │
│  　送信されます               │
│                              │
│  ┌────────────────────────┐  │
│  │     対戦相手を募集する     │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 6.2 S-06 対戦募集一覧画面

```
┌──────────────────────────────┐
│  対戦募集一覧                  │
│                              │
│  ┌──────────────────────────┐│
│  │ 将棋太郎 が対戦相手を      ││
│  │ 募集しています             ││
│  │ 15分切れ負け              ││
│  │ 残り 22:15               ││
│  │ ┌──────────┐             ││
│  │ │  対戦する  │             ││
│  │ └──────────┘             ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ 駒太郎 が対戦相手を        ││
│  │ 募集しています             ││
│  │ 10分切れ負け              ││
│  │ 残り 05:43               ││
│  │ ┌──────────┐             ││
│  │ │  対戦する  │             ││
│  │ └──────────┘             ││
│  └──────────────────────────┘│
│                              │
│  募集がありません（0件の時）    │
└──────────────────────────────┘
```

### 6.3 対局開始時の演出

```
┌──────────────────────────────┐
│                              │
│         対局開始              │
│                              │
│    先手: 将棋太郎 ☗           │
│    後手: 駒太郎   ☖           │
│                              │
│    15分切れ負け               │
│                              │
│   「よろしくお願いします」      │
│                              │
│  ┌────────────────────────┐  │
│  │       対局画面へ          │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

## 7. 状態遷移図

### 7.1 match_requests の状態遷移

```
         作成
          │
          ▼
       ┌──────┐
       │ open │
       └──┬───┘
          │
    ┌─────┼─────┐
    │     │     │
    ▼     ▼     ▼
┌──────┐┌────┐┌─────────┐
│accept││expir││cancelled│
│  ed  ││ ed ││         │
└──────┘└────┘└─────────┘
```

### 7.2 matches の状態遷移

```
         応諾/CPU対戦開始
              │
              ▼
          ┌────────┐
          │playing │
          └──┬─────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────┐┌────────┐
│finished││aborted │
│        ││(中断)  │
└────────┘└────────┘
```

---

## 8. テスト観点

| テスト項目 | 内容 |
|-----------|------|
| 募集作成 | 1件制限、レート制限の動作確認 |
| 同時応諾 | 2ユーザーが同時に応諾した場合、1人のみ成功すること |
| 期限切れ | 30分経過後にステータスがexpiredになること |
| 対局開始 | 先手/後手が正しく割り当てられること |
| 指し手同期 | 両者に同一のGameStateが配信されること |
| 接続断 | 60秒以内の再接続で対局が継続すること |
| 接続断 | 60秒超過で切断側の負けになること |
| 時間管理 | 持ち時間が正確に減算されること |
| 時間切れ | 0になった時点で負け判定されること |
| 自己応諾 | 自分の募集に自分で応諾できないこと |
| キャンセル | 他人の募集をキャンセルできないこと |
