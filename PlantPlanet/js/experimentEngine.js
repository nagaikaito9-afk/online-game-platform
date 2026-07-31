/* PlantPlanet - experimentEngine.js */
class ExperimentEngine {
  constructor() {
    this.particles = [];
  }

  // エフェクト発動（クリックまたは長押しドラッグ）
  triggerTool(toolId, worldX, worldY, plantEngine, isMouseDown) {
    switch (toolId) {
      case 'sunbeam':
        // ☀️ 太陽光ビーム: 眩しい光線 ＋ 植物の急速芽吹き
        for (let i = 0; i < 12; i++) {
          this.particles.push({
            type: 'sun',
            x: worldX + (Math.random() - 0.5) * 50,
            y: worldY - 200 + Math.random() * 200,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 6 + Math.random() * 6,
            radius: 3 + Math.random() * 5,
            life: 30,
            maxLife: 30,
            color: '#fef08a'
          });
        }
        plantEngine.applySunlightBeam(worldX, worldY, 80);
        break;

      case 'acid':
        // ☣️ 酸性雨: 紫の液滴 ＋ 溶け落ちバブル
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            type: 'acid',
            x: worldX + (Math.random() - 0.5) * 60,
            y: worldY - 80 + Math.random() * 40,
            vx: (Math.random() - 0.5) * 1.2,
            vy: 7 + Math.random() * 6,
            radius: 3 + Math.random() * 4,
            life: 35,
            maxLife: 35,
            color: '#c026d3'
          });
        }
        plantEngine.applyAcidRain(worldX, worldY, 60);
        break;

      case 'lava':
        // 🌋 溶岩: 赤熱溶岩ドロップ ＋ 火花と炭化
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            type: 'lava',
            x: worldX + (Math.random() - 0.5) * 50,
            y: worldY - 50 + Math.random() * 40,
            vx: (Math.random() - 0.5) * 4,
            vy: 6 + Math.random() * 6,
            radius: 4 + Math.random() * 5,
            life: 40,
            maxLife: 40,
            color: Math.random() > 0.3 ? '#ff4500' : '#ffcc00'
          });
        }
        plantEngine.applyLavaBurn(worldX, worldY, 60);
        break;

      case 'rain':
        // 🌧️ 雨雲: 恵みの雨 ＋ 水分成長
        for (let i = 0; i < 14; i++) {
          this.particles.push({
            type: 'rain',
            x: worldX + (Math.random() - 0.5) * 100,
            y: worldY - 140 + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 10 + Math.random() * 5,
            radius: 2 + Math.random() * 2,
            life: 45,
            maxLife: 45,
            color: '#38bdf8'
          });
        }
        plantEngine.applySunlightBeam(worldX, worldY, 70);
        break;

      case 'water_drop':
        // 💧 水: 水滴散水 ＋ 成長促進
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            type: 'water',
            x: worldX + (Math.random() - 0.5) * 35,
            y: worldY + (Math.random() - 0.5) * 35,
            vx: (Math.random() - 0.5) * 2,
            vy: 5 + Math.random() * 4,
            radius: 3 + Math.random() * 4,
            life: 35,
            maxLife: 35,
            color: '#06b6d4'
          });
        }
        plantEngine.applySunlightBeam(worldX, worldY, 60);
        break;

      case 'fertilizer':
        // 🧪 栄養剤: 眩しい緑の光粉 ＋ 爆発的成長
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            type: 'fertilizer',
            x: worldX + (Math.random() - 0.5) * 50,
            y: worldY + (Math.random() - 0.5) * 50,
            vx: (Math.random() - 0.5) * 3,
            vy: -2 - Math.random() * 4,
            radius: 3 + Math.random() * 4,
            life: 45,
            maxLife: 45,
            color: '#84cc16'
          });
        }
        plantEngine.applySunlightBeam(worldX, worldY, 90);
        break;

      case 'prune':
        // ✂️ 剪定ハサミ: 切断の火花
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            type: 'cut',
            x: worldX + (Math.random() - 0.5) * 20,
            y: worldY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: 2 + Math.random() * 2,
            life: 20,
            maxLife: 20,
            color: '#e2e8f0'
          });
        }
        plantEngine.removeNodesInRadius(worldX, worldY, 40);
        break;

      case 'eraser':
        // 🧹 消去ツール
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            type: 'erase',
            x: worldX + (Math.random() - 0.5) * 40,
            y: worldY + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: 3 + Math.random() * 3,
            life: 25,
            maxLife: 25,
            color: '#94a3b8'
          });
        }
        plantEngine.removeNodesInRadius(worldX, worldY, 55);
        break;

      case 'freeze':
        // ❄️ 氷結: 凍結結晶 ＋ 植物タイマー停止
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            type: 'ice',
            x: worldX + (Math.random() - 0.5) * 60,
            y: worldY + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 2.5,
            radius: 3 + Math.random() * 5,
            life: 45,
            maxLife: 45,
            color: '#bae6fd'
          });
        }
        plantEngine.applyFreeze(worldX, worldY, 70);
        break;

      case 'tornado':
        // 🌪️ 竜巻強風: 暴風気流 ＋ 強烈なしなり
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            type: 'wind',
            x: worldX + (Math.random() - 0.5) * 120,
            y: worldY + (Math.random() - 0.5) * 140,
            vx: 12 + Math.random() * 12,
            vy: (Math.random() - 0.5) * 4,
            length: 30 + Math.random() * 40,
            life: 22,
            maxLife: 22,
            color: 'rgba(255, 255, 255, 0.85)'
          });
        }
        plantEngine.applyTornado(worldX, worldY, 100);
        break;
    }
  }

  // フレーム更新
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // 描画
  draw(ctx, camera) {
    for (const p of this.particles) {
      const screenPos = camera.worldToScreen(p.x, p.y);
      const alpha = p.life / p.maxLife;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'rain' || p.type === 'wind') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5 * camera.zoom;
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y);
        ctx.lineTo(screenPos.x - (p.vx || 0) * 2.5 * camera.zoom, screenPos.y + (p.vy || 8) * 2.5 * camera.zoom);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, (p.radius || 3) * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

