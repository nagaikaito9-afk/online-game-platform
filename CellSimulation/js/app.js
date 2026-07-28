/**
 * Cell Simulation - app.js
 * The Powder Toy スタイル メイン操作・UI制御 (※alert一切全廃)
 */

class CellSimulationApp {
  constructor() {
    this.canvas = document.getElementById('sim-canvas');
    this.engine = new SandboxEngine(this.canvas);

    this.bindEvents();
    this.renderElementPalette();
    this.startLoop();
  }

  // 自前カスタムトースト通知 (alertの代わり)
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

    // 画面清掃 (Clear) ボタン (※confirm無し)
    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
      this.engine.clearGrid();
      this.showToast('🧹 キャンバス上のすべての物質を消去しました');
    });

    // プリセット配置 (溶岩 ✕ 水 実験)
    document.getElementById('btn-preset-lava-water').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('combine');
      this.engine.clearGrid();

      // 下部に溶岩、上部に水を生成
      const cx = Math.floor(this.engine.cols / 2);
      const cy = Math.floor(this.engine.rows / 2);

      for (let y = cy; y < cy + 20; y++) {
        for (let x = cx - 30; x < cx + 30; x++) {
          this.engine.setPixel(x, y, ELEMENT_TYPES.LAVA);
        }
      }
      for (let y = cy - 25; y < cy - 5; y++) {
        for (let x = cx - 25; x < cx + 25; x++) {
          this.engine.setPixel(x, y, ELEMENT_TYPES.WATER);
        }
      }
      this.showToast('🌋 溶岩 ✕ 水 の実験プリセットを配置しました！');
    });

    // 人間組織 ✕ 酸 実験プリセット
    document.getElementById('btn-preset-human-acid').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('combine');
      this.engine.clearGrid();

      const cx = Math.floor(this.engine.cols / 2);
      const cy = Math.floor(this.engine.rows / 2);

      // 人間組織のブロック
      for (let y = cy; y < cy + 25; y++) {
        for (let x = cx - 15; x < cx + 15; x++) {
          this.engine.setPixel(x, y, ELEMENT_TYPES.HUMAN);
        }
      }
      // 上から強酸を降らせる
      for (let y = cy - 20; y < cy - 5; y++) {
        for (let x = cx - 10; x < cx + 10; x++) {
          this.engine.setPixel(x, y, ELEMENT_TYPES.ACID);
        }
      }
      this.showToast('🚶 人間組織 ✕ 強酸 の侵食実験プリセットを配置しました！');
    });

    // 情報モーダル
    document.getElementById('btn-open-info-modal').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
      document.getElementById('modal-info').classList.add('active');
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

  // 元素パレットボタンの動的生成
  renderElementPalette() {
    const container = document.getElementById('element-palette-grid');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(ELEMENT_TYPES).forEach(key => {
      const id = ELEMENT_TYPES[key];
      const spec = ELEMENT_SPECS[id];

      const btn = document.createElement('button');
      btn.className = `element-palette-btn ${id === this.engine.selectedElement ? 'active' : ''}`;
      btn.style.borderColor = `rgba(${spec.color[0]}, ${spec.color[1]}, ${spec.color[2]}, 0.8)`;
      btn.innerHTML = `<span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:rgb(${spec.color[0]},${spec.color[1]},${spec.color[2]}); margin-right:6px;"></span>${spec.name}`;

      btn.addEventListener('click', () => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
        document.querySelectorAll('.element-palette-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.engine.selectedElement = id;
        document.getElementById('current-selected-elem-text').textContent = spec.name;
      });

      container.appendChild(btn);
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
