# 共通基盤設計書

| 項目 | 内容 |
|------|------|
| 文書ID | DD-00 |
| 対象機能 | 全機能共通の技術基盤 |
| 関連要件 | 要件定義書 §7, §4 |
| バージョン | 1.0 |

---

## 1. 技術スタック確定

| 層 | 採用技術 | 選定理由 |
|----|---------|---------|
| フロントエンド | Next.js 14 (App Router) + TypeScript | SSR/SSG対応、React Server Components、個人開発に最適なフルスタック構成 |
| スタイリング | TailwindCSS | 高速プロトタイピング、レスポンシブ対応容易 |
| リアルタイム通信 | Socket.IO | WebSocket抽象化、自動再接続、Room機能 |
| バックエンド | Next.js API Routes + Socket.IOサーバー（カスタムサーバー） | フロントと同一リポジトリで管理、デプロイ簡素化 |
| DB | PostgreSQL | リレーショナルデータの整合性、JSONカラムで棋譜保存 |
| ORM | Prisma | TypeScript型安全、マイグレーション管理 |
| 認証 | 自前実装（メール＋ワンタイムリンク） | パスワードレス認証、要件通り |
| メール送信 | SendGrid（Free Tier: 100通/日） | 無料枠で十分、REST API対応 |
| ホスティング | Railway（バックエンド+DB）+ Vercel（フロント） | 低コスト、WebSocket対応（Railway） |

---

## 2. プロジェクト構成

```
shogi-app/
├── src/
│   ├── app/                    # Next.js App Router (ページ)
│   │   ├── (auth)/             # 認証関連ページ
│   │   ├── (main)/             # 認証後ページ
│   │   │   ├── dashboard/
│   │   │   ├── game/
│   │   │   ├── records/
│   │   │   └── settings/
│   │   ├── api/                # API Routes
│   │   │   ├── auth/
│   │   │   ├── matches/
│   │   │   ├── match-requests/
│   │   │   ├── notifications/
│   │   │   └── users/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # UIコンポーネント
│   │   ├── board/              # 将棋盤関連
│   │   ├── game/               # 対局画面関連
│   │   ├── layout/             # レイアウト共通
│   │   └── ui/                 # 汎用UIパーツ
│   ├── lib/                    # ビジネスロジック・ユーティリティ
│   │   ├── shogi/              # 将棋エンジン（共通ロジック）
│   │   │   ├── core/           # 盤面・駒・ルール
│   │   │   ├── ai/             # CPU対戦AI
│   │   │   └── kifu/           # 棋譜処理
│   │   ├── db/                 # DB接続・クエリ
│   │   ├── auth/               # 認証ロジック
│   │   ├── socket/             # Socket.IOクライアント
│   │   └── utils/              # 汎用ユーティリティ
│   ├── hooks/                  # カスタムReact Hooks
│   ├── types/                  # TypeScript型定義
│   └── constants/              # 定数定義
├── server/                     # カスタムサーバー（Socket.IO統合）
│   ├── index.ts
│   ├── socket/                 # Socket.IOイベントハンドラ
│   │   ├── gameHandler.ts
│   │   └── matchHandler.ts
│   └── services/               # サーバーサイドサービス
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── images/
│   │   ├── koma/               # 駒画像
│   │   └── board/              # 盤面画像
│   └── sounds/                 # 効果音
├── tests/
│   ├── unit/                   # ユニットテスト
│   │   └── shogi/              # 将棋ロジックテスト
│   ├── integration/            # 統合テスト
│   └── e2e/                    # E2Eテスト
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

---

## 3. データベース設計

### 3.1 ER図（テキスト表記）

```
users ─────────< match_requests
  │                    │
  │                    │
  ├─────────< matches (requester_id)
  ├─────────< matches (responder_id)
  │                │
  │                └────< game_records
  │
  ├─────────< notifications
  └──────── notification_settings (1:1)
