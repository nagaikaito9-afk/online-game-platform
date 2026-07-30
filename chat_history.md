# 📝 VersaPlay Online - 会話履歴 ＆ AI記憶バックアップ

AntiGravity（AIアシスタント）のセッションが終了・リセットされても、このファイルを読めばこれまでの全開発経緯、設定情報、機能仕様、公開URLがすべて復元できるように記録した記憶ファイルだよ！

---

## 🌐 プロジェクト ＆ リポジトリ別公開情報

### 🔬 1. CellSimulation (The Powder Toy型 ピクセル物理シミュレーター)
- **GitHubリポジトリ**: `online-game-platform` / 単独リポジトリ
- **Vercel 公開**: `CellSimulation/` ルートまたは独立プロジェクトデプロイ
- **格納ディレクトリ**: `CellSimulation/`

### 🎮 2. WEBLOX (3Dロブロックス風メタバース)
- **GitHubリポジトリ**: `WEBLOX` (`https://github.com/nagaikaito9-afk/WEBLOX.git`)
- **Vercel プロジェクト名**: `new-weblox`
- **格納ディレクトリ**: `WEBLOX/`

### 🎯 3. VersaPlay Online (2D対戦ゲームプラットフォーム)
- **GitHubリポジトリ**: `online-game-platform` (`https://github.com/nagaikaito9-afk/online-game-platform.git`)
- **Vercel 公開URL**: [https://online-game-platform-three.vercel.app/](https://online-game-platform-three.vercel.app/)
- **格納ディレクトリ**: `online-game-platform/`

---

## ⚡ Supabase 設定情報
- **API URL**: `https://dwvqpzmjbvpfzvkodgko.supabase.co`
- **Publishable Key (Anon)**: `sb_publishable_W2q0T8XZfvt7Q7VpxTOvGw_rZio5SBJ`
- **Secret Key**: `sb_secret_VthhpBxgBvWZ_zSusS1vf`
- **テーブル構造**: `profiles`, `user_stats`, `user_titles`, `game_rooms` (詳細SQLは `supabase_setup_guide.md` に記載)

---

## 📁 フォルダ・プロジェクト構成
- **`SlimeBigger/`**: Make the slime bigger (スライム巨大化, 💥分裂, ⚔️通常バトル, 🏰魔王暗黒ドラゴン・スライムダンジョンボス戦, 🛒SHOPシステム, 全200種スライムガチャ, 全200種図鑑. ※alert全廃)
- **`CellSimulation/`**: The Powder Toy スタイル 超リアルピクセル物理シミュレーター (全200種物質、⚛️反物質、🌀ブラックホール特異点、⚡高能率レーザー、水圧流動・熱力学相転移・爆発連鎖・音響SE. ※alert全廃)
- **`UnderstandingMathematics/`**: 直感数学＆物理ワールド (三角関数, 微積分, 線形代数, フーリエ解析, カオスフラクタル, 確率モンテカルロ, 3Dクラインの壺, パスカル三角形, 直感物理, 身近な3D, ⚛️量子力学&波動関数トンネル効果, 🌌3D一般相対性理論&BH時空歪み, 🧠AIニューラルネットワーク逆伝播)
- **`KanjiSearch/`**: 漢字全書 - Kanji Search (🌸ふりがな検索, 🔍漢字検索, ✍️手書きAIストローク判定検索, 🧩部位[部首]複数選択AND検索, 常用・主要漢字データベース, 熟語例・成り立ちポップアップ詳細モーダル)
- **`online-game-platform/`**: 2D対戦ゲームプラットフォーム (囲碁・将棋・オセロ・チェス・五目並べ・トランプ・〇✕)
- **`chat_history.md`**: 会話履歴 ＆ 開発記憶ファイル

---

### 1. ゲームラインナップ (全11種)
- 〇✕ゲーム (Tic-Tac-Toe)
- オセロ (リバーシ)
- 五目並べ (15×15)
- 囲碁 (9路盤 / 13路盤 / 19路盤 × 置石あり[ハンデ2石] / 置石なし)
- チェス (8×8)
- 将棋 (9×9)
- トランプ全5種 (大富豪, 7ならべ, スピード, ババ抜き, ジジ抜き)

### 2. 対戦モード ＆ AI思考エンジン
- **AIと対戦**: Level 1〜20 の強さ段階。Level 1 をクリアすると Level 2 が解放される進行型！
- **通常マッチング**: カジュアルなランダム対戦。
- **ランクマッチング**: 同ランク帯のリアルプレイヤーとマッチング。

### 3. 200段階ランク ＆ 300種類称号システム
- ブロンズⅠ〜マスターⅩまでの計200ランク。ゲームごとに個別管理。
- 300種類の称号（「囲碁名人」「将棋達人」など）と達成通知・図鑑装備機能。

### 4. ユーザーアカウント ＆ 固有IDシステム
- 初回アクセス時に表示名（後から変更可能）とユーザーID（英数字・変更不可・重複不可）を登録。
- ヘッダーに `表示名 (@ID)` を表示。

### 5. 👥 フレンド機能 ＆ 🔍 プレイヤー検索
- フレンドモーダル内に「🔍 プレイヤーを探す」セクションを搭載。
- IDや表示名で検索し、その場でフレンド申請やフレンド削除が可能。
- フレンド一覧から一時メッセージ送信や「⚔️ 即時対戦」が可能。

### 6. 💬 プレイ中一時チャット
- 対戦画面の右側にチャットパネルを配置。
- 対戦終了時または画面離脱時にチャットデータは全消去（保持しない）。

### 7. 🏆 途中退室・タブ閉じ時の「不戦勝」判定
- 対戦途中で相手がタブを閉じたり途中退室すると、残された側が「不戦勝」で勝利となる。

### 8. 🎨 UI/UX ＆ サウンド
- ネオン＆ダークガラスモフィズムのプレミアムデザイン（`favicon.png` 対応）。
- Web Audio API によるBGM ＆ 効果音（SE）合成再生（音量調整スライダー付き）。

---

## 🔄 AIの対話スタンス
- **口調**: フレンドリーな友達口調（タメ口・フレンドリーなコミュニケーション）。
- 今後新しいリクエストがあれば、この `chat_history.md` に追記して記憶を維持するよ！
