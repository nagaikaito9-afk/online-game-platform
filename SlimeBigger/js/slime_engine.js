/**
 * Make the slime bigger - slime_engine.js
 * 弾力スライム物理 ＆ 5段階巨大化 ＆ 分裂 ＆ 繁殖 ＆ バトル計算エンジン
 */

class SlimeEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // キャンバス上のスライム個体リスト
    this.activeSlimes = [];

    // 漂う餌（ゼリードロップ）リスト
    this.foods = [];

    // バトルステート
    this.isBattleActive = false;
    this.enemySlime = null;

    // フレームタイマー
    this.tick = 0;

    // 初期スライム生成
    this.spawnInitialSlime();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 135;
  }

  // 初期スライム (ぷにぷにグリーンスライム) の召喚
  spawnInitialSlime() {
    const baseSpec = window.ALL_SLIMES[0];
    this.activeSlimes = [{
      id: baseSpec.id,
      name: baseSpec.name,
      rarity: baseSpec.rarity,
      color: baseSpec.color,
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      vx: 0,
      vy: 0,
      radius: 45,
      targetRadius: 45,
      atk: baseSpec.atk,
      hp: baseSpec.hp,
      maxHp: baseSpec.hp,
      wobble: 0
    }];

    for (let i = 0; i < 8; i++) {
      this.spawnFood();
    }
  }

  spawnFood() {
    this.foods.push({
      x: Math.random() * (this.canvas.width - 100) + 50,
      y: Math.random() * (this.canvas.height - 100) + 50,
      radius: 8 + Math.random() * 6,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`
    });
  }

  addSlimeFromGacha(spec) {
    this.activeSlimes.push({
      id: spec.id,
      name: spec.name,
      rarity: spec.rarity,
      color: spec.color,
      x: Math.random() * (this.canvas.width - 200) + 100,
      y: Math.random() * (this.canvas.height - 200) + 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 40 + (spec.atk / 20),
      targetRadius: 40 + (spec.atk / 20),
      atk: spec.atk,
      hp: spec.hp,
      maxHp: spec.hp,
      wobble: 0
    });
  }

  // 🍏 5段階の餌による巨大化 (Tier 1〜5 Feed)
  feedTierSlimes(growthAmount) {
    if (this.activeSlimes.length === 0) return;
    if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('eat');

    this.activeSlimes.forEach(slime => {
      slime.targetRadius += growthAmount; // 巨大化！
      slime.atk = Math.floor(slime.atk + growthAmount * 1.5);
      slime.maxHp = Math.floor(slime.maxHp + growthAmount * 8);
      slime.hp = slime.maxHp;
      slime.wobble = 1.0;
    });

    for (let i = 0; i < 4; i++) {
      this.spawnFood();
    }
  }

  // 💥 分裂 (Split Slime)
  splitSlime() {
    if (this.activeSlimes.length === 0) return null;
    const largest = this.activeSlimes.reduce((max, s) => s.radius > max.radius ? s : max, this.activeSlimes[0]);

    if (largest.radius < 35) {
      return { success: false, msg: 'スライムが小さすぎてまだ分裂できません！SHOPの餌で巨大化させてね！' };
    }

    if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('split');

    largest.targetRadius = Math.max(25, largest.radius * 0.7);

    const newSlime = {
      ...largest,
      x: largest.x + 50,
      y: largest.y + 20,
      vx: 3, vy: -2,
      radius: largest.targetRadius,
      targetRadius: largest.targetRadius,
      wobble: 1.0
    };

    this.activeSlimes.push(newSlime);
    return { success: true, msg: '💥 スライムがプニッと2体に分裂しました！' };
  }

  // 💕 繁殖 (Breed Slimes via Breeding Elixir)
  breedSlimes() {
    if (this.activeSlimes.length === 0) {
      return { success: false, msg: 'スライムを所持していません！' };
    }

    if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('breed');

    const p1 = this.activeSlimes[0];
    const p2 = this.activeSlimes.length > 1 ? this.activeSlimes[1] : p1;

    const childId = Math.floor(Math.random() * 60) + 1;
    const spec = window.ALL_SLIMES[childId - 1];

    const child = {
      id: spec.id,
      name: `💕 ${spec.name} (二世)`,
      rarity: spec.rarity,
      color: spec.color,
      x: p1.x + (Math.random() - 0.5) * 60,
      y: p1.y + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: 35,
      targetRadius: 35,
      atk: Math.floor((p1.atk + p2.atk) * 0.65),
      hp: Math.floor((p1.hp + p2.hp) * 0.65),
      maxHp: Math.floor((p1.hp + p2.hp) * 0.65),
      wobble: 1.2
    };

    this.activeSlimes.push(child);
    return { success: true, msg: `💕 【${child.name}】が繁殖薬で誕生しました！` };
  }

  // ⚔️ バトル更新
  startBattle(enemyStage = 1) {
    this.isBattleActive = true;
    const enemyHp = 300 * enemyStage;
    const enemyAtk = 25 * enemyStage;

    this.enemySlime = {
      name: `😈 邪悪なデビルスライム Lv.${enemyStage}`,
      color: '#ef4444',
      x: this.canvas.width * 0.75,
      y: this.canvas.height / 2,
      radius: 60 + enemyStage * 5,
      hp: enemyHp,
      maxHp: enemyHp,
      atk: enemyAtk
    };
  }

  checkClick(mx, my) {
    let clicked = false;
    this.activeSlimes.forEach(s => {
      const dx = mx - s.x;
      const dy = my - s.y;
      if (dx * dx + dy * dy <= s.radius * s.radius) {
        s.targetRadius += 5;
        s.wobble = 1.0;
        s.vy = -5;
        clicked = true;
        if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('squish');
      }
    });
    return clicked;
  }

  update() {
    this.tick++;

    this.activeSlimes.forEach(slime => {
      slime.radius += (slime.targetRadius - slime.radius) * 0.1;
      slime.wobble *= 0.92;

      slime.x += slime.vx;
      slime.y += slime.vy;

      if (slime.x < slime.radius || slime.x > this.canvas.width - slime.radius) {
        slime.vx *= -1;
      }
      if (slime.y < slime.radius || slime.y > this.canvas.height - slime.radius) {
        slime.vy *= -1;
      }

      slime.vx *= 0.98;
      slime.vy *= 0.98;

      if (Math.random() < 0.03) {
        slime.vx += (Math.random() - 0.5) * 1.5;
        slime.vy += (Math.random() - 0.5) * 1.5;
      }

      // 捕食
      for (let i = this.foods.length - 1; i >= 0; i--) {
        const f = this.foods[i];
        const dx = f.x - slime.x;
        const dy = f.y - slime.y;
        if (dx * dx + dy * dy <= (slime.radius + f.radius) * (slime.radius + f.radius)) {
          slime.targetRadius += 3;
          slime.wobble = 0.6;
          this.foods.splice(i, 1);
          if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('eat');
          this.spawnFood();
        }
      }
    });

    if (this.isBattleActive && this.enemySlime && this.activeSlimes.length > 0) {
      if (this.tick % 45 === 0) {
        const totalAtk = this.activeSlimes.reduce((sum, s) => sum + s.atk, 0);
        this.enemySlime.hp -= totalAtk;
        if (window.slimeAudioEngine) window.slimeAudioEngine.playSE('battle');

        if (this.enemySlime.hp <= 0) {
          this.isBattleActive = false;
        } else {
          const mySlime = this.activeSlimes[0];
          mySlime.hp -= this.enemySlime.atk;
        }
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.foods.forEach(f => {
      this.ctx.fillStyle = f.color;
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.activeSlimes.forEach(s => {
      this.ctx.save();
      this.ctx.translate(s.x, s.y);

      const wobbleX = 1.0 + Math.sin(this.tick * 0.2) * s.wobble * 0.15;
      const wobbleY = 1.0 - Math.sin(this.tick * 0.2) * s.wobble * 0.15;
      this.ctx.scale(wobbleX, wobbleY);

      this.ctx.fillStyle = s.color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      this.ctx.stroke();

      const eyeOffset = s.radius * 0.3;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(-eyeOffset, -eyeOffset * 0.5, s.radius * 0.22, 0, Math.PI * 2);
      this.ctx.arc(eyeOffset, -eyeOffset * 0.5, s.radius * 0.22, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(-eyeOffset + 2, -eyeOffset * 0.5 + 2, s.radius * 0.1, 0, Math.PI * 2);
      this.ctx.arc(eyeOffset + 2, -eyeOffset * 0.5 + 2, s.radius * 0.1, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, s.radius * 0.3, 0.1, Math.PI - 0.1);
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px Outfit';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${s.name} (Size:${Math.floor(s.radius)})`, 0, s.radius + 18);

      this.ctx.restore();
    });

    if (this.isBattleActive && this.enemySlime) {
      const e = this.enemySlime;
      this.ctx.save();
      this.ctx.fillStyle = e.color;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ff0055';
      this.ctx.lineWidth = 5;
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 16px Outfit';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${e.name} HP:${e.hp}/${e.maxHp}`, e.x, e.y - e.radius - 10);
      this.ctx.restore();
    }
  }
}

window.SlimeEngine = SlimeEngine;
