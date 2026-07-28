/**
 * app.js - メインアプリケーションUI制御 & 状態管理
 */

class AppController {
  constructor() {
    this.currentMode = null; // 'ai', 'casual', 'ranked'
    this.selectedGameId = null;
    this.selectedAiLevel = 1;
    this.currentGameInstance = null;

    this.initElements();
    this.bindEvents();
    this.updateHeaderUI();
  }

  initElements() {
    this.screens = {
      home: document.getElementById('screen-home'),
      mode: document.getElementById('screen-mode'),
      aiLevel: document.getElementById('screen-ai-level'),
      matching: document.getElementById('screen-matching'),
      gameSelect: document.getElementById('screen-game-select'),
      gameplay: document.getElementById('screen-gameplay')
    };

    this.modals = {
      settings: document.getElementById('modal-settings'),
      supabase: document.getElementById('modal-supabase'),
      titles: document.getElementById('modal-titles')
    };
  }

  showScreen(screenKey) {
    audioManager.playSE('click');
    Object.keys(this.screens).forEach(key => {
      this.screens[key].classList.remove('active');
    });
    if (this.screens[screenKey]) {
      this.screens[screenKey].classList.add('active');
    }
  }

  openModal(modalKey) {
    audioManager.playSE('click');
    if (this.modals[modalKey]) {
      this.modals[modalKey].classList.add('active');
    }
  }

  closeModal(modalKey) {
    if (this.modals[modalKey]) {
      this.modals[modalKey].classList.remove('active');
    }
  }

  updateHeaderUI() {
    const user = rankTitleManager.userData;
    document.getElementById('header-username').textContent = user.username;
    
    const titleObj = rankTitleManager.getEquippedTitle();
    document.getElementById('header-title').textContent = `称号: ${titleObj.name}`;
  }

