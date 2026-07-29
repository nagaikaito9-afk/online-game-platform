/**
 * Make the slime bigger - app.js
 * メインコントローラー・単発/10連ガチャ・全200種図鑑・バトル報酬システム
 */

class SlimeApp {
  constructor() {
    this.canvas = document.getElementById('slime-canvas');
    this.engine = new SlimeEngine(this.canvas);

    // セーブデータ / ステート
    this.tickets = 5; // 初期ガチャチケット
    this.wins = 0;
    this.battleStage = 1;
    this.unlockedSlimes = new Set([1]); // 初期スライム (ID: 1) 解放
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
    document.getElementById('val-tickets').textContent = `${this.tickets} 枚`;
    document.getElementById('val-wins').textContent = `${this.wins} 勝`;

    const count = this.unlockedSlimes.size;
    const pct = ((count / 200) * 100).toFixed(1);
    document.getElementById('val-codex-count').textContent = `${count} / 200 (${pct}%)`;
  }

  bindEvents() {
    // 1. 給餌 ＆ 巨大化ボタン
    document.getElementById('btn-feed').addEventListener('click', () => {
      this.engine.feedSlimes();
      this.showToast('🍏 餌を与えてスライムを巨大化させました！');
    });

    // 2. 分裂ボタン
    document.getElementById('btn-split').addEventListener('click', () => {
      const res = this.engine.splitSlime();
      this.showToast(res.msg);
    });

    // 3. 繁殖ボタン
    document.getElementById('btn-breed').addEventListener('click', () => {
      const res = this.engine.breedSlimes();
      if (res.success) {
        this.updateUI();
      }
      this.showToast(res.msg);
    });

    // 4. バトルボタン (チケット獲得)
    document.getElementById('btn-battle').addEventListener('click', () => {
      if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
      this.engine.startBattle(this.battleStage);
      this.showToast(`⚔️ 【デビルスライム Lv.${this.battleStage}】とのバトルを開始！対戦に勝利してチケットをGET！`);
    });

    // 5. ガチャモーダル
    document.getElementById('btn-open-gacha').addEventListener('click', () => {
      if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
      document.getElementById('modal-gacha').classList.add('active');
    });

    // 6. 単発ガチャ引き (1枚)
    document.getElementById('btn-gacha-1').addEventListener('click', () => {
      this.drawGacha(1);
    });

    // 7. 10連ガチャ引き (10枚)
    document.getElementById('btn-gacha-10').addEventListener('click', () => {
      this.drawGacha(10);
    });

    // 8. 全200種図鑑モーダル
    document.getElementById('btn-open-codex').addEventListener('click', () => {
      if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
      this.renderCodexGrid();
      document.getElementById('modal-codex').classList.add('active');
    });

    // 図鑑レアリティタブ
    document.querySelectorAll('.codex-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('click');
        document.querySelectorAll('.codex-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentCodexFilter = tab.dataset.rarity;
        this.renderCodexGrid();
      });
    });

    // モーダル閉じる
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const m = e.target.closest('.modal-overlay');
        if (m) m.classList.remove('active');
      });
    });

    // キャンバスクリック (スライムタップ)
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.engine.checkClick(mx, my);
    });
  }

  // 🎟️ ガチャ抽選ロジック (全200種から確率に応じて厳密ピック)
  drawGacha(count) {
    if (this.tickets < count) {
      this.showToast(`⚠️ ガチャチケットが足りません！(必要: ${count}枚, 所持: ${this.tickets}枚) バトルで集めよう！`);
      return;
    }

    if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('gacha');
    this.tickets -= count;
    this.updateUI();

    const resultsContainer = document.getElementById('gacha-results');
    resultsContainer.innerHTML = '';

    const drawnSlimes = [];

    for (let i = 0; i < count; i++) {
      const slime = this.rollSlimeByRarity();
      drawnSlimes.push(slime);
      this.unlockedSlimes.add(slime.id);
      this.engine.addSlimeFromGacha(slime); // キャンバスにも追加！

      // ガチャカード描画
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

  // ガチャ確率計算
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

  // 📚 全200種類図鑑のグリッド描画
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
        this.wins++;
        this.battleStage++;
        this.tickets += 3; // 🎟️ 勝利報酬チケット +3枚！
        this.engine.enemySlime = null;
        this.updateUI();
        this.showToast(`🏆 敵ボス撃破！バトル勝利報酬として 【🎟️ ガチャチケット +3枚】 を獲得しました！`);
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
