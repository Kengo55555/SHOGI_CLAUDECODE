# 将棋オンライン

Web ブラウザ上で動作するオンライン対戦型将棋ゲーム。CPU（AI）対戦とリアルタイムオンライン対戦の両方に対応。

## 特徴

- **伝統的な将棋の忠実な再現** - 全ルール（二歩・打ち歩詰め・千日手・持将棋等）を正確に実装
- **CPU対戦（3レベル）** - 初級〜上級のAIとの対戦で棋力向上
- **オンライン対戦** - 対戦募集シグナル方式によるリアルタイム対局
- **棋譜保存・再生** - KIF形式対応の棋譜管理
- **和風デザイン** - 伝統的な将棋盤・駒のビジュアルを忠実に再現
- **レスポンシブ対応** - PC・タブレット・スマートフォンで快適にプレイ

## 技術スタック

| 層 | 技術 |
|----|------|
| フロントエンド | Next.js 16 (App Router) / TypeScript / TailwindCSS |
| バックエンド | Next.js API Routes / Socket.IO |
| データベース | PostgreSQL / Prisma 7 |
| 認証 | パスワードレス（マジックリンク方式） |
| リアルタイム通信 | Socket.IO (WebSocket) |
| テスト | Vitest |

## プロジェクト構成

```
shogi-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証画面（登録・ログイン・メール確認）
│   │   ├── (main)/             # 認証後画面
│   │   │   ├── dashboard/      # ダッシュボード
│   │   │   ├── game/           # 対局画面（CPU・オンライン）
│   │   │   ├── match-requests/ # 対戦募集
│   │   │   ├── records/        # 戦績・棋譜再生
│   │   │   └── settings/       # プロフィール・通知設定
│   │   └── api/                # REST API（18エンドポイント）
│   ├── components/
│   │   ├── board/              # 将棋盤UI（盤面・駒・持ち駒）
│   │   ├── game/               # 対局画面（操作・成り確認・終了演出）
│   │   └── layout/             # ナビゲーション
│   └── lib/
│       ├── shogi/
│       │   ├── core/           # 将棋エンジン（ルール・合法手生成・棋譜変換）
│       │   └── ai/             # CPU AI（Minimax / Alpha-Beta探索）
│       ├── auth/               # 認証（セッション管理・ミドルウェア）
│       ├── db/                 # Prisma DBクライアント
│       ├── notification/       # 通知サービス
│       └── socket/             # Socket.IO クライアント
├── server/                     # カスタムサーバー（Socket.IO統合）
├── prisma/                     # データベーススキーマ
├── tests/                      # テスト
└── docs/design/                # 機能別設計書
```

## セットアップ

### 前提条件

- Node.js 18+
- PostgreSQL 15+

### インストール

```bash
cd shogi-app
npm install
```

### 環境変数

```bash
cp .env.example .env
# .env を編集して DATABASE_URL 等を設定
```

### データベース

```bash
npx prisma migrate dev
npx prisma generate
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

### テスト

```bash
npx vitest run
```

## 設計書

`docs/design/` に機能別の設計書を配置しています。

| ファイル | 内容 |
|---------|------|
| `00_common_infrastructure.md` | 共通基盤（技術スタック・DB設計・API一覧） |
| `01_shogi_engine.md` | 将棋エンジン（ルール・合法手・禁じ手判定） |
| `02_user_management.md` | 会員管理（パスワードレス認証） |
| `03_cpu_battle.md` | CPU対戦（AI設計・3レベル） |
| `04_online_battle.md` | オンライン対戦（募集シグナル方式） |
| `05_notification.md` | 通知機能 |
| `06_records_kifu.md` | 戦績・棋譜管理 |
| `07_game_ui.md` | 対局画面UI |
| `08_dashboard_pages.md` | 画面遷移・全体UI |

## 画面一覧

| 画面 | パス | 説明 |
|------|------|------|
| トップ | `/` | サービス紹介・登録導線 |
| 登録 | `/register` | メールアドレス登録 |
| ログイン | `/login` | ログインリンク送信 |
| ダッシュボード | `/dashboard` | マイページ（募集一覧・戦績サマリ） |
| CPU対戦設定 | `/game/cpu` | レベル・先後・持ち時間選択 |
| 対局画面 | `/game/[matchId]` | 将棋盤・操作・時間表示 |
| 対戦募集一覧 | `/match-requests` | アクティブな募集・応諾 |
| 対戦募集作成 | `/match-requests/new` | 持ち時間指定・募集発信 |
| 戦績一覧 | `/records` | 対局履歴・勝敗統計 |
| 棋譜再生 | `/records/[matchId]` | 盤面再生・棋譜リスト |
| プロフィール | `/settings/profile` | ハンドルネーム変更・退会 |
| 通知設定 | `/settings/notifications` | メール通知ON/OFF |

## API一覧

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth/register` | メールアドレス登録 |
| POST | `/api/auth/login` | ログインリンク送信 |
| GET | `/api/auth/verify` | マジックリンク検証 |
| POST | `/api/auth/logout` | ログアウト |
| GET/PATCH/DELETE | `/api/users/me` | プロフィール |
| GET/POST | `/api/match-requests` | 対戦募集 |
| POST | `/api/match-requests/[id]/accept` | 募集応諾 |
| POST | `/api/matches/cpu` | CPU対戦開始 |
| GET | `/api/matches` | 対局履歴 |
| GET | `/api/matches/[id]` | 対局情報 |
| GET | `/api/matches/[id]/kifu` | 棋譜取得 |
| GET | `/api/notifications` | 通知一覧 |
| PATCH | `/api/notifications/[id]/read` | 通知既読 |
| GET/PATCH | `/api/notifications/settings` | 通知設定 |

## ライセンス

個人開発・非商用プロジェクト
