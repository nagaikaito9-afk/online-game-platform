/**
 * audio.js - Web Audio API による自作BGM＆SE合成再生システム
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmVolume = 0.5;
    this.seVolume = 0.7;
    this.bgmTimer = null;
    this.isPlayingBGM = false;
    this.initOnInteraction = this.initOnInteraction.bind(this);

    // ユーザーインタラクション時にAudioContextを初期化
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

  setBgmVolume(val) {
    this.bgmVolume = parseFloat(val);
  }

  setSeVolume(val) {
    this.seVolume = parseFloat(val);
  }

  // 効果音 (SE) 再生
  playSE(type) {
    if (!this.ctx || this.seVolume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(this.seVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'place') {
        // 石/駒を打つ音
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(this.seVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'win') {
        // 勝利ファンファーレ
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + i * 0.12);
          g.gain.setValueAtTime(this.seVolume * 0.5, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + i * 0.12);
          o.stop(now + i * 0.12 + 0.3);
        });
      } else if (type === 'lose') {
        // 敗北音
        const notes = [400, 370, 340, 300];
        notes.forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(freq, now + i * 0.15);
          g.gain.setValueAtTime(this.seVolume * 0.3, now + i * 0.15);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.25);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + i * 0.15);
          o.stop(now + i * 0.15 + 0.25);
        });
      } else if (type === 'unlock') {
        // 称号獲得・ランクアップ音
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + i * 0.08);
          g.gain.setValueAtTime(this.seVolume * 0.6, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.4);
        });
      }
    } catch (e) {
      console.warn('Audio SE error:', e);
    }
  }

  // アンビエントBGMループ生成再生
  startBGM() {
    if (this.isPlayingBGM) return;
    this.isPlayingBGM = true;
    this.scheduleBGMChord();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  scheduleBGMChord() {
    if (!this.isPlayingBGM) return;
    if (this.ctx && this.bgmVolume > 0) {
      try {
        const chords = [
          [261.63, 329.63, 392.00], // C
          [220.00, 261.63, 329.63], // Am
          [174.61, 220.00, 261.63], // F
          [196.00, 246.94, 293.66]  // G
        ];
        const randomChord = chords[Math.floor(Math.random() * chords.length)];
        const now = this.ctx.currentTime;

        randomChord.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(this.bgmVolume * 0.08, now + 1.0);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 3.6);
        });
      } catch (e) {
        console.warn('BGM error:', e);
      }
    }
    this.bgmTimer = setTimeout(() => this.scheduleBGMChord(), 4000);
  }
}

const audioManager = new SoundEngine();
