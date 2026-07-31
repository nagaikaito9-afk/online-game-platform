/* PlantPlanet - experimentEngine.js */
class ExperimentEngine {
  constructor() {
    this.particles = [];
    this.activeEffects = []; // 雨雲などの永続/継続エフェクト
  }

  // エフェクト発動（クリックまたは長押しドラッグ）
  triggerTool(toolId, worldX, worldY, plantEngine, isMouseDown) {
    switch (toolId) {
      case 'rain':
        // 雨雲を出現 / 雨粒パーティクル生成
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            type: 'rain',
            x: worldX + (Math.random() - 0.5) * 80,
            y: worldY - 120 + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1,
            vy: 8 + Math.random() * 5,
            life: 60,
            maxLife: 60,
            color: 'rgba(56, 189, 248, 0.8)'
          });
        }
        // 周囲の植物の成長加速 & 水分補給
        plantEngine.applyEffectRadius(worldX, worldY, 100, 'water', 0.05);
        break;

      case 'water_drop':
        // 直接の水滴
        for (let i = 0; i < 4; i++) {
          this.particles.push({
            type: 'water',
            x: worldX + (Math.random() - 0.5) * 20,
            y: worldY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: 3 + Math.random() * 3,
            radius: 3 + Math.random() * 3,
            life: 40,
            maxLife: 40,
            color: 'rgba(6, 182, 212, 0.9)'
          });
        }
        plantEngine.applyEffectRadius(worldX, worldY, 40, 'water', 0.1);
        break;

      case 'lava':
        // 溶岩ドロップ ＆ 炎・煙
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            type: 'lava',
            x: worldX + (Math.random() - 0.5) * 30,
            y: worldY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 3,
            vy: 4 + Math.random() * 4,
            radius: 4 + Math.random() * 4,
            life: 50,
            maxLife: 50,
            color: '#ff4500'
          });
          // 煙
          this.particles.push({
            type: 'smoke',
            x: worldX + (Math.random() - 0.5) * 40,
            y: worldY - 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -2 - Math.random() * 2,
            radius: 5 + Math.random() * 8,
            life: 40,
            maxLife: 40,
            color: 'rgba(100, 100, 100, 0.5)'
          });
        }
        plantEngine.applyEffectRadius(worldX, worldY, 60, 'burn', 0.08);
        break;

      case 'sunbeam':
        // 太陽光ビームパーティクル
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            type: 'sun',
            x: worldX + (Math.random() - 0.5) * 50,
            y: worldY - 150 + Math.random() * 150,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 2 + Math.random() * 4,
            radius: 2 + Math.random() * 5,
            life: 30,
            maxLife: 30,
            color: 'rgba(255, 235, 59, 0.85)'
          });
        }
        plantEngine.applyEffectRadius(worldX, worldY, 70, 'sunlight', 0.08);
        break;

      case 'fertilizer':
        // 栄養キラキラ粉末
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            type: 'fertilizer',
            x: worldX + (Math.random() - 0.5) * 40,
            y: worldY + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 2,
            vy: -1 - Math.random() * 3,
            radius: 3 + Math.random() * 3,
            life: 45,
            maxLife: 45,
            color: 'rgba(163, 230, 53, 0.9)'
          });
        }
        plantEngine.applyEffectRadius(worldX, worldY, 60, 'fertilize', 0.12);
        break;

      case 'prune':
        // 剪定エフェクト（パチンと葉っぱのカット）
        if (isMouseDown) {
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
              type: 'leaf_cut',
              x: worldX,
              y: worldY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: 3 + Math.random() * 3,
              life: 25,
              maxLife: 25,
              color: '#4ade80'
            });
          }
          plantEngine.pruneAt(worldX, worldY, 35);
        }
        break;

      case 'freeze':
        // 氷結・フロスト
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            type: 'ice',
            x: worldX + (Math.random() - 0.5) * 50,
            y: worldY + (Math.random() - 0.5) * 50,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            radius: 3 + Math.random() * 4,
            life: 50,
            maxLife: 50,
            color: 'rgba(224, 242, 254, 0.9)'
          });
        }
        plantEngine.applyEffectRadius(worldX, worldY, 70, 'freeze', 0.1);
        break;

      case 'tornado':
        // 竜巻風ラインパーティクル
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            type: 'wind',
            x: worldX + (Math.random() - 0.5) * 100,
            y: worldY + (Math.random() - 0.5) * 120,
            vx: 8 + Math.random() * 10,
            vy: (Math.random() - 0.5) * 4,
            length: 20 + Math.random() * 30,
            life: 20,
            maxLife: 20,
            color: 'rgba(255, 255, 255, 0.6)'
          });
        }
        plantEngine.applyWindForce(worldX, worldY, 120, 1.5);
        break;

      case 'acid':
        // 酸性毒液
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            type: 'acid',
            x: worldX + (Math.random() - 0.5) * 35,
            y: worldY - 50 + Math.random() * 20,
            vx: (Math.random() - 0.5) * 1,
            vy: 5 + Math.random() * 4,
            radius: 3 + Math.random() * 3,
            life: 45,
            maxLife: 45,
            color: 'rgba(192, 38, 211, 0.85)'
          });
        }
        plantEngine.applyEffectRadius(worldX, worldY, 60, 'acid', 0.08);
        break;

      case 'eraser':
        // 消去ツール（左クリックで一発削除）
        if (isMouseDown) {
          plantEngine.removePlantAt(worldX, worldY, 40);
          for (let i = 0; i < 10; i++) {
            this.particles.push({
              type: 'erase',
              x: worldX + (Math.random() - 0.5) * 30,
              y: worldY + (Math.random() - 0.5) * 30,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              radius: 4 + Math.random() * 4,
              life: 20,
              maxLife: 20,
              color: 'rgba(239, 68, 68, 0.8)'
            });
          }
        }
        break;
    }
  }

  // フレームごとの更新
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

  // ワールド描画
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
