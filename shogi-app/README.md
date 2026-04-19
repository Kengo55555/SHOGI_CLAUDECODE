# 絢爛将棋 — Edo Yūkaku Style Patch for SHOGI_CLAUDECODE

江戸時代の遊郭の着物テキスタイル（青海波・亀甲・麻の葉・桜）をイメージした、
**見た目だけを差し替える** パッチです。将棋ロジックには一切触れていません。

## 対象リポ
https://github.com/Kengo55555/SHOGI_CLAUDECODE (main)

## 差分ファイル一覧

以下 6 ファイルを **上書き** してください。ロジック側（`src/lib/shogi/**`）は変更なし。

| 元ファイル | 差し替え後 |
|---|---|
| `shogi-app/src/app/globals.css` | `patches/globals.css` |
| `shogi-app/src/components/board/ShogiBoard.tsx` | `patches/ShogiBoard.tsx` |
| `shogi-app/src/components/board/Piece.tsx` | `patches/Piece.tsx` |
| `shogi-app/src/components/board/Square.tsx` | `patches/Square.tsx` |
| `shogi-app/src/components/board/MochigomaBar.tsx` | `patches/MochigomaBar.tsx` |
| `shogi-app/src/components/game/GameScreen.tsx` | `patches/GameScreen.tsx` |

## 手順（ローカルで適用する場合）

```bash
# 1. リポをクローン
git clone https://github.com/Kengo55555/SHOGI_CLAUDECODE.git
cd SHOGI_CLAUDECODE

# 2. 新ブランチ
git checkout -b feat/yukaku-theme

# 3. このプロジェクトの patches/ 配下を shogi-app に上書きコピー
#    （このプロジェクトの右上 ⋯ → Download で zip 取得できます）
cp /path/to/patches/globals.css           shogi-app/src/app/globals.css
cp /path/to/patches/ShogiBoard.tsx        shogi-app/src/components/board/ShogiBoard.tsx
cp /path/to/patches/Piece.tsx             shogi-app/src/components/board/Piece.tsx
cp /path/to/patches/Square.tsx            shogi-app/src/components/board/Square.tsx
cp /path/to/patches/MochigomaBar.tsx      shogi-app/src/components/board/MochigomaBar.tsx
cp /path/to/patches/GameScreen.tsx        shogi-app/src/components/game/GameScreen.tsx

# 4. 起動
cd shogi-app
npm install
npm run dev

# 5. PR を作成
git add -A && git commit -m "feat: Edo yūkaku textile theme for game UI"
git push -u origin feat/yukaku-theme
```

## 変更点まとめ

### 1. `globals.css`
- 着物テキスタイル用の新ユーティリティを追加
  - `.bg-edo-stage` — 深紅→漆黒のステージ背景
  - `.bg-seigaiha` / `.bg-asanoha` / `.bg-kikko` — 青海波・麻の葉・亀甲パターン
  - `.bg-kimono-cloud` — 白雲取り＋紅＋桜散らしの複合パターン
  - `.chochin` — 赤提灯
  - `.kimono-frame` — 盤を囲む着物帯
  - `.petal-fall` — 桜吹雪アニメーション
  - `.card-yukaku` — 金縁・黒漆カード
  - `.btn-beni` — 紅ボタン
- 既存トークン（`--color-kurenai` など）は残したまま追加のみ

### 2. `ShogiBoard.tsx`
- 盤の背景を **カヤ材風のグラデ→鮮やかな金色** に変更
- 盤の四辺に **kimono-frame** 装飾帯（青海波 / 亀甲 / 麻の葉 / 桜）
- 筋・段ラベルは **金色 + セリフ**
- マスの区切り線はそのまま（10本 x 10本の碁盤目）

### 3. `Piece.tsx`
- 木目は **金箔調** に
- 成駒の字色は **紅 `#B22222` → `#C4364A`（紅色）**
- 選択時ハイライトを **金色グロー** に

### 4. `Square.tsx`
- 選択マスを **紅 `bg-[#C4364A]/20`** に
- 合法手ドットを **金色 `#D4A017`** ＋紅輪

### 5. `MochigomaBar.tsx`
- 駒台を **漆黒＋金縁**（`card-urushi` の変種）に
- 選択駒の枠を **金のリング**
- 枚数バッジを **紅色**

### 6. `GameScreen.tsx`
- 背景に **.bg-edo-stage** を付与
- 上下のプレイヤー名行を **金箔テキスト** ＋ **☗/☖ 提灯装飾**
- 桜吹雪レイヤーを追加（z-index で盤の後ろに）

## ロジック変更なし

以下のファイル群は **完全に不変**。ルールや AI はそのままです。
- `src/lib/shogi/**`
- `server/**`
- API ルート
- ページルーティング
