/**
 * Make the slime bigger - app.js
 * メインコントローラー・スライムマネー・🛒 SHOPシステム・ガチャ・図鑑
 */

class SlimeApp {
  constructor() {
    this.canvas = document.getElementById('slime-canvas');
    this.engine = new SlimeEngine(this.canvas);

    // セーブデータ / ステート
    this.money = 200; // 初期所持スライムマネー (200 🪙)
    this.tickets = 5; // 初期ガチャチケット
    this.wins = 0;
    this.battleStage = 1;
    this.unlockedSlimes = new Set([1]); // 初期スライム (ID: 1)
    this.currentCodexFilter = 'ALL';

    this.bindEvents();
    this.updateUI();
    this.startLoop();
  }

  showToast(msg) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  updateUI() {
    document.getElementById('val-money').textContent = `${this.money.toLocaleString()} 🪙`;
    document.getElementById('val-tickets').textContent = `${this.tickets} 枚`;
    document.getElementById('val-wins').textContent = `${this.wins} 勝`;

    const count = this.unlockedSlimes.size;
    const pct = ((count / 200) * 100).toFixed(1);
    document.getElementById('val-codex-count').textContent = `${count} / 200 (${pct}%)`;

    const shopMoney = document.getElementById('shop-user-money');
    if (shopMoney) shopMoney.textContent = `${this.money.toLocaleString()} 🪙`;
  }

