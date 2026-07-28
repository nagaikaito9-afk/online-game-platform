/**
 * Cell Simulation - simulation_engine.js
 * 分子・アミノ酸・細胞物理パーティクル ＆ 自律分裂代謝シミュレータ
 */

class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.energy = 0;
    this.timeScale = 1; // 0 (Pause), 1, 5, 50, 1000

    this.currentEraId = 'cosmic';
    this.cellCount = 0;
    this.aminoCount = 0;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.initParticles();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    // 初期素粒子 40個
    for (let i = 0; i < 40; i++) {
      this.particles.push(this.createParticle('quantum'));
    }
  }

  createParticle(type, x = null, y = null) {
    const px = x !== null ? x : Math.random() * this.canvas.width;
    const py = y !== null ? y : Math.random() * this.canvas.height;
    const vx = (Math.random() - 0.5) * 1.5;
    const vy = (Math.random() - 0.5) * 1.5;

    let radius = 3;
    let color = '#7209b7';

    if (type === 'quantum') {
      radius = Math.random() * 3 + 2;
      color = '#7209b7';
    } else if (type === 'atom') {
      radius = 4;
      color = '#00f2fe';
    } else if (type === 'amino') {
      radius = 6;
      color = '#ffb703';
    } else if (type === 'cell') {
      radius = 14;
      color = '#00ff87';
    } else if (type === 'multicell') {
      radius = 22;
      color = '#d90429';
    }

    return {
      x: px, y: py,
      vx: vx, vy: vy,
      type: type,
      radius: radius,
      color: color,
      age: 0,
      life: 300 + Math.random() * 200,
      pulse: Math.random() * Math.PI * 2
    };
  }

  injectEnergyTap(x, y) {
    this.energy += 15;
    for (let i = 0; i < 5; i++) {
      const p = this.createParticle('quantum', x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20);
      p.vx = (Math.random() - 0.5) * 4;
      p.vy = (Math.random() - 0.5) * 4;
      this.particles.push(p);
    }
    cellAudioEngine.playSE('combine');
  }

  update() {
    if (this.timeScale === 0) return;

    // 倍速処理ループ
    const steps = Math.min(50, this.timeScale);
    const energyGain = (0.05 * this.timeScale);
    this.energy += energyGain;

    for (let s = 0; s < steps; s++) {
      this.stepSimulation();
    }

    this.render();
  }

  stepSimulation() {
    this.cellCount = 0;
    this.aminoCount = 0;

    // 時代フェーズ進化判定
    if (this.energy > 50000 && this.currentEraId !== 'civilization') {
      this.currentEraId = 'civilization';
    } else if (this.energy > 10000 && this.currentEraId !== 'cellular') {
      this.currentEraId = 'cellular';
    } else if (this.energy > 2500 && this.currentEraId !== 'chemical') {
      this.currentEraId = 'chemical';
    } else if (this.energy > 500 && this.currentEraId !== 'earth') {
      this.currentEraId = 'earth';
    }

    // パーティクル移動 ＆ 画面端バウンス
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.05;
      p.age++;

      if (p.type === 'cell') this.cellCount++;
      if (p.type === 'amino') this.aminoCount++;

      if (p.x < 10 || p.x > this.canvas.width - 10) p.vx *= -1;
      if (p.y < 10 || p.y > this.canvas.height - 10) p.vy *= -1;

      // 衝突 ＆ 反応
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p2.x - p.x;
        const dy = p2.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < p.radius + p2.radius) {
          // 量子 + 量子 ➔ 原子 (地球・化学時代)
          if (p.type === 'quantum' && p2.type === 'quantum' && this.energy > 200 && Math.random() < 0.05) {
            p.type = 'atom';
            p.color = '#00f2fe';
            p.radius = 5;
            p2.age = 9999;
            cellAudioEngine.playSE('combine');
          }
          // 原子 + 原子 ➔ アミノ酸
          else if (p.type === 'atom' && p2.type === 'atom' && this.energy > 1000 && Math.random() < 0.04) {
            p.type = 'amino';
            p.color = '#ffb703';
            p.radius = 8;
            p2.age = 9999;
            cellAudioEngine.playSE('combine');
          }
          // アミノ酸 + アミノ酸 ➔ 奇跡の単細胞生物(細胞)！！
          else if (p.type === 'amino' && p2.type === 'amino' && this.energy > 5000 && Math.random() < 0.03) {
            p.type = 'cell';
            p.color = '#00ff87';
            p.radius = 16;
            p2.age = 9999;
            cellAudioEngine.playSE('discovery');
          }
          // 細胞の分裂 (Mitosis)
          else if (p.type === 'cell' && p.age > 150 && this.particles.length < 80 && Math.random() < 0.02) {
            p.age = 0;
            const newCell = this.createParticle('cell', p.x + 10, p.y + 10);
            this.particles.push(newCell);
            cellAudioEngine.playSE('cell_split');
          }
        }
      }
    }

    // 寿命尽きたパーティクル消去 ＆ 最小数保持
    this.particles = this.particles.filter(p => p.age < p.life);
    if (this.particles.length < 35) {
      this.particles.push(this.createParticle('quantum'));
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 背景宇宙の輝き
    this.particles.forEach(p => {
      this.ctx.beginPath();
      const currentR = p.radius + Math.sin(p.pulse) * 1.5;

      // 発光グラデーション
      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentR * 2);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.arc(p.x, p.y, currentR * 2, 0, Math.PI * 2);
      this.ctx.fill();

      // 実体円
      this.ctx.beginPath();
      this.ctx.fillStyle = p.color;
      this.ctx.arc(p.x, p.y, currentR, 0, Math.PI * 2);
      this.ctx.fill();

      // 細胞(cell)の場合は核と二重膜を描画
      if (p.type === 'cell') {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.arc(p.x, p.y, currentR, 0, Math.PI * 2);
        this.ctx.stroke();

        // 細胞核
        this.ctx.beginPath();
        this.ctx.fillStyle = '#00f2fe';
        this.ctx.arc(p.x, p.y, currentR * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
}

window.ParticleEngine = ParticleEngine;
