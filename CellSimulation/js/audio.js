/**
 * Cell Simulation - audio.js
 * アンビエント宇宙BGM ＆ 分子結合/細胞分裂エフェクト音響
 */

class CellAudioEngine {
  constructor() {
    this.ctx = null;
    this.seVolume = 0.6;
    this.initOnInteraction = this.initOnInteraction.bind(this);

    window.addEventListener('click', this.initOnInteraction, { once: true });
    window.addEventListener('keydown', this.initOnInteraction, { once: true });
  }

  initOnInteraction() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSE(type) {
    if (!this.ctx || this.seVolume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'combine') {
        // 分子・化学結合音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(this.seVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'cell_split') {
        // 細胞分裂ぷしゅ音
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(this.seVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'discovery') {
        // 新発見チャイム
        const o1 = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o1.type = 'sine'; o2.type = 'sine';
        o1.frequency.setValueAtTime(523.25, now); // C5
        o2.frequency.setValueAtTime(659.25, now + 0.1); // E5
        g.gain.setValueAtTime(this.seVolume * 0.5, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        o1.connect(g); o2.connect(g);
        g.connect(this.ctx.destination);
        o1.start(now); o1.stop(now + 0.1);
        o2.start(now + 0.1); o2.stop(now + 0.35);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(this.seVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

const cellAudioEngine = new CellAudioEngine();
