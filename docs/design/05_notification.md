# 通知機能設計書

| 項目 | 内容 |
|------|------|
| 文書ID | DD-05 |
| 対象機能 | F-09 メール通知, F-10 LINE連携（2nd）, F-11 Slack連携（2nd） |
| 関連要件 | 要件定義書 §3.4 |
| バージョン | 1.0 |

---

## 1. 概要

対戦募集・応諾・対局結果の通知をユーザーに届ける。MVPではサイト内通知とメール通知を実装し、2ndでLINE/Slack連携を追加する。

---

## 2. 通知トリガーと配信先

| トリガー | 対象者 | サイト内 | メール | 配信タイミング |
|---------|--------|:--------:|:------:|-------------|
| 対戦募集が発信された | 発信者以外の全員 | ◯ | ◯（opt-in） | 即時 |
| 自分の募集が応諾された | 募集発信者 | ◯ | ◯ | 即時 |
| 対局が終了した | 対局者双方 | ◯ | ◯ | 即時 |
| 募集が期限切れになった | 募集発信者 | ◯ | - | 期限切れ時 |

---

## 3. サイト内通知

### 3.1 データフロー

```
[トリガー発生]
    │
    ├── notificationsテーブルにINSERT
    │
    ├── WebSocket接続中のユーザーへリアルタイム配信
    │   └── notification_new イベント
    │
    └── 未接続のユーザーは次回アクセス時に取得
```

### 3.2 WebSocketイベント

```typescript
// サーバー → クライアント
interface NotificationEvent {
  id: string;
  type: 'match_request' | 'match_accepted' | 'match_result' | 'request_expired';
  title: string;
  body: string;
  referenceId: string;  // リンク先のID
  createdAt: string;
}
```

### 3.3 API

#### GET /api/notifications

**クエリパラメータ：**
- `unreadOnly`: boolean（デフォルトfalse）
- `limit`: number（デフォルト20、最大50）
- `cursor`: string（ページネーション用、createdAtベース）

**レスポンス：**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "match_request",
      "title": "対戦募集",
      "body": "将棋太郎さんが対戦相手を募集しています（15分切れ負け）",
      "referenceId": "uuid",
      "readAt": null,
      "createdAt": "2026-04-19T20:30:00Z"
    }
  ],
  "unreadCount": 3,
  "nextCursor": "2026-04-19T20:00:00Z"
}
```

#### PATCH /api/notifications/:id/read

**処理：** `read_at = NOW()` を設定

#### POST /api/notifications/read-all

**処理：** 自分の未読通知を全て既読にする

---

## 4. メール通知

### 4.1 送信制御

**スパム化防止策：**
- メール通知はデフォルトOFF（`email_enabled = false`）
- ユーザーが明示的にONにした場合のみ送信
- 対戦募集通知は**1時間に最大3通**まで（それ以上はサイト内通知のみ）
- 応諾・対局結果通知は制限なし（頻度が低いため）

### 4.2 メール送信の非同期処理

```
[トリガー発生]
    │
    ├── サイト内通知（同期・即時）
    │
    └── メール送信キュー追加（非同期）
         │
         └── バックグラウンドワーカー
              ├── 通知設定チェック（email_enabled?）
              ├── レート制限チェック
              ├── SendGrid API呼び出し
              └── 送信ログ記録
```

**MVP実装：** キューシステムは重厚になるため、MVPでは`setTimeout`による簡易的な非同期送信とする。将来的にはBullMQ等のジョブキューに移行。

### 4.3 メールテンプレート

#### 対戦募集通知
```
件名：【将棋オンライン】対戦相手を募集しています

{requester_name} さんが対戦相手を募集しています。

・持ち時間：{time_control}分切れ負け
・募集期限：あと{remaining_minutes}分

▼ 対戦する
{accept_url}

▼ 通知設定を変更する
{settings_url}
```

#### 応諾通知
```
件名：【将棋オンライン】対戦相手が見つかりました！

{responder_name} さんがあなたの対戦募集に応じました。

▼ 対局画面へ
{match_url}
```

#### 対局結果通知
```
件名：【将棋オンライン】対局結果

対局が終了しました。

・対戦相手：{opponent_name}
・結果：{result}（{total_moves}手）
・決まり手：{result_type}

▼ 棋譜を見る
{kifu_url}
```

---

## 5. 通知設定

### 5.1 API

#### GET /api/notifications/settings

**レスポンス：**
```json
{
  "emailEnabled": false,
  "siteEnabled": true,
  "lineEnabled": false,
  "slackEnabled": false
}
```

#### PATCH /api/notifications/settings

**リクエスト：**
```json
{
  "emailEnabled": true
}
```

### 5.2 画面設計（S-10 通知設定画面）

```
┌──────────────────────────────┐
│  通知設定                     │
│                              │
│  サイト内通知                 │
│  [====ON====]  ※常時有効     │
│                              │
│  メール通知                   │
│  [===OFF====]                │
│  対戦募集・応諾・結果を       │
│  メールでお知らせします       │
│                              │
│  ── 2ndリリース以降 ──       │
│                              │
│  LINE通知（準備中）           │
│  [===OFF====]                │
│                              │
│  Slack通知（準備中）          │
│  [===OFF====]                │
│                              │
│  ┌────────────────────────┐  │
│  │       保存する            │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## 6. 通知サービスモジュール

### 6.1 モジュール構成

```
src/lib/notification/
├── types.ts              # 通知関連の型定義
├── notificationService.ts # 通知作成・配信の統括
├── siteNotification.ts   # サイト内通知（DB + WebSocket）
├── emailNotification.ts  # メール通知（SendGrid）
└── index.ts
```

### 6.2 主要インターフェース

```typescript
interface NotificationPayload {
  type: 'match_request' | 'match_accepted' | 'match_result' | 'request_expired';
  recipientIds: string[];    // 通知先ユーザーIDリスト
  title: string;
  body: string;
  referenceId: string;
  data?: Record<string, string>;  // メールテンプレート用の追加データ
}

/** 通知を送信する（サイト内 + メール） */
async function sendNotification(payload: NotificationPayload): Promise<void>;
```

---

## 7. 大量ユーザー対応

### 7.1 対戦募集通知のスケーラビリティ

**懸念：** 登録ユーザー全員にnotificationレコードをINSERTすると、ユーザー数増加時にDB負荷が高くなる。

**MVP対策：**
- 50ユーザー程度を想定（要件定義書 §4.1）なので一括INSERT可能
- INSERTは`INSERT INTO ... SELECT`で一括実行

**将来対策（ユーザー数増加時）：**
- 通知のファンアウトを遅延処理に変更
- またはフォロー制への移行（要件定義書 §12の検討事項）

---

## 8. テスト観点

| テスト項目 | 内容 |
|-----------|------|
| サイト内通知 | DBに正しく保存されること |
| WebSocket配信 | 接続中ユーザーにリアルタイム配信されること |
| メール通知 | email_enabled=trueの場合のみ送信されること |
| レート制限 | 1時間3通超過でメールが送信されないこと |
| 既読 | read_atが正しく更新されること |
| 一括既読 | 全未読が既読になること |
| 設定変更 | notification_settingsが正しく更新されること |
| 自分除外 | 対戦募集通知で発信者自身に通知が行かないこと |
