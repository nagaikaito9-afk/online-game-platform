/**
 * Cell Simulation - app.js
 * メインコントロール・全200種類物質カタログ＆リアルタイム検索UI
 */

class CellSimulationApp {
  constructor() {
    this.canvas = document.getElementById('sim-canvas');
    this.engine = new SandboxEngine(this.canvas);
    this.currentSearchCategory = 'ALL';

    this.bindEvents();
    this.renderCatalogGrid();
    this.startLoop();
  }

  showToast(message) {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  bindEvents() {
    // マウスドラッグで塗り描き
    this.canvas.addEventListener('mousedown', (e) => {
      this.engine.isMouseDown = true;
      this.drawAtMouse(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.engine.isMouseDown) {
        this.drawAtMouse(e);
      }
    });

    window.addEventListener('mouseup', () => {
      this.engine.isMouseDown = false;
    });

    // ペンサイズスライダー
    document.getElementById('slider-brush-size').addEventListener('input', (e) => {
      this.engine.brushSize = parseInt(e.target.value);
      document.getElementById('brush-size-val').textContent = `${e.target.value} px`;
    });

    // タイムコントロール (Pause, 1x, 5x, 10x)
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const speed = parseInt(e.target.dataset.speed);
        this.engine.speed = speed;
      });
    });

    // 画面清掃 (Clear) ボタン
    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
      this.engine.clearGrid();
      this.showToast('🧹 キャンバス上の物質をクリアしました');
    });

    // 「🧪 物質」カタログラージボタン
    document.getElementById('btn-open-material-catalog').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
      document.getElementById('modal-material-catalog').classList.add('active');
    });

    // 物質検索入力フィルター
    document.getElementById('catalog-search-input').addEventListener('input', (e) => {
      this.renderCatalogGrid(e.target.value.trim());
    });

    // カテゴリフィルタータブ
    document.querySelectorAll('.catalog-cat-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
        document.querySelectorAll('.catalog-cat-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        this.currentSearchCategory = e.target.dataset.cat;
        const searchKeyword = document.getElementById('catalog-search-input').value.trim();
        this.renderCatalogGrid(searchKeyword);
      });
    });

    // プリセット配置 (溶岩 ✕ 水 実験)
    document.getElementById('btn-preset-lava-water').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('combine');
      this.engine.clearGrid();

      const cx = Math.floor(this.engine.cols / 2);
      const cy = Math.floor(this.engine.rows / 2);

      for (let y = cy; y < cy + 20; y++) {
        for (let x = cx - 35; x < cx + 35; x++) {
          this.engine.setPixel(x, y, 2); // 2: 溶岩
        }
      }
      for (let y = cy - 30; y < cy - 5; y++) {
        for (let x = cx - 30; x < cx + 30; x++) {
          this.engine.setPixel(x, y, 1); // 1: 水
        }
      }
      this.showToast('🌋 溶岩 ✕ 水 の流体・爆発反応実験プリセットを配置しました！');
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const m = e.target.closest('.modal-overlay');
        if (m) m.classList.remove('active');
      });
    });
  }

  drawAtMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = Math.floor((e.clientX - rect.left) / this.engine.scale);
    const my = Math.floor((e.clientY - rect.top) / this.engine.scale);
    this.engine.drawBrush(mx, my);
  }

  // 200種類物質カタログモーダルの描画 ＆ 検索
  renderCatalogGrid(keyword = '') {
    const grid = document.getElementById('catalog-materials-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = window.ALL_ELEMENTS.filter(el => {
      const matchCat = (this.currentSearchCategory === 'ALL' || el.cat === this.currentSearchCategory);
      const matchKey = (!keyword || el.name.toLowerCase().includes(keyword.toLowerCase()) || el.desc.includes(keyword));
      return matchCat && matchKey;
    });

    document.getElementById('catalog-count-info').textContent = `表示中: ${filtered.length} / 200 種類`;

    filtered.forEach(el => {
      const card = document.createElement('div');
      const isSelected = el.id === this.engine.selectedElementId;
      card.className = `catalog-card ${isSelected ? 'selected' : ''}`;
      card.style.cssText = `
        background: rgba(255,255,255,0.04);
        border: 1px solid ${isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'};
        border-radius: 12px;
        padding: 0.8rem;
        cursor: pointer;
        transition: all 0.15s ease;
      `;
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
          <span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:rgb(${el.color[0]},${el.color[1]},${el.color[2]});"></span>
          <span style="font-weight:bold; font-size:0.95rem;">${el.name}</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-sub);">${el.desc}</div>
      `;

      card.addEventListener('click', () => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
        this.engine.selectedElementId = el.id;
        document.getElementById('current-selected-material-display').textContent = el.name;
        document.getElementById('modal-material-catalog').classList.remove('active');
        this.showToast(`🧪 選択物質: 【${el.name}】`);
      });

      grid.appendChild(card);
    });
  }

  startLoop() {
    const loop = () => {
      this.engine.update();
      this.engine.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cellApp = new CellSimulationApp();
});
