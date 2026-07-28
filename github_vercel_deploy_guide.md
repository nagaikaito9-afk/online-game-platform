# GitHub ＆ Vercel 無料公開ガイド

この対戦ゲームプラットフォームを **GitHub にアップロードして Vercel で世界中に公開（URL生成）** する手順です。

---

## 🚀 手順 1: GitHub で新しいリポジトリを作成

1. [GitHub公式サイト (https://github.com)](https://github.com) にログインします。
2. 右上の **「+」アイコン** -> **「New repository」** を選択します。
3. **Repository name**（例: `online-game-platform`）を入力します。
4. 「Public（公開）」または「Private」を選択し、**「Create repository」** をクリックします。

---

## 🚀 手順 2: ローカルから GitHub にコードを送信 (Push)

VS Code または端末（PowerShell / ターミナル）を開き、プロジェクトフォルダで以下のコマンドを順番に実行してください。（※`あなたのGitHubユーザー名/リポジトリ名` 部分を自分のものに書き換えてください）

```bash
git branch -M main
git remote add origin https://github.com/あなたのGitHubユーザー名/online-game-platform.git
git push -u origin main
```

---

## 🚀 手順 3: Vercel でワンクリック自動公開

1. [Vercel公式サイト (https://vercel.com)](https://vercel.com) にアクセスし、**「Continue with GitHub」** でログインします。
2. ダッシュボードの **「Add New...」** -> **「Project」** ボタンを押します。
3. 先ほど GitHub に作成した `online-game-platform` リポジトリの横にある **「Import」** をクリックします。
4. 設定は自動認識（Vercel用の `vercel.json` を同梱済み）されているため、そのまま **「Deploy」** ボタンを押すだけです！
5. 約15秒でビルドが完了し、**`https://online-game-platform-xxx.vercel.app`** のような公開用カスタムURLが発行されます。

---

### ✨ 設定済み事項
- **favicon.png**: `<link rel="icon" href="favicon.png">` が `index.html` にセット済みです。
- **Supabase情報**: 提供していただいた API URL (`https://dwvqpzmjbvpfzvkodgko.supabase.co`) と Publishable Key (`sb_publishable_W2q0T8XZfvt7Q7VpxTOvGw_rZio5SBJ`) はコードに初期値として組み込み済みのため、公開後すぐにDB連携＆対戦機能が動作します！
