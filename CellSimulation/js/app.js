/**
 * Cell Simulation - app.js
 * メインコントローラー・100倍速タイムコントロール・リアルタイム実験プリセット (※alert一切全廃)
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
    setTimeout(() => toast.classList.remove('show'), 3200);
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

    // タイムコントロール (0x, 0.5x, 1x, 5x, 10x, 25x, 50x, 100x)
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const speed = parseFloat(e.target.dataset.speed);
        this.engine.timeScale = speed;
        document.getElementById('current-time-speed-display').textContent = `${speed}x`;
      });
    });

    // 清掃ボタン
    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
      this.engine.clearGrid();
      this.showToast('🧹 キャンバスをクリアしました');
    });

    // 「🧪 物質」カタログボタン
    document.getElementById('btn-open-material-catalog').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
      document.getElementById('modal-material-catalog').classList.add('active');
    });

    // 検索窓
    document.getElementById('catalog-search-input').addEventListener('input', (e) => {
      this.renderCatalogGrid(e.target.value.trim());
    });

    // カテゴリタブ
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

    // --------------------------------------------------------
    // 🧪 リアル実験プリセットイベント群
    // --------------------------------------------------------

    // 1. 溶岩 ✕ 水 実験
    document.getElementById('btn-preset-lava-water').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('boil');
      this.engine.clearGrid();

      const cx = Math.floor(this.engine.cols / 2);
      const cy = Math.floor(this.engine.rows / 2);

      for (let y = cy; y < cy + 18; y++) {
        for (let x = cx - 35; x < cx + 35; x++) {
          this.engine.setPixel(x, y, 2); // 溶岩 (1200℃)
        }
      }
      for (let y = cy - 28; y < cy - 5; y++) {
        for (let x = cx - 30; x < cx + 30; x++) {
          this.engine.setPixel(x, y, 1); // 水
        }
      }
      this.showToast('🌋 1200℃ 溶岩 ✕ 水 爆発的水蒸気・玄武岩化実験！');
    });

    // 2. 火薬庫 大爆発 実験
    const btnExp = document.getElementById('btn-preset-explosion');
    if (btnExp) {
      btnExp.addEventListener('click', () => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('explode');
        this.engine.clearGrid();

        const cx = Math.floor(this.engine.cols / 2);
        const cy = Math.floor(this.engine.rows / 2);

        // 火薬ブロック
        for (let y = cy - 15; y < cy + 15; y++) {
          for (let x = cx - 25; x < cx + 25; x++) {
            this.engine.setPixel(x, y, 14); // 火薬
          }
        }
        // 火種
        this.engine.setPixel(cx, cy - 16, 38); // 火
        this.showToast('🔥 火薬庫の爆発 ＆ 火花スパーク連鎖実験！');
      });
    }

    // 3. 強烈 酸侵食 実験
    const btnAcid = document.getElementById('btn-preset-acid-corrosion');
    if (btnAcid) {
      btnAcid.addEventListener('click', () => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('acid');
        this.engine.clearGrid();

        const cx = Math.floor(this.engine.cols / 2);
        const cy = Math.floor(this.engine.rows / 2);

        // 人間組織と鉄・木のレイヤー
        for (let y = cy; y < cy + 20; y++) {
          for (let x = cx - 40; x < cx + 40; x++) {
            const eId = (x < cx - 15) ? 22 : (x > cx + 15 ? 27 : 34); // 鉄, 人間組織, 木
            this.engine.setPixel(x, y, eId);
          }
        }
        // 酸を注ぐ
        for (let y = cy - 25; y < cy - 2; y++) {
          for (let x = cx - 12; x < cx + 12; x++) {
            this.engine.setPixel(x, y, 4); // 酸
          }
        }
        this.showToast('🧪 物質侵食 ＆ 泡発生 酸実験！');
      });
    }

    // 4. 液体窒素 超低温凍結 実験
    const btnNitro = document.getElementById('btn-preset-nitrogen-freeze');
    if (btnNitro) {
      btnNitro.addEventListener('click', () => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('boil');
        this.engine.clearGrid();

        const cx = Math.floor(this.engine.cols / 2);
        const cy = Math.floor(this.engine.rows / 2);

        // 水の池
        for (let y = cy; y < cy + 25; y++) {
          for (let x = cx - 35; x < cx + 35; x++) {
            this.engine.setPixel(x, y, 1); // 水 (20℃)
          }
        }
        // 液体窒素 (-196℃)
        for (let y = cy - 20; y < cy - 2; y++) {
          for (let x = cx - 15; x < cx + 15; x++) {
            this.engine.setPixel(x, y, 7);
          }
        }
        this.showToast('❄️ -196℃ 液体窒素 ✕ 水プール 超低温凍結実験！');
      });
    }

    // 5. 密度分離 (油・水・水銀) 実験
    const btnDensity = document.getElementById('btn-preset-density-oil');
    if (btnDensity) {
      btnDensity.addEventListener('click', () => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
        this.engine.clearGrid();

        const cx = Math.floor(this.engine.cols / 2);
        const cy = Math.floor(this.engine.rows / 2);

        // 混ざった液体（下から水銀・水・石油）をランダムに配置して分離を観察
        for (let y = cy - 20; y < cy + 20; y++) {
          for (let x = cx - 30; x < cx + 30; x++) {
            const rand = Math.random();
            const elemId = rand < 0.33 ? 5 : (rand < 0.66 ? 1 : 3); // 水銀, 水, 石油
            this.engine.setPixel(x, y, elemId);
          }
        }
        this.showToast('💧 密度分離演算（水銀 density 14 ＞ 水 5 ＞ 石油 3）実験！');
      });
    }

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
