/* SlimeRPG - ui.js */
class UIManager {
  constructor(player) {
    this.player = player;
    this.playerName = 'アース';
    this.inventoryOpen = false;
    this.menuOpen = false;
    this.dialogueActive = false;
    this.battleActive = false;

    // 会話キュー
    this.dialogueQueue = [];
    this.onDialogueComplete = null;

    // 初期所持品
    this.items = [
      { id: 'herb', name: '薬草', icon: '🌿', count: 3, desc: 'アースの体力(HP)を20回復する野草。' },
      { id: 'red_jelly', name: '赤いゼリー', icon: '🔴', count: 5, desc: 'アースの体の一部。赤いけどとても甘い。' },
      { id: 'small_stone', name: '小石', icon: '🪨', count: 2, desc: '道端に落ちていた普通の石。投げられる。' },
      { id: 'magic_water', name: '聖なる水滴', icon: '💧', count: 1, desc: 'アースの魔力(MP)を10回復する綺麗な水。' }
    ];

    this.selectedItemIndex = 0;
    this.initDOM();
  }

  initDOM() {
    this.inventoryModal = document.getElementById('inventory-modal');
    this.menuModal = document.getElementById('menu-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.nameModal = document.getElementById('name-modal');
    this.titleScreen = document.getElementById('title-screen');

    this.dialogueContainer = document.getElementById('dialogue-container');
    this.dialogueSpeaker = document.getElementById('dialogue-speaker');
    this.dialogueText = document.getElementById('dialogue-text');
    this.dialogueFace = document.getElementById('dialogue-face');

    this.battleScreen = document.getElementById('battle-screen');
    this.hud = document.getElementById('hud');

    this.inventoryGrid = document.getElementById('inventory-grid');
    this.inventoryDetail = document.getElementById('inventory-detail');

    // 閉じるボタン連携
    document.querySelectorAll('.close-btn, .close-menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-close');
        if (target === 'inventory') this.closeInventory();
        if (target === 'menu') this.closeMenu();
        if (target === 'settings') this.closeSettings();
      });
    });

    // ⚙️ 設定ボタン
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.openSettings();
    });

    // 会話ウィンドウクリックで次メッセージ
    this.dialogueContainer?.addEventListener('click', () => {
      this.advanceDialogue();
    });
  }

  setPlayerName(name) {
    if (!name || !name.trim()) name = 'アース';
    this.playerName = name.trim();
    this.player.name = this.playerName;

    document.querySelectorAll('#hud-player-name, .inv-name, .menu-name, #b-name').forEach(el => {
      el.textContent = this.playerName;
    });
  }

  // 会話イベント (2.png)
  startDialogueSequence(dialogueList, onComplete = null) {
    this.dialogueQueue = [...dialogueList];
    this.onDialogueComplete = onComplete;
    this.dialogueActive = true;
    this.dialogueContainer.classList.remove('hidden');
    this.advanceDialogue();
  }

  advanceDialogue() {
    if (this.dialogueQueue.length === 0) {
      this.dialogueActive = false;
      this.dialogueContainer.classList.add('hidden');
      if (this.onDialogueComplete) {
        const callback = this.onDialogueComplete;
        this.onDialogueComplete = null;
        callback();
      }
      return;
    }

    const current = this.dialogueQueue.shift();
    this.dialogueSpeaker.textContent = current.speaker || this.playerName;
    this.dialogueText.textContent = current.text || '';
    this.dialogueFace.textContent = current.face || '🔴';
  }

  // コマンド戦闘画面 (3.png)
  startBattle(enemyData, onEnd = null) {
    this.battleActive = true;
    this.battleScreen.classList.remove('hidden');

    const enemyArea = document.getElementById('enemy-area');
    const partyArea = document.getElementById('party-area');

    if (enemyArea) {
      enemyArea.innerHTML = `
        <div class="battle-sprite">${enemyData.icon || '👨'}</div>
        <div style="font-weight:bold; color:#f8fafc;">${enemyData.name || '人間'}</div>
      `;
    }

    if (partyArea) {
      partyArea.innerHTML = `
        <div class="battle-sprite">🔴</div>
        <div style="font-weight:bold; color:#fca5a5;">${this.playerName}</div>
      `;
    }

    // 戦闘ステータス更新
    document.getElementById('b-name').textContent = this.playerName;
    document.getElementById('b-hp').textContent = `${this.player.hp}/${this.player.maxHp}`;
    document.getElementById('b-cond').textContent = '---';

    // 戦闘コマンド登録
    document.querySelectorAll('.cmd-btn').forEach(btn => {
      btn.onclick = () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd === 'attack') {
          this.startDialogueSequence([
            { speaker: this.playerName, text: `${this.playerName}の体当たり攻撃！ 敵に 12 のダメージ！`, face: '🔴' },
            { speaker: enemyData.name, text: `${enemyData.name}は倒れた！ 経験値 25 を獲得！`, face: enemyData.icon }
          ], () => {
            this.endBattle();
            if (onEnd) onEnd();
          });
        } else if (cmd === 'escape') {
          this.startDialogueSequence([
            { speaker: this.playerName, text: `${this.playerName}は素早くすべって逃げ出した！`, face: '🔴' }
          ], () => {
            this.endBattle();
          });
        } else {
          this.startDialogueSequence([
            { speaker: 'システム', text: `まだ使用できません！`, face: 'ℹ️' }
          ]);
        }
      };
    });
  }

  endBattle() {
    this.battleActive = false;
    this.battleScreen.classList.add('hidden');
  }

  openSettings() {
    this.settingsModal?.classList.add('open');
  }

  closeSettings() {
    this.settingsModal?.classList.remove('open');
  }

  openInventory() {
    if (this.dialogueActive || this.battleActive) return;
    this.closeMenu();
    this.inventoryOpen = true;
    this.inventoryModal?.classList.add('open');
    this.renderInventory();
  }

  closeInventory() {
    this.inventoryOpen = false;
    this.inventoryModal?.classList.remove('open');
  }

  openMenu() {
    if (this.dialogueActive || this.battleActive) return;
    this.closeInventory();
    this.menuOpen = true;
    this.menuModal?.classList.add('open');
  }

  closeMenu() {
    this.menuOpen = false;
    this.menuModal?.classList.remove('open');
  }

  renderInventory() {
    if (!this.inventoryGrid) return;
    this.inventoryGrid.innerHTML = '';

    for (let i = 0; i < 15; i++) {
      const item = this.items[i];
      const slot = document.createElement('div');
      slot.className = `item-slot ${this.selectedItemIndex === i ? 'selected' : ''}`;

      if (item) {
        slot.innerHTML = `
          <span>${item.icon}</span>
          <span class="item-count">${item.count}</span>
        `;
      }

      slot.addEventListener('click', () => {
        this.selectedItemIndex = i;
        this.renderInventory();
      });

      this.inventoryGrid.appendChild(slot);
    }

    const activeItem = this.items[this.selectedItemIndex];
    if (activeItem) {
      this.inventoryDetail.innerHTML = `
        <div class="item-detail-title">${activeItem.icon} ${activeItem.name} (所持数: ${activeItem.count})</div>
        <div class="item-detail-desc">${activeItem.desc}</div>
      `;
    } else {
      this.inventoryDetail.innerHTML = `
        <div class="item-detail-title">空のスロット</div>
        <div class="item-detail-desc">ここには何も入っていません。</div>
      `;
    }
  }

  updateHUD() {
    const hpBar = document.getElementById('hp-bar-fill');
    const mpBar = document.getElementById('mp-bar-fill');
    const hpText = document.getElementById('hp-text');
    const mpText = document.getElementById('mp-text');

    if (hpBar && hpText) {
      const hpPct = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
      hpBar.style.width = `${hpPct}%`;
      hpText.textContent = `${this.player.hp} / ${this.player.maxHp}`;
    }

    if (mpBar && mpText) {
      const mpPct = Math.max(0, Math.min(100, (this.player.mp / this.player.maxMp) * 100));
      mpBar.style.width = `${mpPct}%`;
      mpText.textContent = `${this.player.mp} / ${this.player.maxMp}`;
    }
  }
}