```

### 3.2 テーブル定義

#### users
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,  -- 暗号化して保管
  handle_name   VARCHAR(20) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ          -- 論理削除
);
CREATE INDEX idx_users_email ON users(email);
```

#### match_requests（対戦募集）
```sql
CREATE TABLE match_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID NOT NULL REFERENCES users(id),
  time_control    SMALLINT NOT NULL,  -- 10 or 15（分）
  status          VARCHAR(20) NOT NULL DEFAULT 'open',
                  -- 'open' | 'accepted' | 'expired' | 'cancelled'
  responder_id    UUID REFERENCES users(id),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_match_requests_status ON match_requests(status) WHERE status = 'open';
CREATE INDEX idx_match_requests_requester ON match_requests(requester_id);
```

#### matches（対局）
```sql
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_request_id UUID REFERENCES match_requests(id),  -- NULLならCPU対戦
  sente_id        UUID NOT NULL REFERENCES users(id),    -- 先手
  gote_id         UUID REFERENCES users(id),             -- 後手（NULLならCPU）
  cpu_level       SMALLINT,                              -- 1:初級, 2:中級, 3:上級
  time_control    SMALLINT NOT NULL,                     -- 持ち時間（分）
  status          VARCHAR(20) NOT NULL DEFAULT 'playing',
                  -- 'playing' | 'finished' | 'aborted'
  winner_id       UUID REFERENCES users(id),             -- NULLなら引き分けまたはCPU勝利
  result_type     VARCHAR(20),
                  -- 'checkmate' | 'resign' | 'timeout' | 'disconnect' | 'draw' | 'cpu_win'
  total_moves     INT,
  sente_time_used INT,                                   -- 使用時間（秒）
  gote_time_used  INT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);
CREATE INDEX idx_matches_sente ON matches(sente_id);
CREATE INDEX idx_matches_gote ON matches(gote_id);
```

#### game_records（棋譜）
```sql
CREATE TABLE game_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL UNIQUE REFERENCES matches(id),
  kifu_kif    TEXT NOT NULL,          -- KIF形式棋譜
  moves_json  JSONB NOT NULL,         -- 指し手配列（プログラム用）
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  type        VARCHAR(30) NOT NULL,
              -- 'match_request' | 'match_accepted' | 'match_result'
  title       VARCHAR(100) NOT NULL,
  body        TEXT,
  reference_id UUID,                  -- 関連するmatch_requests.idまたはmatches.id
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at)
  WHERE read_at IS NULL;
```

