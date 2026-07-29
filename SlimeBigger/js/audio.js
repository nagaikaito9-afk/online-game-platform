/**
 * Make the slime bigger - audio.js
 * ぷにぷにスライム音響 ＆ ガチャ ＆ バトル SE エンジン
 */

class SlimeAudioEngine {
  constructor() {
    this.ctx = null;
    this.initOnUserInteraction = this.initOnUserInteraction.bind(this);
    window.addEventListener('click', this.initOnUserInteraction, { once: true });
    window.addEventListener('keydown', this.initOnUserInteraction, { once: true });
  }

  initOnUserInteraction() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSE(type) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.connect(this.ctx.destination);

      if (type === 'squish') {
        // プニッ音
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'eat') {
        // もぐもぐ食餌音
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'split') {
        // 💥 分裂ぽん音
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'breed') {
        // 💕 繁殖ピロリン音
        const o1 = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        o1.type = 'sine'; o2.type = 'sine';
        o1.frequency.setValueAtTime(523.25, now); // C5
        o2.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        o1.connect(gain); o2.connect(gain);
        o1.start(now); o1.stop(now + 0.08);
        o2.start(now + 0.08); o2.stop(now + 0.25);
      } else if (type === 'gacha') {
        // ✨ ガチャ大当りファンファーレ
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'battle') {
        // ⚔️ バトルアタック音
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'click') {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {
      console.warn('Audio SE error:', e);
    }
  }
}

window.slimeAudioEngine = new SlimeAudioEngine();
