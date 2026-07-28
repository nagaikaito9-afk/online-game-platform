/**
 * WEBLOX - app.js
 * メインアプリケーション制御・マルチプレイ同期・UIバインド
 */

class WebloxApp {
  constructor() {
    this.canvas = document.getElementById('weblox-canvas');
    this.world = new World3D(this.canvas);
    this.playerAvatar = new Avatar3D(this.world.scene, true);

    this.otherAvatars = {};
    this.keys = { forward: false, backward: false, left: false, right: false, jump: false };
    this.isMouseDown = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;

    this.initPlayer();
    this.bindControls();
    this.bindUI();
    this.spawnOtherPlayers();
    this.animate();
  }

  initPlayer() {
    const savedColor = localStorage.getItem('weblox_color') || '#ffd166';
    const savedHat = localStorage.getItem('weblox_hat') || 'cap';
    this.playerAvatar.setCustomization(savedColor, savedHat);

    // ポータルワープ連動
    this.world.onPortalTouch = (targetWorldId) => {
      this.switchWorld(targetWorldId);
    };
  }

  bindControls() {
    // WASD / 矢印キー移動
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
      // サンドボックスでBキーでブロック設置
      if ((e.key === 'b' || e.key === 'B') && this.world.currentWorldId === 'sandbox') {
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

    // マウスドラッグでカメラ回転
    window.addEventListener('mousedown', (e) => {
      if (e.target === this.canvas) {
        this.isMouseDown = true;
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        const deltaX = e.clientX - this.previousMouseX;
        const deltaY = e.clientY - this.previousMouseY;
        this.world.cameraYaw -= deltaX * 0.005;
        this.world.cameraPitch = Math.max(0.1, Math.min(1.2, this.world.cameraPitch + deltaY * 0.005));
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => { this.isMouseDown = false; });
  }

  bindUI() {
    // アバターショップモーダルオープン
    document.getElementById('btn-open-shop').addEventListener('click', () => {
      audioEngine.playSE('click');
      document.getElementById('modal-shop').classList.add('active');
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const m = e.target.closest('.modal-overlay');
        if (m) m.classList.remove('active');
      });
    });

    // カラー＆帽子変更ボタン
    this.renderShopUI();

    // ワールド一覧モーダル
    document.getElementById('btn-open-worlds').addEventListener('click', () => {
      audioEngine.playSE('click');
      this.renderWorldsUI();
      document.getElementById('modal-worlds').classList.add('active');
    });

    // チャット送信
    document.getElementById('btn-send-weblox-chat').addEventListener('click', () => this.sendChat());
    document.getElementById('weblox-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendChat();
    });

    // エモートボタン群
    EMOTES.forEach(em => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.style.cssText = 'padding: 0.4rem 0.8rem; font-size: 0.85rem;';
      btn.textContent = em.name;
      btn.addEventListener('click', () => {
        audioEngine.playSE('click');
        this.playerAvatar.playEmote(em.id);
      });
      document.getElementById('emote-bar').appendChild(btn);
    });
  }

  renderShopUI() {
    const colorContainer = document.getElementById('shop-colors-grid');
    colorContainer.innerHTML = '';
    AVATAR_COLORS.forEach(c => {
      const el = document.createElement('div');
      el.style.cssText = `width: 40px; height: 40px; border-radius: 50%; background: ${c.hex}; cursor: pointer; border: 2px solid #fff;`;
      el.addEventListener('click', () => {
        audioEngine.playSE('click');
        localStorage.setItem('weblox_color', c.hex);
        this.playerAvatar.setCustomization(c.hex, localStorage.getItem('weblox_hat') || 'cap');
      });
      colorContainer.appendChild(el);
    });

    const hatContainer = document.getElementById('shop-hats-grid');
    hatContainer.innerHTML = '';
    AVATAR_HATS.forEach(h => {
      const el = document.createElement('div');
      el.style.cssText = 'padding: 0.6rem; background: rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer; font-size: 1.2rem; text-align: center;';
      el.innerHTML = `${h.icon}<br><span style="font-size:0.75rem;">${h.name}</span>`;
      el.addEventListener('click', () => {
        audioEngine.playSE('click');
        localStorage.setItem('weblox_hat', h.id);
        this.playerAvatar.setCustomization(localStorage.getItem('weblox_color') || '#ffd166', h.id);
      });
      hatContainer.appendChild(el);
    });
  }

  renderWorldsUI() {
    const container = document.getElementById('worlds-list-container');
    container.innerHTML = '';
    WEBLOX_WORLDS.forEach(w => {
      const card = document.createElement('div');
      card.style.cssText = 'background: rgba(255,255,255,0.08); border-radius: 14px; padding: 1rem; cursor: pointer; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; gap: 1rem;';
      card.innerHTML = `
        <div style="font-size: 2.5rem;">${w.icon}</div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 1.1rem;">${w.name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${w.desc}</div>
        </div>
        <button class="btn btn-primary" style="padding: 0.5rem 1rem;">移動</button>
      `;
      card.addEventListener('click', () => {
        audioEngine.playSE('click');
        document.getElementById('modal-worlds').classList.remove('active');
        this.switchWorld(w.id);
      });
      container.appendChild(card);
    });
  }

  switchWorld(worldId) {
    this.world.buildWorld(worldId);
    this.playerAvatar.position.set(0, 3, 0);
    this.playerAvatar.velocity.set(0, 0, 0);
    audioEngine.playSE('respawn');

    const worldObj = WEBLOX_WORLDS.find(w => w.id === worldId);
    document.getElementById('current-world-title').textContent = worldObj ? worldObj.name : 'WEBLOX';
  }

  // ロブロックス風オンライン他プレイヤーのスポーン
  spawnOtherPlayers() {
    const colors = ['#00f2fe', '#ff758f', '#00ff87', '#7209b7'];
    const hats = ['crown', 'cat', 'visor', 'tophat'];
    const names = ['NoobMaster_99', 'CyberGirl', 'RobloxPro', 'Alex_Gamer'];

    for (let i = 0; i < 4; i++) {
      const other = new Avatar3D(this.world.scene, false);
      other.setCustomization(colors[i], hats[i]);
      other.position.set((i - 1.5) * 6, 1, -8);
      other.group.position.copy(other.position);
      this.otherAvatars[names[i]] = other;
    }
  }

  sendChat() {
    const input = document.getElementById('weblox-chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    audioEngine.playSE('click');

    const container = document.getElementById('weblox-chat-messages');
    const msg = document.createElement('div');
    msg.style.cssText = 'background: rgba(0,0,0,0.6); padding: 0.3rem 0.6rem; border-radius: 6px; margin-bottom: 0.3rem;';
    msg.innerHTML = `<span style="color:var(--accent-gold); font-weight:bold;">あなた:</span> ${text}`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const inputState = {
      ...this.keys,
      cameraYaw: this.world.cameraYaw
    };

    this.playerAvatar.update(inputState);
    this.world.update(this.playerAvatar.position);

    // コインスコアUI更新
    document.getElementById('weblox-coin-score').textContent = `🪙 ${this.world.score}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.webloxApp = new WebloxApp();
});
