/**
 * supabase.js - 100% リアル Supabase オンライン対戦＆マッチング管理 (デモプレイヤー完全削除済)
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

  // 100% 実際の Supabase オンライン対戦マッチング
  async startMatching(gameId, mode, userRankNum, onMatchFound) {
    if (!this.isConfigured || !this.client) {
      alert('Supabaseへの接続が有効ではありません。AIと対戦モードをご利用ください。');
      return;
    }

    try {
      const currentUserId = (await this.client.auth.getUser())?.data?.user?.id || 'anon_' + Math.random().toString(36).substring(2, 9);

      let query = this.client
        .from('game_rooms')
        .select('*')
        .eq('game_id', gameId)
        .eq('mode', mode)
        .eq('status', 'waiting')
        .neq('host_id', currentUserId)
        .limit(1);

      if (mode === 'ranked') {
        query = query.gte('target_rank', userRankNum - 10).lte('target_rank', userRankNum + 10);
      }

      const { data: rooms } = await query;

      if (rooms && rooms.length > 0) {
        const targetRoom = rooms[0];
        const { error: updateError } = await this.client
          .from('game_rooms')
          .update({
            guest_id: currentUserId,
            status: 'playing'
          })
          .eq('id', targetRoom.id);

        if (!updateError) {
          this.currentRoom = targetRoom;
          onMatchFound({
            opponentName: 'オンラインプレイヤー',
            opponentRank: ALL_RANKS[Math.min(199, Math.max(0, (targetRoom.target_rank || 1) - 1))],
            roomId: targetRoom.id,
            isHost: false
          });
          return;
        }
      }

      const { data: newRoom } = await this.client
        .from('game_rooms')
        .insert({
          game_id: gameId,
          mode: mode,
          host_id: currentUserId,
          target_rank: userRankNum,
          status: 'waiting'
        })
        .select()
        .single();

      if (newRoom) {
        this.currentRoom = newRoom;
        const channel = this.client
          .channel(`room_${newRoom.id}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_rooms',
            filter: `id=eq.${newRoom.id}`
          }, (payload) => {
            if (payload.new.status === 'playing' && payload.new.guest_id) {
              this.client.removeChannel(channel);
              onMatchFound({
                opponentName: 'オンラインプレイヤー',
                opponentRank: ALL_RANKS[Math.min(199, Math.max(0, userRankNum - 1))],
                roomId: newRoom.id,
                isHost: true
              });
            }
          })
          .subscribe();
      }
    } catch (e) {
      console.error('Supabase matching error:', e);
      alert('オンラインマッチング接続エラーが発生しました。');
    }
  }
}

const supabaseManager = new SupabaseManager();
window.supabaseManager = supabaseManager;
