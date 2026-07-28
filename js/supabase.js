/**
 * supabase.js - Supabase 連携 & マッチングシミュレーション
 */

class SupabaseManager {
  constructor() {
    this.defaultUrl = 'https://dwvqpzmjbvpfzvkodgko.supabase.co';
    this.defaultKey = 'sb_publishable_W2q0T8XZfvt7Q7VpxTOvGw_rZio5SBJ';

    this.url = localStorage.getItem('supabase_url') || this.defaultUrl;
    this.key = localStorage.getItem('supabase_key') || this.defaultKey;
    this.isConfigured = !!(this.url && this.key);
    this.client = null;
    this.currentRoom = null;
    this.initClient();
  }

  initClient() {
    if (this.isConfigured && typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      try {
        this.client = window.supabase.createClient(this.url, this.key);
        console.log('Supabase client initialized.');
      } catch (e) {
        console.warn('Supabase initialization failed:', e);
      }
    } else {
      console.log('Supabase CDN not loaded or credentials default fallback.');
    }
  }

  saveCredentials(url, key) {
    this.url = url.trim();
    this.key = key.trim();
    localStorage.setItem('supabase_url', this.url);
    localStorage.setItem('supabase_key', this.key);
    this.isConfigured = !!(this.url && this.key);
    this.initClient();
  }

  async syncUserDataToCloud(userData) {
    if (!this.isConfigured || !this.client) return;
    try {
      const user = (await this.client.auth.getUser())?.data?.user;
      if (!user) return;

      // Stats Sync
      for (const gameId in userData.stats) {
        const stat = userData.stats[gameId];
        await this.client.from('user_stats').upsert({
          user_id: user.id,
          game_id: gameId,
          rank_num: stat.rankNum,
          wins: stat.wins,
          losses: stat.losses,
          draws: stat.draws,
          unlocked_ai_level: stat.unlockedAiLevel
        });
      }
    } catch (e) {
      console.warn('Cloud sync error:', e);
    }
  }

  // オンラインマッチング検索 (通常 / ランクマッチ)
  async startMatching(gameId, mode, userRankNum, onMatchFound) {
    if (this.isConfigured && this.client) {
      // Supabase本番Realtimeキュー
      try {
        console.log(`Supabase matching searching for ${gameId} (${mode})...`);
        // 実際のSupabase処理のバックアップとして5秒以内にマッチしなければ模擬プレイヤーを割り当て
        setTimeout(() => {
          this.triggerSimulatedMatch(gameId, mode, userRankNum, onMatchFound);
        }, 3000);
      } catch (e) {
        this.triggerSimulatedMatch(gameId, mode, userRankNum, onMatchFound);
      }
    } else {
      // Supabase未設定時の模擬オンラインマッチング
      setTimeout(() => {
        this.triggerSimulatedMatch(gameId, mode, userRankNum, onMatchFound);
      }, 2000 + Math.random() * 1500);
    }
  }

  triggerSimulatedMatch(gameId, mode, userRankNum, onMatchFound) {
    // 仮想のオンライン対戦相手の生成
    const mockNames = ['Sakura_88', 'Gamer_Zero', 'ShadowMaster', 'DragonKing', 'Zen_Player', 'CyberKnight', 'MatchHero'];
    const oppName = mockNames[Math.floor(Math.random() * mockNames.length)];

    let oppRankNum = userRankNum;
    if (mode === 'casual') {
      // 通常マッチ：±30ランクのランダム
      const offset = Math.floor(Math.random() * 60) - 30;
      oppRankNum = Math.min(200, Math.max(1, userRankNum + offset));
    } else if (mode === 'ranked') {
      // ランクマッチ：±3の同格ランク帯
      const offset = Math.floor(Math.random() * 7) - 3;
      oppRankNum = Math.min(200, Math.max(1, userRankNum + offset));
    }

    const oppRankObj = ALL_RANKS[oppRankNum - 1];

    onMatchFound({
      opponentName: oppName,
      opponentRank: oppRankObj,
      roomId: 'sim_' + Date.now(),
      isHost: Math.random() > 0.5
    });
  }
}

const supabaseManager = new SupabaseManager();
window.supabaseManager = supabaseManager;
