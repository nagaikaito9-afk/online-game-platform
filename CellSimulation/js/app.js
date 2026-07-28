/**
 * Cell Simulation - app.js
 * メインコントローラー・地球物理計算 ＆ 学術ダッシュボードUI
 */

class CellSimulationApp {
  constructor() {
    this.canvas = document.getElementById('sim-canvas');
    this.renderer = new Earth3DRenderer(this.canvas);
    this.timeSpeedYearsPerSec = 1000000; // 初期1秒 = 100万年

    this.bindEvents();
    this.startLoop();
  }

  bindEvents() {
    // タイムコントロール (停止, 10万年/s, 100万年/s, 1000万年/s, 1億年/s)
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const speed = parseInt(e.target.dataset.years);
        this.timeSpeedYearsPerSec = speed;
      });
    });

    // 実験: 小惑星衝突 (Asteroid Impact)
    document.getElementById('btn-exp-asteroid').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('combine');
      this.renderer.model.triggerAsteroidImpact();
      alert('💥 巨大小惑星が衝突！ 表面温度が急上昇し大気中に大量のCO2と灰が散布されました。');
    });

    // 実験: 火山噴火スパイク
    document.getElementById('btn-exp-volcano').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('combine');
      this.renderer.model.atmosphere.CO2 += 2.0;
      this.renderer.model.surfaceTemperatureK += 50;
    });

    // リセットボタン
    document.getElementById('btn-reset-earth').addEventListener('click', () => {
      if (confirm('地球を46億年前の誕生直後(初期状態)へリセットしますか？')) {
        this.renderer.model = new EarthPhysicsModel();
        if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
      }
    });

    // 学術図鑑モーダル
    document.getElementById('btn-open-academic-modal').addEventListener('click', () => {
      if (window.cellAudioEngine) window.cellAudioEngine.playSE('click');
      document.getElementById('modal-academic').classList.add('active');
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const m = e.target.closest('.modal-overlay');
        if (m) m.classList.remove('active');
      });
    });
  }

  updateDashboardUI() {
    const m = this.renderer.model;
    const years = m.ageYears;
    const billionYears = (years / 1000000000).toFixed(2);
    const millionYears = Math.floor((years % 1000000000) / 1000000);

    // 時代・経過時間
    document.getElementById('display-earth-age').textContent = `地球齢: ${billionYears}億 ${millionYears}万年 前`;
    document.getElementById('display-temp-c').textContent = `${m.surfaceTemperatureC} ℃`;
    document.getElementById('display-ocean-cover').textContent = `${m.oceanCoverage.toFixed(1)} %`;
    document.getElementById('display-pressure').textContent = `${m.atmosphericPressureBar.toFixed(1)} bar`;
    document.getElementById('display-ph').textContent = `pH ${m.oceanPH.toFixed(1)}`;

    // 大気成分プロポーション
    document.getElementById('bar-co2').style.width = `${Math.min(100, m.atmosphere.CO2)}%`;
    document.getElementById('text-co2').textContent = `CO₂: ${m.atmosphere.CO2.toFixed(2)}%`;

    document.getElementById('bar-n2').style.width = `${Math.min(100, m.atmosphere.N2)}%`;
    document.getElementById('text-n2').textContent = `N₂: ${m.atmosphere.N2.toFixed(1)}%`;

    document.getElementById('bar-o2').style.width = `${Math.min(100, m.atmosphere.O2 * 4)}%`;
    document.getElementById('text-o2').textContent = `O₂: ${m.atmosphere.O2.toFixed(2)}%`;

    // 生態・文明指標
    const bioText = document.getElementById('display-bio-status');
    if (m.civilizationIndex > 1) {
      bioText.textContent = '🏛️ 知的生命 ＆ 現代都市文明 (City Lights)';
      bioText.style.color = '#ffb703';
    } else if (m.multiCellBiomass > 0) {
      bioText.textContent = '🐟 多細胞生物 ＆ 陸上植物';
      bioText.style.color = '#00ff87';
    } else if (m.singleCellBiomass > 0) {
      bioText.textContent = '🦠 光合成シアノバクテリア (大酸化イベント)';
      bioText.style.color = '#00f2fe';
    } else if (m.aminoAcidConcentration > 10) {
      bioText.textContent = '🧪 熱水噴出孔でのアミノ酸・有機物合成';
      bioText.style.color = '#7209b7';
    } else {
      bioText.textContent = '🌋 灼熱のマグマオーシャン (無生命)';
      bioText.style.color = '#d90429';
    }
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // 物理ステップ進行
      if (this.timeSpeedYearsPerSec > 0) {
        this.renderer.model.step(this.timeSpeedYearsPerSec * dt);
      }

      // 3Dレンダリング ＆ ダッシュボード更新
      this.renderer.updateEarthVisuals();
      this.updateDashboardUI();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.cellApp = new CellSimulationApp();
});
