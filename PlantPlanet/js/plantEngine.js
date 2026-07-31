/* PlantPlanet - plantEngine.js */

class PlantEngine {
  constructor() {
    this.plants = [];
    this.fallingDebris = [];
  }

  // 種を植える
  plantSeed(data, worldX, worldY) {
    const gene = {
      crookedness: (data.crookedness || 0.05) + (Math.random() - 0.5) * 0.06,
      speedMult: 0.85 + Math.random() * 0.3,
      maxHeightMult: 0.85 + Math.random() * 0.3,
      leafDensity: 0.85 + Math.random() * 0.3,
      seedId: Math.random().toString(36).substring(2, 9)
    };

    const plant = {
      data: data,
      gene: gene,
      x: worldX,
      y: worldY,
      growth: 0.08, // 初期成長率を少し上げて即芽生えが見えるように
      targetHeight: (data.maxHeight || 150) * gene.maxHeightMult,
      rootNode: null,
      health: 1.0,
      frozenTimer: 0, // 氷結タイマー
      swayOffset: Math.random() * 100, // 風による揺れの個体差
      swayForce: 0 // 竜巻などの風力
    };

    this.buildTreeNodes(plant);
    this.plants.push(plant);
    return plant;
  }

  // ツリー構造ノードの生成
  buildTreeNodes(plant) {
    const d = plant.data;
    const maxH = plant.targetHeight;
    const maxDepth = Math.min(5, d.maxBranchDepth || 4); // 安全に制限

    const createBranchNode = (startX, startY, length, angle, depth) => {
      if (depth > maxDepth || length < 3) return null;

      const crooked = plant.gene.crookedness * 16 * (depth % 2 === 0 ? 1 : -1);
      const midX = startX + Math.cos(angle) * (length * 0.5) + crooked;
      const midY = startY + Math.sin(angle) * (length * 0.5);
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;

      const node = {
        startX, startY,
        controlX: midX, controlY: midY,
        endX, endY,
        angle, length, depth,
        health: 1.0,
        burnt: 0.0,
        acidified: 0.0,
        frozen: 0.0,
        children: []
      };

      if (depth < maxDepth) {
        const splitAngle = (d.branchAngle || 0.65) + (Math.random() - 0.5) * 0.08;
        const nextLen = length * 0.68;

        const left = createBranchNode(endX, endY, nextLen, angle - splitAngle, depth + 1);
        const right = createBranchNode(endX, endY, nextLen, angle + splitAngle, depth + 1);

        if (left) node.children.push(left);
        if (right) node.children.push(right);
      }

      return node;
    };

    plant.rootNode = createBranchNode(0, 0, maxH * 0.45, -Math.PI / 2, 0);
  }

  // 植物の更新
  update(speedMultiplier = 1.0) {
    const safeSpeed = Math.max(0, Math.min(500, speedMultiplier || 1.0));
    // 大幅改善: スピードを従来比 150倍に高速化 (直感的なすくすく育つゲームプレイ体験)
    const baseGrowthStep = 0.0018 * safeSpeed;

    const now = Date.now();

    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];

      // 氷結カウントダウン
      if (p.frozenTimer > 0) {
        p.frozenTimer -= 1 * safeSpeed;
        if (p.frozenTimer < 0) p.frozenTimer = 0;
      }

      // 風力衰減
      if (p.swayForce > 0) {
        p.swayForce *= 0.95;
      }

      // 成長処理（氷結していない場合）
      if (p.frozenTimer <= 0 && p.growth < 1.0) {
        const speed = (p.data.growthSpeed || 1.0) * p.gene.speedMult;
        p.growth = Math.min(1.0, p.growth + baseGrowthStep * speed);
      }

