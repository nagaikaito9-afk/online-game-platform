/* SlimeRPG - ui.js */
class UIManager {
  constructor(player) {
    this.player = player;
    this.inventoryOpen = false;
    this.menuOpen = false;

    // 初期アイテムリスト (格下スライムアースの所持品)
    this.items = [
      { id: 'herb', name: '薬草', icon: '🌿', count: 3, desc: 'アースの体力(HP)を20回復する野草。' },
      { id: 'slime_jelly', name: 'スライムゼリー', icon: '🟢', count: 5, desc: 'アースの体の一部。ぷにぷにしていて少し甘い。' },
      { id: 'small_stone', name: '小石', icon: '🪨', count: 2, desc: '道端に落ちていたどこにでもある普通の石。' },
      { id: 'magic_water', name: '聖なる水滴', icon: '💧', count: 1, desc: 'アースの魔力(MP)を10回復する綺麗な水。' }
    ];

    this.selectedItemIndex = 0;
    this.initDOM();
  }

  initDOM() {
    this.inventoryModal = document.getElementById('inventory-modal');
    this.menuModal = document.getElementById('menu-modal');
    this.inventoryGrid = document.getElementById('inventory-grid');
    this.inventoryDetail = document.getElementById('inventory-detail');

    // 閉じるボタン
    document.querySelectorAll('.close-btn, .close-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-close');
        if (target === 'inventory') this.closeInventory();
        if (target === 'menu') this.closeMenu();
      });
    });

    this.renderInventory();
  }

  toggleInventory() {
    if (this.inventoryOpen) {
      this.closeInventory();
    } else {
      this.openInventory();
    }
  }

  openInventory() {
    this.closeMenu(); // 他のモーダルを閉じる
    this.inventoryOpen = true;
    this.inventoryModal?.classList.add('open');
    this.renderInventory();
  }

  closeInventory() {
    this.inventoryOpen = false;
    this.inventoryModal?.classList.remove('open');
  }

  toggleMenu() {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
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

    // 15スロット生成
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

    // アイテム詳細テキストの更新
    const activeItem = this.items[this.selectedItemIndex];
    if (activeItem) {
      this.inventoryDetail.innerHTML = `
        <div class="item-detail-title">${activeItem.icon} ${activeItem.name} (所持数: ${activeItem.count})</div>
        <div class="item-detail-desc">${activeItem.desc}</div>
      `;
    } else {
      this.inventoryDetail.innerHTML = `
        <div class="item-detail-title">空のスロット</div>
        <div class="item-detail-desc">ここには何も入っていません。冒険でアイテムを手に入れましょう。</div>
      `;
    }
  }

  // HUDバーのリアルタイム更新
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