  bindEvents() {
    // 🛒 SHOP モーダルを開く
    document.getElementById('btn-open-shop').addEventListener('click', () => {
      if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
      this.updateUI();
      document.getElementById('modal-shop').classList.add('active');
    });

    // 🛒 SHOP 購入処理
    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemType = e.target.dataset.buy;
        this.processShopPurchase(itemType);
      });
    });

    // 💥 分裂ボタン
    document.getElementById('btn-split').addEventListener('click', () => {
      const res = this.engine.splitSlime();
      this.showToast(res.msg);
    });

    // ⚔️ バトルボタン
    document.getElementById('btn-battle').addEventListener('click', () => {
      if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
      this.engine.startBattle(this.battleStage);
      this.showToast(`⚔️ 【デビルスライム Lv.${this.battleStage}】とのバトルを開始！勝利してマネーとチケットをGET！`);
    });

    // 🏰 ダンジョンボス戦ボタン
    const dungeonBtn = document.getElementById('btn-dungeon');
    if (dungeonBtn) {
      dungeonBtn.addEventListener('click', () => {
        if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
        const bossLevel = Math.max(10, this.battleStage * 2);
        this.engine.startBattle(bossLevel);
        this.showToast(`🏰 究極ボス【魔王暗黒ドラゴン・スライム (Lv.${bossLevel})】降臨！勝利で超超ボーナス(5000🪙 & 10🎟️)獲得！`);
      });
    }

    // 🎟️ ガチャモーダル
    document.getElementById('btn-open-gacha').addEventListener('click', () => {
      if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
      document.getElementById('modal-gacha').classList.add('active');
    });

    document.getElementById('btn-gacha-1').addEventListener('click', () => {
      this.drawGacha(1);
    });

    document.getElementById('btn-gacha-10').addEventListener('click', () => {
      this.drawGacha(10);
    });

    // 📚 全200種図鑑モーダル
    document.getElementById('btn-open-codex').addEventListener('click', () => {
      if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
      this.renderCodexGrid();
      document.getElementById('modal-codex').classList.add('active');
    });

    document.querySelectorAll('.codex-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
        document.querySelectorAll('.codex-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentCodexFilter = tab.dataset.rarity;
        this.renderCodexGrid();
      });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const m = e.target.closest('.modal-overlay');
        if (m) m.classList.remove('active');
      });
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.engine.checkClick(mx, my);
    });
  }

  // 🛒 SHOP 商品の購入 ＆ 処理
  processShopPurchase(itemType) {
    const prices = {
      'food-1': { price: 50, growth: 10, name: '🍏 スモールゼリー' },
      'food-2': { price: 150, growth: 25, name: '🍎 ミディアムケーキ' },
      'food-3': { price: 400, growth: 60, name: '🍊 ラージプリン' },
      'food-4': { price: 1000, growth: 150, name: '🍇 メガフルーツパフェ' },
      'food-5': { price: 3000, growth: 400, name: '👑 キングスターフルーツ' },
      'breed': { price: 300, name: '💕 恋のしずく (繁殖薬)' },
      'ticket-1': { price: 200, count: 1, name: '🎟️ ガチャチケット (1枚)' },
      'ticket-10': { price: 1800, count: 10, name: '🎟️ ガチャチケット (10連パック)' }
    };

    const item = prices[itemType];
    if (!item) return;

    if (this.money < item.price) {
      this.showToast(`⚠️ スライムマネーが足りません！ (必要: ${item.price} 🪙, 所持: ${this.money} 🪙) バトルで稼ごう！`);
      return;
    }

    this.money -= item.price;
    this.updateUI();

    if (itemType.startsWith('food-')) {
      // 5段階の餌
      this.engine.feedTierSlimes(item.growth);
      this.showToast(`🛒 【${item.name}】を購入して与えました！スライムがさらに爆発巨大化！(サイズ +${item.growth})`);
    } else if (itemType === 'breed') {
      // 繁殖薬
      const res = this.engine.breedSlimes();
      this.showToast(res.msg);
    } else if (itemType.startsWith('ticket-')) {
      // チケットパック
      this.tickets += item.count;
      this.updateUI();
      if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('gacha');
      this.showToast(`🛒 【${item.name}】を購入しました！ (チケット +${item.count}枚)`);
    }
  }

  // 🎟️ ガチャ抽選
  drawGacha(count) {
    if (this.tickets < count) {
      this.showToast(`⚠️ ガチャチケットが足りません！SHOPで購入するかバトルで集めよう！`);
      return;
    }

    if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('gacha');
    this.tickets -= count;
    this.updateUI();

    const resultsContainer = document.getElementById('gacha-results');
    resultsContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const slime = this.rollSlimeByRarity();
      this.unlockedSlimes.add(slime.id);
      this.engine.addSlimeFromGacha(slime);

      const card = document.createElement('div');
      const rInfo = window.RARITY_INFO[slime.rarity];
      card.className = 'gacha-card';
      card.style.background = rInfo.bg;
      card.innerHTML = `
        <div style="font-size:1.8rem; margin-bottom:0.3rem;">${rInfo.icon}</div>
        <div style="font-size:0.75rem; font-weight:bold;">${slime.rarity}</div>
        <div style="font-weight:900; font-size:0.95rem; margin:0.2rem 0;">${slime.name}</div>
        <div style="font-size:0.75rem; opacity:0.9;">ATK: ${slime.atk} / HP: ${slime.hp}</div>
      `;
      resultsContainer.appendChild(card);
    }

    this.updateUI();
    this.showToast(`🎉 ガチャ結果！${count}体の新たなスライムを獲得・図鑑解放しました！`);
  }

  rollSlimeByRarity() {
    const rand = Math.random() * 100;
    let targetRarity = 'コモン';
    if (rand < 0.02) targetRarity = 'アルティメット';
    else if (rand < 0.20) targetRarity = 'ゴッド';
    else if (rand < 1.00) targetRarity = 'ミシック';
    else if (rand < 3.50) targetRarity = 'レジェンド';
    else if (rand < 10.0) targetRarity = 'エピック';
    else if (rand < 25.0) targetRarity = 'レア';
    else if (rand < 55.0) targetRarity = 'アンコモン';
    else targetRarity = 'コモン';

    const candidates = window.ALL_SLIMES.filter(s => s.rarity === targetRarity);
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    return picked || window.ALL_SLIMES[0];
  }

  renderCodexGrid() {
    const grid = document.getElementById('codex-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = window.ALL_SLIMES.filter(s => {
      return (this.currentCodexFilter === 'ALL' || s.rarity === this.currentCodexFilter);
    });

    document.getElementById('codex-progress-text').textContent = `図鑑収集率: ${this.unlockedSlimes.size} / 200 種類 (${((this.unlockedSlimes.size/200)*100).toFixed(1)}%)`;

    filtered.forEach(s => {
      const isUnlocked = this.unlockedSlimes.has(s.id);
      const card = document.createElement('div');
      const rInfo = window.RARITY_INFO[s.rarity];
      card.className = `codex-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      if (isUnlocked) {
        card.innerHTML = `
          <div style="font-size:1.5rem;">${rInfo.icon}</div>
          <div style="font-size:0.7rem; color:${rInfo.color}; font-weight:bold;">No.${s.id} [${s.rarity}]</div>
          <div style="font-weight:bold; font-size:0.85rem; margin:0.2rem 0; color:#fff;">${s.name}</div>
          <div style="font-size:0.7rem; color:var(--text-sub);">ATK:${s.atk} / HP:${s.hp}</div>
        `;
      } else {
        card.innerHTML = `
          <div style="font-size:1.5rem;">❓</div>
          <div style="font-size:0.7rem; color:var(--text-sub);">No.${s.id} [${s.rarity}]</div>
          <div style="font-weight:bold; font-size:0.85rem; margin:0.2rem 0; color:var(--text-sub);">🔒 ???</div>
          <div style="font-size:0.7rem; color:var(--text-sub);">未解放</div>
        `;
      }
      grid.appendChild(card);
    });
  }

  startLoop() {
    const loop = () => {
      this.engine.update();

      // バトル勝利判定
      if (this.engine.enemySlime && this.engine.enemySlime.hp <= 0 && !this.engine.isBattleActive) {
        const rewardMoney = 300 * this.battleStage;
        this.wins++;
        this.money += rewardMoney;
        this.tickets += 3;
        this.battleStage++;
        this.engine.enemySlime = null;
        this.updateUI();
        this.showToast(`🏆 敵ボス撃破！勝利報酬として 【🪙 ${rewardMoney} 🪙】 ＆ 【🎟️ ガチャチケット +3枚】 を獲得！`);
      }

      this.engine.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.slimeApp = new SlimeApp();
});
