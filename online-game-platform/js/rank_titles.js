/**
 * rank_titles.js - 200段階ランク ＆ 300称号システム管理モジュール
 */

class RankTitleManager {
  constructor() {
    this.storageKeyData = 'online_game_user_data';
    this.loadUserData();
  }

  // ユーザーデータ初期化 / ロード
  loadUserData() {
    const saved = localStorage.getItem(this.storageKeyData);
    if (saved) {
      try {
        this.userData = JSON.parse(saved);
      } catch (e) {
        this.userData = this.getDefaultUserData();
      }
    } else {
      this.userData = this.getDefaultUserData();
    }
  }

  getDefaultUserData() {
    const gameStats = {};
    GAMES_LIST.forEach(g => {
      gameStats[g.id] = {
        rankNum: 1, // 1〜200
        wins: 0,
        losses: 0,
        draws: 0,
        unlockedAiLevel: 1 // 1〜20
      };
    });

    return {
      username: 'プレイヤー',
      unlockedTitles: [1], // ID 1 は初期解放（初めの一歩）
      equippedTitleId: 1,
      stats: gameStats,
      totalPlays: 0,
      totalWins: 0,
      currentWinStreak: 0
    };
  }

  saveUserData() {
    localStorage.setItem(this.storageKeyData, JSON.stringify(this.userData));
    if (window.supabaseManager && window.supabaseManager.isConfigured) {
      window.supabaseManager.syncUserDataToCloud(this.userData);
    }
  }

  // 指定ゲームのランクオブジェクトを取得
  getRankInfo(gameId) {
    const stat = this.userData.stats[gameId] || { rankNum: 1 };
    const rNum = Math.min(200, Math.max(1, stat.rankNum));
    return ALL_RANKS[rNum - 1];
  }

  // 勝敗処理 & ランク変動 (200ランク)
  addMatchResult(gameId, isWin, isDraw = false, isAi = false, aiLevel = 1) {
    if (!this.userData.stats[gameId]) {
      this.userData.stats[gameId] = { rankNum: 1, wins: 0, losses: 0, draws: 0, unlockedAiLevel: 1 };
    }
    const stat = this.userData.stats[gameId];

    this.userData.totalPlays++;

    if (isDraw) {
      stat.draws++;
      this.userData.currentWinStreak = 0;
    } else if (isWin) {
      stat.wins++;
      this.userData.totalWins++;
      this.userData.currentWinStreak++;

      // AI戦で勝利した場合、AIレベル解放 (1 -> 2 -> ... -> 20)
      if (isAi && aiLevel >= stat.unlockedAiLevel && stat.unlockedAiLevel < 20) {
        stat.unlockedAiLevel++;
        audioManager.playSE('unlock');
      }

      // 対人戦または対AI戦でのランク変動 (昇格)
      if (stat.rankNum < 200) {
        stat.rankNum++;
      }
    } else {
      stat.losses++;
      this.userData.currentWinStreak = 0;
      // 降格（ブロンズ1未満には下がらない）
      if (stat.rankNum > 1 && !isAi) {
        stat.rankNum--;
      }
    }

    this.saveUserData();
    this.checkTitleUnlocks(gameId, isWin, isAi, aiLevel);
  }

  // 300称号の解禁チェック
  checkTitleUnlocks(gameId, isWin, isAi, aiLevel) {
    const newlyUnlocked = [];

    ALL_TITLES.forEach(title => {
      if (this.userData.unlockedTitles.includes(title.id)) return;

      let isConditionMet = false;
      const cond = title.condition;

      if (!cond) return;

      // プレイ回数
      if (cond.type === 'play' && this.userData.totalPlays >= cond.count) {
        isConditionMet = true;
      }
      // 通算勝利数
      if (cond.type === 'win' && this.userData.totalWins >= cond.count) {
        isConditionMet = true;
      }
      // 連勝数
      if (cond.type === 'streak' && this.userData.currentWinStreak >= cond.count) {
        isConditionMet = true;
      }
      // AI最高レベル撃破
      if (cond.type === 'ai_win' && isAi && isWin && aiLevel >= cond.level) {
        isConditionMet = true;
      }

      // ゲーム別判定
      if (cond.game === gameId) {
        const stat = this.userData.stats[gameId];
        // ランク達成
        if (cond.rank && stat.rankNum >= cond.rank) {
          isConditionMet = true;
        }
        // ゲーム別勝利数
        if (cond.winCount && stat.wins >= cond.winCount) {
          isConditionMet = true;
        }
        // ゲーム別AI撃破
        if (cond.aiLevel && isAi && isWin && aiLevel >= cond.aiLevel) {
          isConditionMet = true;
        }
      }

      if (isConditionMet) {
        this.userData.unlockedTitles.push(title.id);
        newlyUnlocked.push(title);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveUserData();
      newlyUnlocked.forEach(t => this.notifyTitleUnlock(t));
    }
  }

  // 称号獲得トースト通知
  notifyTitleUnlock(title) {
    audioManager.playSE('unlock');
    const toast = document.createElement('div');
    toast.className = 'title-toast-notification';
    toast.innerHTML = `
      <div class="toast-header">🏆 称号を獲得しました！</div>
      <div class="toast-title-name">${title.name}</div>
      <div class="toast-desc">${title.desc}</div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  equipTitle(titleId) {
    if (this.userData.unlockedTitles.includes(titleId)) {
      this.userData.equippedTitleId = titleId;
      this.saveUserData();
    }
  }

  getEquippedTitle() {
    const tid = this.userData.equippedTitleId || 1;
    return ALL_TITLES.find(t => t.id === tid) || ALL_TITLES[0];
  }
}

const rankTitleManager = new RankTitleManager();
