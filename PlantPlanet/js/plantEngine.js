/* PlantPlanet - plantEngine.js */

class PlantEngine {
  constructor() {
    this.plants = [];
    this.fallingDots = []; // 崩れ落ちたドット（酸性雨や溶岩で崩落するドット物理）
  }

  // 種を植える（ワールド座標）
  plantSeed(data, worldX, worldY) {
    const gene = {
      crookedness: (data.crookedness || 0.05) + (Math.random() - 0.5) * 0.08, // くせ（控えめで自然）
      speedMult: 0.85 + Math.random() * 0.3,
      maxHeightMult: 0.85 + Math.random() * 0.3,
      leafDensity: 0.8 + Math.random() * 0.4,
      hueShift: (Math.random() - 0.5) * 15,
      seedId: Math.random().toString(36).substring(2, 9)
    };

    const plant = {
      data: data,
      gene: gene,
      x: worldX,
      y: worldY,
      growth: 0.02, // 0.0 ~ 1.0
      targetHeight: (data.maxHeight || 150) * gene.maxHeightMult,
      dots: [], // 高精細ドット配列 [{x, y, relX, relY, type, color, originalColor, health, frozen, burnt, acid}]
      branchStructure: [], // スムース幹・枝の曲線制御点
      lastGeneratedGrowth: 0
    };

    // 初期制御点構造（滑らかなベジェ曲線）の生成
    this.generateBranchStructure(plant);
    this.rebuildDots(plant);

    this.plants.push(plant);
    return plant;
  }

  // 自然で滑らかな枝構造の決定（カクつかないベジェ制御点）
  generateBranchStructure(plant) {
    const d = plant.data;
    const maxH = plant.targetHeight;
    const maxDepth = d.maxBranchDepth || 4;

    const buildBranch = (startX, startY, length, angle, depth) => {
      if (depth > maxDepth || length < 4) return null;

      // 1つの枝を複数のベジェ制御点で滑らかに結ぶ
      const midX = startX + Math.cos(angle) * (length * 0.5) + (plant.gene.crookedness * 20 * (depth % 2 === 0 ? 1 : -1));
      const midY = startY + Math.sin(angle) * (length * 0.5);
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;

      const branch = {
        startX, startY,
        controlX: midX, controlY: midY,
        endX, endY,
        angle, length, depth,
        children: []
      };

      if (depth < maxDepth) {
        const splitAngle = (d.branchAngle || 0.65) + (Math.random() - 0.5) * 0.1;
        const nextLen = length * 0.68;

        const left = buildBranch(endX, endY, nextLen, angle - splitAngle, depth + 1);
        const right = buildBranch(endX, endY, nextLen, angle + splitAngle, depth + 1);

        if (left) branch.children.push(left);
        if (right) branch.children.push(right);
      }

      return branch;
    };

    // 主幹（真上 -Math.PI / 2）
    plant.branchStructure = buildBranch(0, 0, maxH * 0.45, -Math.PI / 2, 0);
  }

