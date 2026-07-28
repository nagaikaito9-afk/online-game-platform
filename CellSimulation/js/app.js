/**
 * Cell Simulation - app.js
 * メインコントローラー・タイムコントロール・図鑑・データ保存
 */

class CellSimulationApp {
  constructor() {
    this.canvas = document.getElementById('sim-canvas');
    this.engine = new ParticleEngine(this.canvas);
    this.unlockedDiscoveries = JSON.parse(localStorage.getItem('cell_sim_unlocked') || '[]');

    this.initUI();
    this.bindEvents();
    this.startLoop();
  }

  initUI() {
    this.updateEraUI();
    this.renderCompendium();
  }

  bindEvents() {
    // タップ・クリックでエネルギー注入
    this.canvas.addEventListener('click', (e) => {
      this.engine.injectEnergyTap(e.clientX, e.clientY);
    });

    // タイムコントロールボタン (Pause, 1x, 5x, 50x, 1000x)
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        cellAudioEngine.playSE('click');
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const speed = parseInt(e.target.dataset.speed);
        this.engine.timeScale = speed;
      });
    });

    // 触媒注入ボタン
    document.getElementById('btn-inject-catalyst').addEventListener('click', () => {
      cellAudioEngine.playSE('combine');
      this.engine.energy += 100;
      for (let i = 0; i < 8; i++) {
        const p = this.engine.createParticle('amino');
        this.engine.particles.push(p);
      }
    });

    // 図鑑モーダルオープン/クローズ
    document.getElementById('btn-open-compendium').addEventListener('click', () => {
      cellAudioEngine.playSE('click');
      this.renderCompendium();
      document.getElementById('modal-compendium').classList.add('active');
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const m = e.target.closest('.modal-overlay');
        if (m) m.classList.remove('active');
      });
    });

    // リセットボタン
    document.getElementById('btn-reset-sim').addEventListener('click', () => {
      if (confirm('シミュレーションを最初(無の宇宙)からやり直しますか？')) {
        this.engine.energy = 0;
        this.engine.currentEraId = 'cosmic';
        this.unlockedDiscoveries = [];
        localStorage.removeItem('cell_sim_unlocked');
        localStorage.removeItem('cell_sim_energy');
        this.engine.initParticles();
        this.updateEraUI();
        this.renderCompendium();
      }
    });
  }

  updateEraUI() {
    const eraObj = ERA_PHASES.find(e => e.id === this.engine.currentEraId) || ERA_PHASES[0];
    document.getElementById('era-title-display').textContent = eraObj.name;
    document.getElementById('era-desc-display').textContent = eraObj.desc;
    document.getElementById('energy-counter-display').textContent = `⚡ エネルギー: ${Math.floor(this.engine.energy)}`;
    document.getElementById('cell-counter-display').textContent = `🦠 生存細胞数: ${this.engine.cellCount}`;

    // 図鑑ロック解除の自動検出
    DISCOVERY_ITEMS.forEach(item => {
      if (!this.unlockedDiscoveries.includes(item.id) && this.engine.energy >= item.req) {
        this.unlockedDiscoveries.push(item.id);
        localStorage.setItem('cell_sim_unlocked', JSON.stringify(this.unlockedDiscoveries));
        cellAudioEngine.playSE('discovery');
        this.showNotification(`🎉 【新発見】${item.icon} ${item.name} が化学検証されました！`);
      }
    });
  }

  showNotification(text) {
    const notif = document.getElementById('discovery-notification');
    if (!notif) return;
    notif.textContent = text;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 3500);
  }

  renderCompendium() {
    const grid = document.getElementById('compendium-grid');
    if (!grid) return;
    grid.innerHTML = '';

    DISCOVERY_ITEMS.forEach(item => {
      const isUnlocked = this.unlockedDiscoveries.includes(item.id);
      const card = document.createElement('div');
      card.style.cssText = `
        background: ${isUnlocked ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.03)'};
        border: 1px solid ${isUnlocked ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'};
        border-radius: 12px;
        padding: 0.8rem;
        opacity: ${isUnlocked ? '1' : '0.4'};
      `;
      card.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 0.3rem;">${isUnlocked ? item.icon : '🔒'}</div>
        <div style="font-weight: bold; font-size: 0.95rem; color: ${isUnlocked ? '#fff' : '#888'};">${item.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">${isUnlocked ? item.desc : `必要エネルギー: ${item.req}`}</div>
      `;
      grid.appendChild(card);
    });
  }

  startLoop() {
    const loop = () => {
      this.engine.update();
      this.updateEraUI();
      requestAnimationFrame(loop);
    };
    loop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cellApp = new CellSimulationApp();
});
