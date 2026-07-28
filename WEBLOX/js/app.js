/**
 * WEBLOX - app.js
 * メイン統合制御・Roblox公式風ログイン・ダッシュボード・Studioモード連動
 */

class WebloxApp {
  constructor() {
    this.currentScreen = 'login'; // login, dashboard, gameplay, studio
    this.world = null;
    this.playerAvatar = null;
    this.studio = null;

    this.keys = { forward: false, backward: false, left: false, right: false, jump: false };
    this.isMouseDown = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;

    this.initAuth();
    this.bindEvents();
    this.renderDiscoverGames();
  }

  initAuth() {
    const username = localStorage.getItem('weblox_username');
    if (username) {
      this.loginSuccess(username);
    } else {
      this.showScreen('login');
    }
  }

  loginSuccess(username) {
    localStorage.setItem('weblox_username', username);
    const webux = localStorage.getItem('weblox_webux') || '500';
    localStorage.setItem('weblox_webux', webux);

    document.getElementById('display-username').textContent = username;
    document.getElementById('display-webux').textContent = `🪙 ${webux}`;
    this.showScreen('dashboard');
    audioEngine.playSE('unlock');
  }

  showScreen(screenKey) {
    this.currentScreen = screenKey;
    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`screen-${screenKey}`);
    if (target) target.classList.add('active');

    // 画面固有の処理
    if (screenKey === 'studio') {
      if (!this.studio) {
        const studioCanvas = document.getElementById('studio-canvas');
        this.studio = new WebloxStudio(studioCanvas);
        this.startStudioLoop();
      }
    }
  }

  bindEvents() {
    // ログイン・サインアップフォーム
    document.getElementById('btn-login-submit').addEventListener('click', () => {
      const u = document.getElementById('input-username').value.trim();
      const p = document.getElementById('input-password').value.trim();
      if (!u || !p) {
        alert('ユーザーネームとパスワードを入力してください。');
        return;
      }
      this.loginSuccess(u);
    });

    // ダッシュボードナビゲーション
    document.getElementById('nav-discover').addEventListener('click', () => this.showScreen('dashboard'));
    document.getElementById('nav-avatar').addEventListener('click', () => {
      this.renderAvatarPreview();
      this.showScreen('avatar');
    });
    document.getElementById('nav-studio').addEventListener('click', () => this.showScreen('studio'));

    // ログアウト
    document.getElementById('btn-logout').addEventListener('click', () => {
      localStorage.removeItem('weblox_username');
      location.reload();
    });

    // 3Dゲームプレイ開始
    document.getElementById('btn-back-to-dash').addEventListener('click', () => {
      this.showScreen('dashboard');
    });

    // WEBLOX Studio ツールバーボタン
    document.querySelectorAll('.studio-tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = e.target.dataset.tool;
        if (this.studio) this.studio.setTool(tool);
      });
    });

    document.querySelectorAll('.studio-add-part-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const partType = e.target.dataset.part;
        if (this.studio) this.studio.addPart(partType);
      });
    });

    // Studio ゲーム公開ボタン
    document.getElementById('btn-publish-studio-game').addEventListener('click', () => {
      const title = prompt('公開するゲームの名前を入力してください:', 'マイアドベンチャーObby');
      const desc = prompt('ゲームの説明を入力してください:', '自作の激ムズアスレチック！');
      if (title && this.studio) {
        this.studio.publishGame(title, desc);
        this.renderDiscoverGames();
      }
    });

    // 操作入力バインド
    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT') return;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.forward = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.backward = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === ' ' || e.code === 'Space') {
        this.keys.jump = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.forward = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.backward = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === ' ' || e.code === 'Space') this.keys.jump = false;
    });
  }

  // Discover (ゲーム一覧) の描画
  renderDiscoverGames() {
    const grid = document.getElementById('discover-games-grid');
    if (!grid) return;
    grid.innerHTML = '';

    WEBLOX_WORLDS.forEach(w => {
      const card = document.createElement('div');
      card.className = 'game-card-roblox';
      card.innerHTML = `
        <div class="game-card-banner" style="background:${w.bg};">${w.icon}</div>
        <div class="game-card-body">
          <div class="game-card-title">${w.name}</div>
          <div class="game-card-meta">By ${w.author}</div>
          <div class="game-card-stats">
            <span>👍 ${w.likes}</span>
            <span>👤 ${w.playing}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        audioEngine.playSE('click');
        this.launch3DGameWorld(w.id);
      });
      grid.appendChild(card);
    });
  }

  // 3Dゲームワールドの起動
  launch3DGameWorld(worldId) {
    this.showScreen('gameplay');
    const canvas = document.getElementById('weblox-canvas');

    if (!this.world) {
      this.world = new World3D(canvas);
      this.playerAvatar = new Avatar3D(this.world.scene, true);
      this.startGameplayLoop();
    }

    const savedColor = localStorage.getItem('weblox_color') || '#ffd166';
    const savedHat = localStorage.getItem('weblox_hat') || 'cap';
    this.playerAvatar.setCustomization(savedColor, savedHat);

    this.world.buildWorld(worldId);
    this.playerAvatar.position.set(0, 3, 0);

    const worldObj = WEBLOX_WORLDS.find(w => w.id === worldId);
    document.getElementById('current-gameplay-title').textContent = worldObj ? worldObj.name : 'WEBLOX';
  }

  startGameplayLoop() {
    const loop = () => {
      if (this.currentScreen === 'gameplay') {
        const inputState = { ...this.keys, cameraYaw: this.world.cameraYaw };
        this.playerAvatar.update(inputState);
        this.world.update(this.playerAvatar.position);
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  startStudioLoop() {
    const loop = () => {
      if (this.currentScreen === 'studio' && this.studio) {
        this.studio.render();
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  renderAvatarPreview() {
    // 試着UI
    const colorContainer = document.getElementById('avatar-colors-selector');
    colorContainer.innerHTML = '';
    AVATAR_COLORS.forEach(c => {
      const el = document.createElement('div');
      el.style.cssText = `width: 45px; height: 45px; border-radius: 50%; background: ${c.hex}; cursor: pointer; border: 3px solid #fff;`;
      el.addEventListener('click', () => {
        audioEngine.playSE('click');
        localStorage.setItem('weblox_color', c.hex);
      });
      colorContainer.appendChild(el);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.webloxApp = new WebloxApp();
});
