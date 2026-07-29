/**
 * Cell Simulation - audio.js
 * アンビエント宇宙BGM ＆ リアル爆発・沸騰・酸侵食・細胞結合エフェクト音響
 */

class CellAudioEngine {
  constructor() {
    this.ctx = null;
    this.seVolume = 0.6;
    this.lastPlayTime = {};
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

    // 同一SEの過剰な同時連射スパムを防ぐクールダウン判定 (ms)
    const nowMs = Date.now();
    const cooldown = type === 'explode' ? 120 : (type === 'boil' || type === 'acid' ? 80 : 40);
    if (this.lastPlayTime[type] && nowMs - this.lastPlayTime[type] < cooldown) {
      return;
    }
    this.lastPlayTime[type] = nowMs;

    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.connect(this.ctx.destination);

      if (type === 'explode') {
        // 重厚な大爆発音 (ノイズ + 低音ランプ)
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.35);

        gain.gain.setValueAtTime(this.seVolume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

        noise.connect(filter);
        filter.connect(gain);
        noise.start(now);
      } else if (type === 'boil') {
        // 水蒸気・マグマ沸騰ジュージュー音
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(this.seVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'acid') {
        // 酸のジュージュー溶融音
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.06);
        gain.gain.setValueAtTime(this.seVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'combine') {
        // 分子・化学結合音
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(this.seVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'click') {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(this.seVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

window.cellAudioEngine = new CellAudioEngine();