      // 枯死判定
      if (p.health <= 0.05) {
        this.plants.splice(i, 1);
      }
    }

    // 溶け落ち・切断・爆発で散る破片の物理シミュレーション
    for (let i = this.fallingDebris.length - 1; i >= 0; i--) {
      const fd = this.fallingDebris[i];
      fd.x += fd.vx;
      fd.y += fd.vy;
      fd.vy += 0.25; // 重力
      fd.life--;

      if (fd.life <= 0 || fd.y > 600) {
        this.fallingDebris.splice(i, 1);
      }
    }
  }

  // ☀️ 太陽光 / 🌧️ 雨 / 💧 水 / 🧪 栄養剤: ダイナミック急成長エフェクト
  applySunlightBeam(wx, wy, radius) {
    let hitAny = false;
    for (const p of this.plants) {
      if (Math.abs(p.x - wx) < radius + 100) {
        // 大幅に成長率を加算 (一気に伸びる楽しさ)
        p.growth = Math.min(1.0, p.growth + 0.15);
        p.health = Math.min(1.0, p.health + 0.2);
        // 氷結解除
        p.frozenTimer = 0;
        hitAny = true;
      }
    }
    return hitAny;
  }

  // ☣️ 酸性雨: 紫の腐食 ＋ ドロドロ溶け落ち
  applyAcidRain(wx, wy, radius) {
    for (const p of this.plants) {
      const traverse = (node) => {
        if (!node) return;

        // ノードの現在成長後のワールド絶対座標を算出
        const progress = Math.max(0, Math.min(1.0, p.growth));
        const nodeWorldX = p.x + node.endX * progress;
        const nodeWorldY = p.y + node.endY * progress;
        const dist = Math.hypot(nodeWorldX - wx, nodeWorldY - wy);

        if (dist <= radius + 30) {
          node.acidified = Math.min(1.0, node.acidified + 0.35);
          node.health -= 0.25;

          for (let k = 0; k < 3; k++) {
            this.fallingDebris.push({
              x: nodeWorldX + (Math.random() - 0.5) * 10,
              y: nodeWorldY,
              vx: (Math.random() - 0.5) * 1.5,
              vy: Math.random() * 2.0,
              radius: 2 + Math.random() * 3,
              color: Math.random() > 0.5 ? '#c026d3' : '#701a75',
              life: 40
            });
          }

          if (node.health <= 0) {
            node.children = [];
          }
        }

        for (const child of node.children) {
          traverse(child);
        }
      };

      if (p.rootNode) traverse(p.rootNode);
    }
  }

  // 🌋 溶岩: 炎と炭化 ＋ 爆発破片
  applyLavaBurn(wx, wy, radius) {
    for (const p of this.plants) {
      const traverse = (node) => {
        if (!node) return;

        const progress = Math.max(0, Math.min(1.0, p.growth));
        const nodeWorldX = p.x + node.endX * progress;
        const nodeWorldY = p.y + node.endY * progress;
        const dist = Math.hypot(nodeWorldX - wx, nodeWorldY - wy);

        if (dist <= radius + 35) {
          node.burnt = Math.min(1.0, node.burnt + 0.5);
          node.health -= 0.35;

          for (let k = 0; k < 4; k++) {
            this.fallingDebris.push({
              x: nodeWorldX + (Math.random() - 0.5) * 12,
              y: nodeWorldY,
              vx: (Math.random() - 0.5) * 4.0,
              vy: -2 - Math.random() * 3.0,
              radius: 3 + Math.random() * 3,
              color: Math.random() > 0.4 ? '#ff4500' : '#1c1917',
              life: 45
            });
          }

          if (node.health <= 0) {
            node.children = [];
          }
        }

        for (const child of node.children) {
          traverse(child);
        }
      };

      if (p.rootNode) traverse(p.rootNode);
    }
  }

  // ✂️ 剪定 & 🧹 消去: ノード切断 & 破片飛び散り
  removeNodesInRadius(wx, wy, radius) {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];
      const rootDist = Math.hypot(p.x - wx, p.y - wy);

      // 地表根元が半径内なら植物ごと消去
      if (rootDist <= radius + 25) {
        // 切断エフェクトの破片
        for (let k = 0; k < 12; k++) {
          this.fallingDebris.push({
            x: p.x + (Math.random() - 0.5) * 30,
            y: p.y - Math.random() * 60,
            vx: (Math.random() - 0.5) * 5,
            vy: -2 - Math.random() * 4,
            radius: 3 + Math.random() * 4,
            color: p.data.leafColor || '#2e7d32',
            life: 50
          });
        }
        this.plants.splice(i, 1);
        continue;
      }

      const traverse = (node) => {
        if (!node) return;

        for (let c = node.children.length - 1; c >= 0; c--) {
          const child = node.children[c];
          const progress = Math.max(0, Math.min(1.0, p.growth));
          const childWorldX = p.x + child.endX * progress;
          const childWorldY = p.y + child.endY * progress;

          if (Math.hypot(childWorldX - wx, childWorldY - wy) <= radius + 30) {
            // 切断破片
            for (let k = 0; k < 5; k++) {
              this.fallingDebris.push({
                x: childWorldX,
                y: childWorldY,
                vx: (Math.random() - 0.5) * 4,
                vy: -1 - Math.random() * 3,
                radius: 3,
                color: p.data.leafColor || '#4ade80',
                life: 40
              });
            }
            node.children.splice(c, 1);
          } else {
            traverse(child);
          }
        }
      };

      if (p.rootNode) traverse(p.rootNode);
    }
  }

  // ❄️ 氷結: 植物をカチンコチンに固める
  applyFreeze(wx, wy, radius) {
    for (const p of this.plants) {
      if (Math.abs(p.x - wx) < radius + 100) {
        p.frozenTimer = 300; // 約5秒〜10秒間凍結
        const traverse = (node) => {
          if (!node) return;
          node.frozen = 1.0;
          for (const child of node.children) traverse(child);
        };
        if (p.rootNode) traverse(p.rootNode);
      }
    }
  }

  // 🌪️ 竜巻: 風で強烈にしならせる
  applyTornado(wx, wy, radius) {
    for (const p of this.plants) {
      if (Math.abs(p.x - wx) < radius + 150) {
        p.swayForce = 0.8;
      }
    }
  }

  // 描画メイン
  draw(ctx, camera) {
    // 根の描画
    for (const p of this.plants) {
      this.drawRoots(ctx, camera, p);
    }

    // 幹・枝・葉の描画
    for (const p of this.plants) {
      this.drawPlantBranches(ctx, camera, p);
    }

    // 落下破片
    for (const fd of this.fallingDebris) {
      const screenPos = camera.worldToScreen(fd.x, fd.y);
      ctx.fillStyle = fd.color;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, Math.max(1, fd.radius * camera.zoom), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 根の描画
  drawRoots(ctx, camera, p) {
    const rootDepth = (p.data.rootDepth || 50) * Math.min(1.0, p.growth * 1.5);
    if (rootDepth < 4) return;

    const basePos = camera.worldToScreen(p.x, p.y);
    ctx.save();
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = Math.max(1, 2.5 * camera.zoom);
    ctx.globalAlpha = 0.75;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(basePos.x, basePos.y);
    ctx.quadraticCurveTo(
      basePos.x - 8 * camera.zoom,
      basePos.y + rootDepth * 0.5 * camera.zoom,
      basePos.x + 5 * camera.zoom,
      basePos.y + rootDepth * camera.zoom
    );
    ctx.stroke();

    ctx.lineWidth = Math.max(1, 1.5 * camera.zoom);
    ctx.beginPath();
    ctx.moveTo(basePos.x, basePos.y + 8 * camera.zoom);
    ctx.lineTo(basePos.x - 18 * camera.zoom, basePos.y + rootDepth * 0.7 * camera.zoom);
    ctx.moveTo(basePos.x, basePos.y + 12 * camera.zoom);
    ctx.lineTo(basePos.x + 20 * camera.zoom, basePos.y + rootDepth * 0.8 * camera.zoom);
    ctx.stroke();

    ctx.restore();
  }

  // 幹・枝の描画 (風ゆらぎ & 凍結 & 炭化 & 酸性腐食対応)
  drawPlantBranches(ctx, camera, p) {
    if (!p.rootNode) return;

    const basePos = camera.worldToScreen(p.x, p.y);
    const d = p.data;
    const currentH = p.targetHeight;

    // 自然な風のそよぎ (時間経過 + 個体別オフセット + 竜巻風力)
    const time = Date.now() * 0.002;
    const windAngle = Math.sin(time + p.swayOffset) * 0.06 + (p.swayForce || 0) * Math.sin(time * 8);

    ctx.save();
    ctx.translate(basePos.x, basePos.y);
    ctx.rotate(windAngle);

    const drawNode = (node) => {
      if (!node) return;

      const startThreshold = node.depth * 0.12;
      const branchProgress = Math.max(0, Math.min(1.0, (p.growth - startThreshold) / 0.22));

      if (branchProgress <= 0) return;

      ctx.save();

      let strokeColor = d.trunkColor || '#5c3a21';
      if (node.burnt > 0) strokeColor = '#1c1917';
      else if (node.acidified > 0) strokeColor = '#701a75';
      else if (node.frozen > 0 && p.frozenTimer > 0) strokeColor = '#38bdf8';

      ctx.strokeStyle = strokeColor;
      const baseWidth = Math.max(1.5, (currentH * 0.055) * Math.pow(0.65, node.depth) * (0.4 + branchProgress * 0.6) * camera.zoom);
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const currEndX = (node.startX + (node.endX - node.startX) * branchProgress) * camera.zoom;
      const currEndY = (node.startY + (node.endY - node.startY) * branchProgress) * camera.zoom;
      const currCtrlX = (node.startX + (node.controlX - node.startX) * branchProgress) * camera.zoom;
      const currCtrlY = (node.startY + (node.controlY - node.startY) * branchProgress) * camera.zoom;

      ctx.beginPath();
      ctx.moveTo(node.startX * camera.zoom, node.startY * camera.zoom);
      ctx.quadraticCurveTo(currCtrlX, currCtrlY, currEndX, currEndY);
      ctx.stroke();

      // 葉・花・果実のクラスタ描画
      if (node.children.length === 0 || node.depth >= (d.maxBranchDepth || 4) - 1) {
        if (branchProgress > 0.4) {
          const leafScale = Math.max(0, Math.min(1.0, (branchProgress - 0.4) / 0.6));
          this.drawFoliageCluster(ctx, camera, p, currEndX, currEndY, node, leafScale);
        }
      }

      for (const child of node.children) {
        drawNode(child);
      }

      ctx.restore();
    };

    drawNode(p.rootNode);
    ctx.restore();
  }

  // 葉・花・果実の描画 (発光・氷結・グラデーション追加)
  drawFoliageCluster(ctx, camera, p, x, y, node, scale) {
    if (!scale || scale <= 0.05) return;
    const d = p.data;
    const leafSize = Math.max(2, 16 * scale * camera.zoom);

    ctx.save();
    ctx.translate(x, y);

    let leafColor = d.leafColor || '#2e7d32';
    if (node.burnt > 0) leafColor = '#292524';
    else if (node.acidified > 0) leafColor = '#a855f7';
    else if (node.frozen > 0 && p.frozenTimer > 0) leafColor = '#bae6fd';

    // 発光植物（月夜茸、水晶草、黄金の薔薇）のグローエフェクト
    if (d.glowing) {
      ctx.shadowBlur = 15 * camera.zoom;
      ctx.shadowColor = d.glowColor || '#4ade80';
    }

    ctx.fillStyle = leafColor;
    const leafType = d.leafType || 'oval';

    if (leafType === 'needle') {
      ctx.strokeStyle = leafColor;
      ctx.lineWidth = Math.max(1, 2.5 * camera.zoom);
      for (let a = -0.8; a <= 0.8; a += 0.4) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(a * leafSize, -leafSize * 1.2);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const lx = Math.cos(angle) * leafSize * 0.4;
        const ly = Math.sin(angle) * leafSize * 0.4;
        const rx = Math.max(1, leafSize * 0.55);
        const ry = Math.max(1, leafSize * 0.85);
        ctx.beginPath();
        ctx.ellipse(lx, ly - leafSize * 0.5, rx, ry, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 花の開花
    if (d.flowerColor && scale > 0.4 && p.growth >= (d.flowerStage || 0.4)) {
      const flowerRadius = Math.max(1.5, leafSize * 0.85 * scale);
      ctx.fillStyle = d.flowerColor;

      for (let f = 0; f < 5; f++) {
        const fa = (f / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(fa) * flowerRadius * 0.5, Math.sin(fa) * flowerRadius * 0.5 - leafSize * 0.5, Math.max(0.8, flowerRadius * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -leafSize * 0.5, Math.max(0.8, flowerRadius * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // 果実の結実
    if (d.fruitType && scale > 0.6 && p.growth >= (d.fruitStage || 0.6)) {
      const fruitRadius = Math.max(2, leafSize * 0.9 * scale);
      ctx.fillStyle = d.fruitColor || '#e53935';
      ctx.beginPath();
      ctx.arc(0, fruitRadius * 0.4, fruitRadius, 0, Math.PI * 2);
      ctx.fill();

      // ハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(-fruitRadius * 0.3, fruitRadius * 0.1, Math.max(0.5, fruitRadius * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

