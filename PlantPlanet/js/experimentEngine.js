/* PlantPlanet - experimentEngine.js */
class ExperimentEngine {
  constructor() {
    this.particles = [];
  }

  // エフェクト発動（クリックまたは長押しドラッグ）
  triggerTool(toolId, worldX, worldY, plantEngine, isMouseDown) {
    switch (toolId) {
      case 'sunbeam':
        // ☀️ 太陽光ビーム: 光線 ＋ 新緑成長
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            type: 'sun',
            x: worldX + (Math.random() - 0.5) * 40,
            y: worldY - 180 + Math.random() * 180,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 5 + Math.random() * 4,
            radius: 2 + Math.random() * 4,
            life: 25,
            maxLife: 25,
            color: 'rgba(255, 235, 59, 0.9)'
          });
        }
        plantEngine.applySunlightBeam(worldX, worldY, 50);
        break;

      case 'acid':
        // ☣️ 酸性雨: 紫の液滴 ＋ ノードの酸性溶け変色・ポタポタ崩れ落ち
        for (let i = 0; i < 7; i++) {
          this.particles.push({
            type: 'acid',
            x: worldX + (Math.random() - 0.5) * 50,
            y: worldY - 80 + Math.random() * 30,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 6 + Math.random() * 5,
            radius: 3 + Math.random() * 3,
            life: 35,
            maxLife: 35,
            color: 'rgba(192, 38, 211, 0.9)'
          });
        }
        plantEngine.applyAcidRain(worldX, worldY, 45);
        break;

      case 'lava':
        // 🌋 溶岩: 溶岩ドロップ ＋ ノードの黒焦げ炭化＆焼き切り崩落
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            type: 'lava',
            x: worldX + (Math.random() - 0.5) * 40,
            y: worldY - 50 + Math.random() * 30,
            vx: (Math.random() - 0.5) * 3,
            vy: 5 + Math.random() * 5,
            radius: 4 + Math.random() * 4,
            life: 40,
            maxLife: 40,
            color: '#ff4500'
          });
        }
        plantEngine.applyLavaBurn(worldX, worldY, 45);
        break;

      case 'rain':
        // 🌧️ 雨雲
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            type: 'rain',
            x: worldX + (Math.random() - 0.5) * 80,
            y: worldY - 120 + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 9 + Math.random() * 4,
            life: 50,
            maxLife: 50,
            color: 'rgba(56, 189, 248, 0.85)'
          });
        }
        plantEngine.applySunlightBeam(worldX, worldY, 40);
        break;

      case 'water_drop':
        // 💧 水
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            type: 'water',
            x: worldX + (Math.random() - 0.5) * 25,
            y: worldY + (Math.random() - 0.5) * 25,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 4 + Math.random() * 3,
            radius: 3 + Math.random() * 3,
            life: 35,
            maxLife: 35,
            color: 'rgba(6, 182, 212, 0.95)'
          });
        }
        plantEngine.applySunlightBeam(worldX, worldY, 30);
        break;

      case 'fertilizer':
        // 🧪 栄養剤
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            type: 'fertilizer',
            x: worldX + (Math.random() - 0.5) * 45,
            y: worldY + (Math.random() - 0.5) * 45,
            vx: (Math.random() - 0.5) * 2,
            vy: -1 - Math.random() * 3,
            radius: 3 + Math.random() * 3,
            life: 40,
            maxLife: 40,
            color: 'rgba(163, 230, 53, 0.95)'
          });
        }
        plantEngine.applySunlightBeam(worldX, worldY, 45);
        break;

      case 'prune':
        // ✂️ 剪定ハサミ: 滑らかな枝切断
        plantEngine.removeNodesInRadius(worldX, worldY, 30);
        break;

      case 'eraser':
        // 🧹 消去ツール
        plantEngine.removeNodesInRadius(worldX, worldY, 40);
        break;

      case 'freeze':
        // ❄️ 氷結
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            type: 'ice',
            x: worldX + (Math.random() - 0.5) * 50,
            y: worldY + (Math.random() - 0.5) * 50,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            radius: 3 + Math.random() * 4,
            life: 45,
            maxLife: 45,
            color: 'rgba(224, 242, 254, 0.95)'
          });
        }
        break;

      case 'tornado':
        // 🌪️ 竜巻強風
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            type: 'wind',
            x: worldX + (Math.random() - 0.5) * 100,
            y: worldY + (Math.random() - 0.5) * 120,
            vx: 10 + Math.random() * 10,
            vy: (Math.random() - 0.5) * 3,
            length: 25 + Math.random() * 35,
            life: 18,
            maxLife: 18,
            color: 'rgba(255, 255, 255, 0.7)'
          });
        }
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
        ctx.lineWidth = 2 * camera.zoom;
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y);
        ctx.lineTo(screenPos.x - (p.vx || 0) * 2 * camera.zoom, screenPos.y + (p.vy || 8) * 2 * camera.zoom);
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