  bindEvents() {
    // ホーム画面
    document.getElementById('btn-home-play').addEventListener('click', () => {
      audioManager.startBGM();
      this.showScreen('mode');
    });
    document.getElementById('btn-home-settings').addEventListener('click', () => {
      this.openModal('settings');
    });

    // モード選択画面ボタン
    document.getElementById('mode-card-ai').addEventListener('click', () => {
      this.currentMode = 'ai';
      this.renderAiLevelScreen();
      this.showScreen('aiLevel');
    });
    document.getElementById('mode-card-casual').addEventListener('click', () => {
      this.currentMode = 'casual';
      this.renderGameSelectScreen();
      this.showScreen('gameSelect');
    });
    document.getElementById('mode-card-ranked').addEventListener('click', () => {
      this.currentMode = 'ranked';
      this.renderGameSelectScreen();
      this.showScreen('gameSelect');
    });

    // 戻るボタン群
    document.querySelectorAll('.btn-back-home').forEach(btn => {
      btn.addEventListener('click', () => this.showScreen('home'));
    });
    document.querySelectorAll('.btn-back-mode').forEach(btn => {
      btn.addEventListener('click', () => this.showScreen('mode'));
    });

    // キャンセルマッチング
    document.getElementById('btn-cancel-matching').addEventListener('click', () => {
      this.showScreen('gameSelect');
    });

    // 降参・ゲーム終了
    document.getElementById('btn-quit-game').addEventListener('click', () => {
      if (confirm('ゲームを終了してゲーム選択画面へ戻りますか？')) {
        this.showScreen('gameSelect');
      }
    });

    // モーダルオープン/クローズ
    document.getElementById('btn-supabase-modal').addEventListener('click', () => {
      document.getElementById('supabase-input-url').value = supabaseManager.url;
      document.getElementById('supabase-input-key').value = supabaseManager.key;
      this.openModal('supabase');
    });

    document.getElementById('btn-titles-modal').addEventListener('click', () => {
      this.renderTitlesModal();
      this.openModal('titles');
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // サウンド調整スライダー
    document.getElementById('slider-bgm').addEventListener('input', (e) => {
      audioManager.setBgmVolume(e.target.value);
    });
    document.getElementById('slider-se').addEventListener('input', (e) => {
      audioManager.setSeVolume(e.target.value);
    });
    document.getElementById('btn-test-se').addEventListener('click', () => {
      audioManager.playSE('unlock');
    });

    // Supabase設定保存ボタン
    document.getElementById('btn-save-supabase').addEventListener('click', () => {
      const url = document.getElementById('supabase-input-url').value;
      const key = document.getElementById('supabase-input-key').value;
      supabaseManager.saveCredentials(url, key);
      document.getElementById('supabase-status-msg').textContent = '✅ 設定を保存し、Supabaseクライアントを更新しました！';
      setTimeout(() => this.closeModal('supabase'), 1500);
    });
  }

  // AI強さ段階描画 (Level 1〜20)
  renderAiLevelScreen() {
    const container = document.getElementById('ai-level-container');
    const userStats = rankTitleManager.userData.stats;

    container.innerHTML = '';
    for (let lvl = 1; lvl <= 20; lvl++) {
      const card = document.createElement('div');
      card.className = 'ai-level-card';
      card.innerHTML = `
        <div class="ai-level-num">Level ${lvl}</div>
        <div style="font-size: 0.8rem; margin-top: 0.3rem;">${lvl === 1 ? '入門' : lvl <= 10 ? '中級' : '上級'}</div>
      `;

      card.addEventListener('click', () => {
        this.selectedAiLevel = lvl;
        this.renderGameSelectScreen();
        this.showScreen('gameSelect');
      });

      container.appendChild(card);
    }
  }

  // ゲーム選択画面描画
  renderGameSelectScreen() {
    const container = document.getElementById('game-selection-container');
    container.innerHTML = '';

    GAMES_LIST.forEach(game => {
      const rankInfo = rankTitleManager.getRankInfo(game.id);
      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
        <div class="game-card-icon">${game.icon}</div>
        <div class="game-card-title">${game.name}</div>
        <div class="game-card-rank">ランク: ${rankInfo.name}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">${game.desc}</div>
      `;

      card.addEventListener('click', () => {
        this.selectedGameId = game.id;
        if (game.hasSubOptions) {
          this.promptSubOptions(game);
        } else {
          this.proceedToMatchingOrPlay();
        }
      });

      container.appendChild(card);
    });
  }

  // 囲碁などのサブオプション選択 (9路/13路/19路, 置石あり/なし)
  promptSubOptions(game) {
    const size = prompt('盤面サイズを選択してください:\n9 (9路盤)\n13 (13路盤)\n19 (19路盤)', '9');
    const boardSize = [9, 13, 19].includes(parseInt(size)) ? parseInt(size) : 9;

    const handicapChoice = prompt('置石ルールを選択してください:\n0 (置石なし - 互先)\n2 (置石あり - 2石ハンデ)', '0');
    const handicap = parseInt(handicapChoice) === 2 ? 2 : 0;

    this.selectedGoOptions = { boardSize, handicap };
    this.proceedToMatchingOrPlay();
  }

  proceedToMatchingOrPlay() {
    const userRank = rankTitleManager.getRankInfo(this.selectedGameId);

    if (this.currentMode === 'ai') {
      this.startGameplay(true);
    } else {
      // 通常 / ランクマッチング
      this.showScreen('matching');
      document.getElementById('matching-status-text').textContent = `${this.currentMode === 'ranked' ? 'ランクマッチ' : '通常マッチ'} 探索中...`;
      document.getElementById('matching-sub-text').textContent = `あなたのランク: ${userRank.name}`;

      supabaseManager.startMatching(this.selectedGameId, this.currentMode, userRank.id, (matchResult) => {
        audioManager.playSE('unlock');
        alert(`対戦相手が見つかりました！\n対戦相手: ${matchResult.opponentName} (${matchResult.opponentRank.name})`);
        this.startGameplay(false);
      });
    }
  }

  // ゲームの開始＆マウント
  startGameplay(isAi) {
    this.showScreen('gameplay');
    const mount = document.getElementById('game-board-mount');
    mount.innerHTML = '';

    const gameObj = GAMES_LIST.find(g => g.id === this.selectedGameId);
    document.getElementById('gameplay-header-info').textContent = 
      `${gameObj ? gameObj.name : ''} ｜ ${isAi ? `VS AI Level ${this.selectedAiLevel}` : 'VS オンラインプレイヤー'}`;

    const onFinishCallback = (result) => {
      const isWin = (result === 'win');
      const isDraw = (result === 'draw');

      rankTitleManager.addMatchResult(this.selectedGameId, isWin, isDraw, isAi, this.selectedAiLevel);
      this.updateHeaderUI();

      const newRank = rankTitleManager.getRankInfo(this.selectedGameId);

      alert(`対戦終了！ 結果: ${isWin ? '🏆 勝利！' : isDraw ? '🤝 引き分け' : '❌ 敗北'}\n現在のランク: ${newRank.name}`);
      this.showScreen('gameSelect');
    };

    // 各ゲームクラスのインスタンス化
    if (this.selectedGameId === 'tictactoe') {
      this.currentGameInstance = new TicTacToeGame(mount, onFinishCallback);
      this.currentGameInstance.init(isAi, this.selectedAiLevel);
    } else if (this.selectedGameId === 'reversi') {
      this.currentGameInstance = new ReversiGame(mount, onFinishCallback);
      this.currentGameInstance.init(isAi, this.selectedAiLevel);
    } else if (this.selectedGameId === 'gomoku') {
      this.currentGameInstance = new GomokuGame(mount, onFinishCallback);
      this.currentGameInstance.init(isAi, this.selectedAiLevel);
    } else if (this.selectedGameId === 'go') {
      this.currentGameInstance = new GoGame(mount, onFinishCallback);
      this.currentGameInstance.init(isAi, this.selectedAiLevel, this.selectedGoOptions || {});
    } else if (this.selectedGameId === 'chess') {
      this.currentGameInstance = new ChessGame(mount, onFinishCallback);
      this.currentGameInstance.init(isAi, this.selectedAiLevel);
    } else if (this.selectedGameId === 'shogi') {
      this.currentGameInstance = new ShogiGame(mount, onFinishCallback);
      this.currentGameInstance.init(isAi, this.selectedAiLevel);
    } else if (this.selectedGameId.startsWith('cards_')) {
      this.currentGameInstance = new PlayingCardsGame(mount, onFinishCallback);
      this.currentGameInstance.init(this.selectedGameId, isAi, this.selectedAiLevel);
    }
  }

  // 300称号図鑑モーダル描画
  renderTitlesModal() {
    const container = document.getElementById('titles-list-container');
    const unlocked = rankTitleManager.userData.unlockedTitles;
    const equippedId = rankTitleManager.userData.equippedTitleId;

    document.getElementById('titles-progress-bar').textContent = `獲得称号: ${unlocked.length} / ${ALL_TITLES.length}`;
    container.innerHTML = '';

    ALL_TITLES.forEach(title => {
      const isUnlocked = unlocked.includes(title.id);
      const isEquipped = equippedId === title.id;

      const item = document.createElement('div');
      item.style.cssText = `
        background: rgba(255,255,255,0.05);
        border: 1px solid ${isEquipped ? 'var(--accent-gold)' : isUnlocked ? 'var(--border-glow)' : 'rgba(255,255,255,0.05)'};
        border-radius: 10px;
        padding: 0.75rem;
        opacity: ${isUnlocked ? '1' : '0.45'};
      `;
      item.innerHTML = `
        <div style="font-weight: bold; font-size: 0.95rem; color: ${isUnlocked ? '#fff' : '#888'};">
          ${isUnlocked ? '🏆' : '🔒'} ${title.name}
          ${isEquipped ? '<span style="color:var(--accent-gold); font-size:0.75rem;">(装備中)</span>' : ''}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">${title.desc}</div>
        ${isUnlocked && !isEquipped ? `<button class="btn btn-secondary btn-equip-title" data-id="${title.id}" style="padding:0.2rem 0.6rem; font-size:0.75rem; margin-top:0.5rem;">装備する</button>` : ''}
      `;

      if (isUnlocked && !isEquipped) {
        item.querySelector('.btn-equip-title').addEventListener('click', (e) => {
          const tid = parseInt(e.target.dataset.id);
          rankTitleManager.equipTitle(tid);
          this.updateHeaderUI();
          this.renderTitlesModal();
        });
      }

      container.appendChild(item);
    });
  }
}

// アプリ起動
document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});