  // 植物の全ドット（ピクセル）の再構築・高密度生成
  rebuildDots(plant) {
    const dots = [];
    const currentH = plant.targetHeight * plant.growth;
    const d = plant.data;

    // 1. 根のドット（地中）
    const rootDepth = (d.rootDepth || 50) * Math.min(1.0, plant.growth * 1.5);
    for (let r = 0; r < rootDepth; r += 2) {
      dots.push({
        relX: (Math.random() - 0.5) * 3,
        relY: r,
        type: 'root',
        color: '#4e342e',
        originalColor: '#4e342e',
        health: 1.0
      });
    }

    // 2. 幹・枝のベジェ曲線上に高密度ドットを敷き詰める
    const traverse = (b, parentGrowthRatio) => {
      if (!b) return;

      const branchGrowthProgress = Math.max(0, Math.min(1.0, (plant.growth - b.depth * 0.15) * 3.5));
      if (branchGrowthProgress <= 0) return;

      const steps = Math.ceil((b.length * branchGrowthProgress) / 2.5); // 2.5px刻みでドット密生
      const baseWidth = Math.max(2, (currentH * 0.05) * Math.pow(0.65, b.depth));

      for (let i = 0; i <= steps; i++) {
        const t = i / Math.max(1, steps);
        // 2次ベジェ曲線補間 (カクツキゼロ)
        const bx = (1 - t) * (1 - t) * b.startX + 2 * (1 - t) * t * b.controlX + t * t * b.endX;
        const cy = (1 - t) * (1 - t) * b.startY + 2 * (1 - t) * t * b.controlY + t * t * b.endY;

        // 幹の太さ分の多重ドット配置
        const widthRadius = (baseWidth * (1 - t * 0.3)) / 2;
        for (let wx = -widthRadius; wx <= widthRadius; wx += 2) {
          for (let wy = -widthRadius; wy <= widthRadius; wy += 2) {
            if (wx * wx + wy * wy <= widthRadius * widthRadius + 1) {
              dots.push({
                relX: bx + wx,
                relY: cy + wy,
                type: 'trunk',
                color: d.trunkColor || '#5c3a21',
                originalColor: d.trunkColor || '#5c3a21',
                health: 1.0
              });
            }
          }
        }
      }

      // 枝先または成長部分に 葉・花・果実のドット群を生成
      if (b.children.length === 0 || b.depth >= (d.maxBranchDepth || 4) - 1) {
        if (branchGrowthProgress > 0.4) {
          const leafCount = Math.floor(12 * plant.gene.leafDensity);
          const endX = b.endX;
          const endY = b.endY;

          for (let l = 0; l < leafCount; l++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 14;
            const lx = endX + Math.cos(angle) * dist;
            const ly = endY + Math.sin(angle) * dist;

            dots.push({
              relX: lx,
              relY: ly,
              type: 'leaf',
              color: d.leafColor || '#2e7d32',
              originalColor: d.leafColor || '#2e7d32',
              health: 1.0
            });
          }

          // 花のドット群
          if (d.flowerColor && plant.growth >= (d.flowerStage || 0.45)) {
            for (let f = 0; f < 8; f++) {
              dots.push({
                relX: endX + (Math.random() - 0.5) * 12,
                relY: endY + (Math.random() - 0.5) * 12,
                type: 'flower',
                color: d.flowerColor,
                originalColor: d.flowerColor,
                health: 1.0
              });
            }
          }

          // 果実のドット群
          if (d.fruitType && plant.growth >= (d.fruitStage || 0.65)) {
            for (let fr = 0; fr < 10; fr++) {
              dots.push({
                relX: endX + (Math.random() - 0.5) * 14,
                relY: endY + (Math.random() - 0.5) * 14 + 6,
                type: 'fruit',
                color: d.fruitColor || '#e53935',
                originalColor: d.fruitColor || '#e53935',
                health: 1.0
              });
            }
          }
        }
      }

      // 子枝への再帰
      for (const child of b.children) {
        traverse(child, branchGrowthProgress);
      }
    };

    traverse(plant.branchStructure, 1.0);

    // 既存ドットの状態（焦げ、酸性、氷結等）を引継ぎ
    if (plant.dots.length > 0) {
      // 位置が近いドットにダメージ状態を引き継ぐ
    }

    plant.dots = dots;
    plant.lastGeneratedGrowth = plant.growth;
  }

  // 植物の更新
  update(speedMultiplier = 1.0) {
    // 成長スピードを 1x で従来比 1/100 に超スロー化
    const baseGrowthStep = 0.000008 * speedMultiplier;

    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];

      // 成長進行
      if (p.growth < 1.0) {
        p.growth = Math.min(1.0, p.growth + baseGrowthStep * p.gene.speedMult);
        // 成長が大きく進んだ場合のみドットを再構築
        if (p.growth - p.lastGeneratedGrowth > 0.01) {
          this.rebuildDots(p);
        }
      }

