# Supabase 設定手順ガイド (オンライン対戦ゲーム用)

この対戦ゲームプラットフォームは、Supabaseを使用することで**ユーザーログイン、オンライン対戦マッチング、勝敗データ・ランク・称号の保存**が可能です。
（※Supabaseを設定していない場合でも、ローカル保存＋AI対戦/模擬オンライン対戦機能により全機能がブラウザ単体で快適に遊べます！）

---

## ステップ 1: Supabaseアカウント作成 & プロジェクト作成

1. [Supabase公式サイト (https://supabase.com)](https://supabase.com) にアクセスし、無料アカウントを作成します。
2. ダッシュボードから **「New Project」** ボタンを押します。
3. プロジェクト名（例: `online-game-app`）とデータベースパスワードを設定し、リージョン（Tokyoなど）を選択して作成します。

---

## ステップ 2: データベース (テーブル) の作成

Supabaseダッシュボードの左メニュー **「SQL Editor」** を開き、**「New query」** を押して以下のSQLコードをそのまま貼り付けて **「Run」** を実行してください。

```sql
-- ユーザープロファイルテーブル
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ゲーム別ランク・成績テーブル
CREATE TABLE public.user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  game_id TEXT NOT NULL,
  rank_num INT DEFAULT 1, -- 1: ブロンズI ~ 200: マスターX
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  unlocked_ai_level INT DEFAULT 1,
  UNIQUE (user_id, game_id)
);

-- ユーザー称号データテーブル
CREATE TABLE public.user_titles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title_id INT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, title_id)
);

-- マッチングキュー＆ルーム管理テーブル
CREATE TABLE public.game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  mode TEXT NOT NULL, -- 'casual' または 'ranked'
  host_id UUID REFERENCES auth.users NOT NULL,
  guest_id UUID REFERENCES auth.users,
  target_rank INT DEFAULT 1,
  status TEXT DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  board_state JSONB DEFAULT '{}'::jsonb,
  current_turn TEXT DEFAULT 'host',
  winner TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) の設定
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "User stats viewable by everyone." ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Users can manage own stats." ON public.user_stats FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User titles viewable by everyone." ON public.user_titles FOR SELECT USING (true);
CREATE POLICY "Users can insert own titles." ON public.user_titles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Game rooms viewable by everyone." ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Game rooms manage by auth users." ON public.game_rooms FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
```

---

## ステップ 3: Realtime (リアルタイム機能) の有効化

1. Supabaseダッシュボードの **「Database」** -> **「Publications」** を開きます。
2. `supabase_realtime` をクリックします。
3. `game_rooms` テーブルのスイッチを **ON** にします。（これでプレイヤー間の対戦着手がリアルタイム同期されます）

---

## ステップ 4: API URL と Anon Key の取得とアプリへの入力

1. Supabaseダッシュボードの **「Project Settings」** (歯車アイコン) -> **「API」** を開きます。
2. **Project URL** と **anon / public key** をコピーします。
3. ゲームのヘッダーにある **「アカウント/接続設定」** または **「Supabase設定」** ボタンを開き、URLとキーを貼り付けて「保存＆接続」を押してください！

接続完了メッセージが表示されれば、リアルタイムオンライン対戦とクラウド保存が利用可能になります。