#### notification_settings
```sql
CREATE TABLE notification_settings (
  user_id        UUID PRIMARY KEY REFERENCES users(id),
  email_enabled  BOOLEAN NOT NULL DEFAULT true,
  site_enabled   BOOLEAN NOT NULL DEFAULT true,
  line_enabled   BOOLEAN NOT NULL DEFAULT false,  -- 2nd以降
  slack_enabled  BOOLEAN NOT NULL DEFAULT false,   -- 2nd以降
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. API設計方針

### 4.1 規約

- RESTful API（Next.js API Routes）
- レスポンス形式：JSON
- エラーレスポンス統一形式：

```json
{
  "error": {
    "code": "INVALID_MOVE",
    "message": "二歩は禁じ手です"
  }
}
```

- 認証：Cookieベースのセッション管理（HttpOnly, Secure, SameSite=Strict）
- セッショントークンはDBに保存（`sessions`テーブル追加）

### 4.2 APIエンドポイント一覧

| メソッド | パス | 概要 | 認証 |
|---------|------|------|:----:|
| POST | `/api/auth/register` | メールアドレス登録（ワンタイムリンク送信） | - |
| GET | `/api/auth/verify?token=xxx` | ワンタイムリンク検証・ログイン | - |
| POST | `/api/auth/login` | ログインリンク送信 | - |
| POST | `/api/auth/logout` | ログアウト | ◯ |
| GET | `/api/users/me` | 自分のプロフィール取得 | ◯ |
| PATCH | `/api/users/me` | プロフィール更新 | ◯ |
| DELETE | `/api/users/me` | 退会 | ◯ |
| POST | `/api/match-requests` | 対戦募集作成 | ◯ |
| GET | `/api/match-requests` | アクティブな募集一覧 | ◯ |
| POST | `/api/match-requests/:id/accept` | 募集応諾 | ◯ |
| DELETE | `/api/match-requests/:id` | 募集キャンセル | ◯ |
| POST | `/api/matches/cpu` | CPU対戦開始 | ◯ |
| GET | `/api/matches/:id` | 対局情報取得 | ◯ |
| GET | `/api/matches` | 対局履歴一覧 | ◯ |
| GET | `/api/matches/:id/kifu` | 棋譜取得 | ◯ |
| GET | `/api/notifications` | 通知一覧 | ◯ |
| PATCH | `/api/notifications/:id/read` | 既読にする | ◯ |
| GET | `/api/notifications/settings` | 通知設定取得 | ◯ |
| PATCH | `/api/notifications/settings` | 通知設定更新 | ◯ |

---

## 5. WebSocket イベント設計

### 5.1 接続フロー

```
クライアント → connect（セッショントークン付き）
サーバー  → authenticated / auth_error
クライアント → join_match(matchId)
サーバー  → match_joined(gameState)
```

### 5.2 イベント一覧

| 方向 | イベント名 | ペイロード | 説明 |
|------|-----------|-----------|------|
| C→S | `join_match` | `{ matchId }` | 対局ルームに参加 |
| S→C | `match_joined` | `{ gameState }` | 参加成功・現在の局面 |
| C→S | `move` | `{ from, to, promote }` | 指し手送信 |
| S→C | `move_accepted` | `{ move, gameState }` | 指し手受理・盤面更新 |
| S→C | `move_rejected` | `{ reason }` | 不正な指し手 |
| C→S | `drop` | `{ piece, to }` | 持ち駒を打つ |
| S→C | `game_over` | `{ result, winner }` | 対局終了 |
| C→S | `resign` | `{}` | 投了 |
| S→C | `time_update` | `{ sente, gote }` | 残り時間更新 |
| S→C | `opponent_disconnected` | `{ timeout }` | 相手切断 |
| S→C | `opponent_reconnected` | `{}` | 相手復帰 |

---

## 6. 環境変数

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/shogi

# Authentication
SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
MAGIC_LINK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Email
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@shogi-app.example.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Environment
NODE_ENV=development
```

---

## 7. 共通ミドルウェア

### 7.1 認証ミドルウェア

```typescript
// 擬似コード
async function authMiddleware(req: NextRequest) {
  const sessionToken = req.cookies.get('session_token');
  if (!sessionToken) return unauthorized();

  const session = await db.session.findUnique({
    where: { token: sessionToken.value },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    return unauthorized();
  }

  return session.user;
}
```

### 7.2 レート制限

- API全体：100リクエスト/分/IP
- 認証系：5リクエスト/分/IP
- 対戦募集：3件/時間/ユーザー

---

## 8. エラーコード体系

| コード | 意味 |
|--------|------|
| `AUTH_REQUIRED` | 認証が必要 |
| `AUTH_INVALID` | 認証トークンが無効 |
| `USER_NOT_FOUND` | ユーザーが見つからない |
| `MATCH_REQUEST_EXISTS` | 既に募集中 |
| `MATCH_REQUEST_EXPIRED` | 募集期限切れ |
| `MATCH_NOT_FOUND` | 対局が見つからない |
| `INVALID_MOVE` | 不正な指し手 |
| `NOT_YOUR_TURN` | 相手の手番 |
| `GAME_ALREADY_OVER` | 対局は終了済み |
| `RATE_LIMITED` | リクエスト制限超過 |
