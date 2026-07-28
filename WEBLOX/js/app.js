/**
 * WEBLOX - app.js
 * メインアプリ統合制御 (Roblox Complete Experience Engine)
 */

class WebloxApp {
  constructor() {
    this.currentScreen = 'login';
    this.world = null;
    this.playerAvatar = null;
    this.studio = null;

    this.keys = { forward: false, backward: false, left: false, right: false, jump: false };

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
    document.getElementById('display-webux').textContent = webux;
    this.showScreen('portal');
    if (window.audioEngine) window.audioEngine.playSE('unlock');
  }

  showScreen(screenKey) {
    this.currentScreen = screenKey;
    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`screen-${screenKey}`);
    if (target) target.classList.add('active');

    if (screenKey === 'studio') {
      if (!this.studio) {
        const canvas = document.getElementById('studio-canvas');
        this.studio = new WebloxStudio(canvas);
        this.startStudioLoop();
      }
    }
  }

  bindEvents() {
    // ログインフォーム
    document.getElementById('btn-login-submit').addEventListener('click', () => {
      const u = document.getElementById('input-username').value.trim();
      const p = document.getElementById('input-password').value.trim();
      if (!u || !p) {
        alert('ユーザーネームとパスワードを入力してください。');
        return;
      }
      this.loginSuccess(u);
    });

    // ログアウト
    document.getElementById('btn-logout').addEventListener('click', () => {
      localStorage.removeItem('weblox_username');
      location.reload();
    });

    // ナビゲーション
    const navHome = document.getElementById('sidebar-home');
    const navDiscover = document.getElementById('sidebar-discover');
    const navAvatar = document.getElementById('sidebar-avatar');
    const navStudio = document.getElementById('sidebar-studio');

    if (navHome) navHome.addEventListener('click', () => this.showScreen('portal'));
    if (navDiscover) navDiscover.addEventListener('click', () => this.showScreen('portal'));
    if (navAvatar) navAvatar.addEventListener('click', () => {
      this.renderAvatarSelector();
      this.showScreen('avatar');
    });
    if (navStudio) navStudio.addEventListener('click', () => this.showScreen('studio'));

    document.getElementById('avatar-nav-back').addEventListener('click', () => this.showScreen('portal'));
    document.getElementById('studio-btn-exit').addEventListener('click', () => this.showScreen('portal'));
    document.getElementById('btn-gameplay-exit').addEventListener('click', () => this.showScreen('portal'));

    // Studio ツールバーのパーツ追加
    document.querySelectorAll('.studio-add-part').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.part;
        if (this.studio) this.studio.addPart(type);
      });
    });

    // Studio ゲーム公開 (Publish)
    document.getElementById('btn-publish-studio-game').addEventListener('click', () => {
      const title = prompt('公開するゲームのタイトルを入力してください:', 'マイ3Dアスレチックワールド');
      const desc = prompt('ゲームの説明を入力してください:', 'WEBLOX Studioで制作したオリジナルゲーム！');
      if (title && this.studio) {
        this.studio.publishCurrentGame(title, desc);
        this.renderDiscoverGames();
        this.showScreen('portal');
      }
    });

    // キーボード操作バインド
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
      if ((e.key === 'b' || e.key === 'B') && this.world && this.world.currentWorldId === 'sandbox') {
        this.world.addSandboxBlock(this.playerAvatar.position.x, this.playerAvatar.position.y - 1, this.playerAvatar.position.z);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.forward = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.backward = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === ' ' || e.code === 'Space') this.keys.jump = false;
    });

    // エモートボタン生成
    const emoteContainer = document.getElementById('gameplay-emote-bar');
    if (emoteContainer && window.EMOTES) {
      window.EMOTES.forEach(em => {
        const b = document.createElement('button');
        b.className = 'btn-rbx-primary';
        b.style.cssText = 'padding: 0.4rem 0.8rem; font-size: 0.8rem; width: auto; background: rgba(25, 27, 34, 0.9);';
        b.textContent = em.name;
        b.addEventListener('click', () => {
          if (this.playerAvatar) this.playerAvatar.playEmote(em.id);
        });
        emoteContainer.appendChild(b);
      });
    }
  }

  renderDiscoverGames() {
    const discoverGrid = document.getElementById('discover-games-grid');
    if (!discoverGrid) return;
    discoverGrid.innerHTML = '';

    const myGames = JSON.parse(localStorage.getItem('weblox_my_games') || '[]');
    const allWorlds = [...myGames, ...WEBLOX_WORLDS];

    allWorlds.forEach(w => {
      const card = document.createElement('div');
      card.className = 'rbx-game-card';
      card.innerHTML = `
        <div class="game-thumb" style="background:${w.bg};">
          ${w.icon}
          <div class="play-hover-btn">▶</div>
        </div>
        <div class="game-info-body">
          <div class="game-title-text">${w.name}</div>
          <div class="game-author-text">By ${w.author}</div>
          <div class="game-stats-row">
            <span>👍 ${w.likes || '99%'}</span>
            <span>👤 ${w.playing || '1'}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        if (window.audioEngine) window.audioEngine.playSE('click');
        this.launch3DGameWorld(w);
      });
      discoverGrid.appendChild(card);
    });
  }

  launch3DGameWorld(worldObj) {
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

    this.world.buildWorld(worldObj.id);
    this.playerAvatar.position.set(0, 3, 0);

    document.getElementById('gameplay-title-display').textContent = worldObj.name;
  }

  startGameplayLoop() {
    const loop = () => {
      if (this.currentScreen === 'gameplay' && this.world && this.playerAvatar) {
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

  renderAvatarSelector() {
    const colorContainer = document.getElementById('avatar-colors-selector');
    if (!colorContainer) return;
    colorContainer.innerHTML = '';
    AVATAR_COLORS.forEach(c => {
      const el = document.createElement('div');
      el.style.cssText = `width: 50px; height: 50px; border-radius: 50%; background: ${c.hex}; cursor: pointer; border: 3px solid #fff;`;
      el.addEventListener('click', () => {
        if (window.audioEngine) window.audioEngine.playSE('click');
        localStorage.setItem('weblox_color', c.hex);
        alert(`🎨 アバターカラーを「${c.name}」に変更しました！`);
      });
      colorContainer.appendChild(el);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.webloxApp = new WebloxApp();
});
