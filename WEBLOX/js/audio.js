/**
 * WEBLOX - audio.js
 * Web Audio API によるポップ＆アクション音響エンジン
 */

class WebloxAudioEngine {
  constructor() {
    this.ctx = null;
    this.seVolume = 0.7;
    this.bgmVolume = 0.4;
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

      if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(this.seVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'coin') {
        // コインチャリーン音
        const o1 = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o1.type = 'sine'; o2.type = 'sine';
        o1.frequency.setValueAtTime(987.77, now); // B5
        o2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        g.gain.setValueAtTime(this.seVolume * 0.6, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        o1.connect(g); o2.connect(g);
        g.connect(this.ctx.destination);
        o1.start(now); o1.stop(now + 0.08);
        o2.start(now + 0.08); o2.stop(now + 0.25);
      } else if (type === 'hit' || type === 'attack') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(this.seVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'respawn') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        gain.gain.setValueAtTime(this.seVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.05);
        gain.gain.setValueAtTime(this.seVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

const audioEngine = new WebloxAudioEngine();
