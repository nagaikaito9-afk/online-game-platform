/**
 * Nature - app.js
 * コントローラー・100倍速タイムバー・リアルタイム状態更新
 */

class NatureApp {
  constructor() {
    this.canvas = document.getElementById('nature-canvas');
    this.engine = new NatureEngine(this.canvas);

    this.bindEvents();
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
    // マウスドラッグで物理描画
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

    // ツール切り替えボタン
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.natureAudioEngine) window.natureAudioEngine.playSE('click');
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const toolId = parseInt(btn.dataset.tool);
        this.engine.selectedTool = toolId;
      });
    });

    // ペン径スライダー
    document.getElementById('slider-brush').addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.engine.brushSize = val;
      document.getElementById('val-brush').textContent = `${val} px`;
    });

    // タイムコントロール (0x, 1x, 5x, 10x, 25x, 50x, 100x)
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.natureAudioEngine) window.natureAudioEngine.playSE('click');
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const speed = parseFloat(btn.dataset.speed);
        this.engine.timeScale = speed;
        document.getElementById('stat-speed').textContent = `${speed}x`;
        this.showToast(`⏱️ 進行速度を 【${speed}x】 に設定しました`);
      });
    });

    // 清掃ボタン
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (window.natureAudioEngine) window.natureAudioEngine.playSE('click');
      this.engine.clearGrid();
      this.showToast('🧹 キャンバスをクリアしました');
    });

    // 実験プリセット1: 大自然 ＆ 水循環実験
    document.getElementById('btn-preset-cycle').addEventListener('click', () => {
      if (window.natureAudioEngine) window.natureAudioEngine.playSE('click');
      this.engine.initDefaultTerrain();

      const cx = Math.floor(this.engine.cols * 0.7);
      const topY = Math.floor(this.engine.rows * 0.2);

      // 上空に太陽熱、海の上に水を追加
      for (let y = 5; y < 15; y++) {
        for (let x = cx - 20; x < cx + 20; x++) {
          this.engine.setPixel(x, y, 8); // 太陽熱線
        }
      }
      this.showToast('🌍 水循環 ＆ 大自然生態系シミュレーションをセット！100倍速で観測してみよう！');
    });

    // 実験プリセット2: 巨大雨雲 ＆ 大雨発生
    document.getElementById('btn-preset-rainstorm').addEventListener('click', () => {
      if (window.natureAudioEngine) window.natureAudioEngine.playSE('thunder');
      this.engine.clearGrid();
      this.engine.initDefaultTerrain();

      const topY = Math.floor(this.engine.rows * 0.2);
      for (let y = topY - 10; y < topY + 10; y++) {
        for (let x = 10; x < this.engine.cols - 10; x++) {
          this.engine.setPixel(x, y, 5); // 雲
        }
      }
      this.showToast('⛈️ 巨大な雨雲を配置！大地へ降る恵みの雨と緑の成長を観測！');
    });
  }

  drawAtMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = Math.floor((e.clientX - rect.left) / this.engine.scale);
    const my = Math.floor((e.clientY - rect.top) / this.engine.scale);
    this.engine.drawBrush(mx, my);
  }

  updateStats() {
    const s = this.engine.stats;
    document.getElementById('stat-water').textContent = s.waterCount;
    document.getElementById('stat-cloud').textContent = s.cloudCount;
    document.getElementById('stat-rain').textContent = s.rainCount;
    document.getElementById('stat-plant').textContent = s.plantCount;
  }

  startLoop() {
    const loop = () => {
      this.engine.update();
      this.engine.render();
      if (this.engine.tick % 10 === 0) {
        this.updateStats();
      }
      requestAnimationFrame(loop);
    };
    loop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.natureApp = new NatureApp();
});