      // 植物全体の健全度チェック（残存ドット数）
      if (p.dots.length < 5) {
        this.plants.splice(i, 1);
      }
    }

    // 物理で崩落した落下ドットの更新
    for (let i = this.fallingDots.length - 1; i >= 0; i--) {
      const fd = this.fallingDots[i];
      fd.x += fd.vx;
      fd.y += fd.vy;
      fd.vy += 0.25; // 重力
      fd.life--;

      if (fd.life <= 0 || fd.y > 600) {
        this.fallingDots.splice(i, 1);
      }
    }
  }

  // --- ドットレベルでの精密な物理干渉 ---

  // 日光（光合成）: 接触したドット周辺の成長を促進し、新しい芽・葉ドットを直接スポーン！
  applySunlightBeam(wx, wy, radius) {
    for (const p of this.plants) {
      let hit = false;
      for (const dot of p.dots) {
        const dotWorldX = p.x + dot.relX;
        const dotWorldY = p.y + dot.relY;
        const dist = Math.hypot(dotWorldX - wx, dotWorldY - wy);
        if (dist <= radius) {
          hit = true;
          break;
        }
      }
      if (hit) {
        p.growth = Math.min(1.0, p.growth + 0.015);
        this.rebuildDots(p);
        // 新しい光合成キラキラ葉ドットを追加
        for (let k = 0; k < 3; k++) {
          p.dots.push({
            relX: (wx - p.x) + (Math.random() - 0.5) * 15,
            relY: (wy - p.y) + (Math.random() - 0.5) * 15,
            type: 'leaf',
            color: '#86efac',
            originalColor: '#86efac',
            health: 1.0
          });
        }
      }
    }
  }

  // 酸性雨: 接触したドットを紫色に変色・劣化させ、ポロポロ崩落させる！
  applyAcidRain(wx, wy, radius) {
    for (const p of this.plants) {
      for (let i = p.dots.length - 1; i >= 0; i--) {
        const dot = p.dots[i];
        const dotWorldX = p.x + dot.relX;
        const dotWorldY = p.y + dot.relY;
        const dist = Math.hypot(dotWorldX - wx, dotWorldY - wy);

        if (dist <= radius) {
          dot.color = '#c026d3'; // 酸性紫変
          dot.health -= 0.15;

          if (dot.health <= 0) {
            // ドットがポロポロ崩れ落ちる物理パーティクル化
            this.fallingDots.push({
              x: dotWorldX,
              y: dotWorldY,
              vx: (Math.random() - 0.5) * 1.5,
              vy: Math.random() * 1.5,
              color: '#c026d3',
              life: 40
            });
            p.dots.splice(i, 1);
          }
        }
      }
    }
  }

  // 溶岩: 接触したドットを黒焦げ炭化させ、火花とともに崩落！
  applyLavaBurn(wx, wy, radius) {
    for (const p of this.plants) {
      for (let i = p.dots.length - 1; i >= 0; i--) {
        const dot = p.dots[i];
        const dotWorldX = p.x + dot.relX;
        const dotWorldY = p.y + dot.relY;
        const dist = Math.hypot(dotWorldX - wx, dotWorldY - wy);

        if (dist <= radius) {
          dot.color = '#1c1917'; // 黒焦げ
          dot.health -= 0.35;

          if (dot.health <= 0) {
            this.fallingDots.push({
              x: dotWorldX,
              y: dotWorldY,
              vx: (Math.random() - 0.5) * 3,
              vy: -1 - Math.random() * 2,
              color: Math.random() > 0.5 ? '#ff4500' : '#292524',
              life: 45
            });
            p.dots.splice(i, 1);
          }
        }
      }
    }
  }

  // 剪定 / 消去: クリック・指定範囲のドットを正確に削り取る
  removeDotsInRadius(wx, wy, radius) {
    for (const p of this.plants) {
      for (let i = p.dots.length - 1; i >= 0; i--) {
        const dot = p.dots[i];
        const dotWorldX = p.x + dot.relX;
        const dotWorldY = p.y + dot.relY;
        if (Math.hypot(dotWorldX - wx, dotWorldY - wy) <= radius) {
          p.dots.splice(i, 1);
        }
      }
    }
  }

  // 全植物のドット群の描画
  draw(ctx, camera) {
    // 1. 植物のドット描画
    for (const p of this.plants) {
      for (const dot of p.dots) {
        const worldX = p.x + dot.relX;
        const worldY = p.y + dot.relY;
        const screenPos = camera.worldToScreen(worldX, worldY);

        ctx.fillStyle = dot.color;
        const size = (dot.type === 'trunk' ? 3.0 : 3.5) * camera.zoom;
        ctx.fillRect(screenPos.x - size / 2, screenPos.y - size / 2, size, size);
      }
    }

    // 2. 崩落ドットの描画
    for (const fd of this.fallingDots) {
      const screenPos = camera.worldToScreen(fd.x, fd.y);
      ctx.fillStyle = fd.color;
      const size = 3 * camera.zoom;
      ctx.fillRect(screenPos.x - size / 2, screenPos.y - size / 2, size, size);
    }
  }
}
