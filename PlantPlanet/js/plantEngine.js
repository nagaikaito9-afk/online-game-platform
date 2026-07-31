/* PlantPlanet - plantEngine.js */

class PlantEngine {
  constructor() {
    this.plants = [];
    this.fallingDebris = []; // 酸性雨で溶け落ちたり、溶岩で焼き切れて落ちるパーツ（破片・滴）
  }

  // 種を植える（ワールド座標）
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
      growth: 0.03, // 0.0 ~ 1.0
      targetHeight: (data.maxHeight || 150) * gene.maxHeightMult,
      nodes: [], // 幹・枝のノード構造（滑らかなグラフィックと物理ダメージを両立）
      leaves: [], // 葉・花・果実のノード
      health: 1.0
    };

    // 初期ツリー構造の構築
    this.buildTreeNodes(plant);

    this.plants.push(plant);
    return plant;
  }

  // 滑らかなツリー構造ノードの生成
  buildTreeNodes(plant) {
    const d = plant.data;
    const maxH = plant.targetHeight;
    const maxDepth = d.maxBranchDepth || 4;

    const createBranchNode = (startX, startY, length, angle, depth) => {
      if (depth > maxDepth || length < 4) return null;

      const midX = startX + Math.cos(angle) * (length * 0.5) + (plant.gene.crookedness * 18 * (depth % 2 === 0 ? 1 : -1));
      const midY = startY + Math.sin(angle) * (length * 0.5);
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;

      const node = {
        startX, startY,
        controlX: midX, controlY: midY,
        endX, endY,
        angle, length, depth,
        health: 1.0,
        burnt: 0.0, // 焦げ度
        acidified: 0.0, // 酸性溶け度
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
    const baseGrowthStep = 0.000008 * speedMultiplier;

    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];

      // 成長処理
      if (p.growth < 1.0) {
        p.growth = Math.min(1.0, p.growth + baseGrowthStep * p.gene.speedMult);
      }

      // 枯死またはノード全滅チェック
      if (p.health <= 0.05) {
        this.plants.splice(i, 1);
      }
    }

    // 溶け落ちた破片・液滴物理の更新
    for (let i = this.fallingDebris.length - 1; i >= 0; i--) {
      const fd = this.fallingDebris[i];
      fd.x += fd.vx;
      fd.y += fd.vy;
      fd.vy += 0.2;
      fd.life--;

      if (fd.life <= 0 || fd.y > 600) {
        this.fallingDebris.splice(i, 1);
      }
    }
  }

  // --- 高精度物理干渉 ---

  // 日光 (Sunlight Beam): 光線が当たった箇所から滑らかに新緑の枝・葉が急成長！
  applySunlightBeam(wx, wy, radius) {
    for (const p of this.plants) {
      if (Math.abs(p.x - wx) < radius + 80) {
        p.growth = Math.min(1.0, p.growth + 0.008);
      }
    }
  }

  // 酸性雨 (Acid Rain): 当たった箇所のノードが直接紫・茶色に溶け変色し、ポタポタ溶け落ちて切り削れる！
  applyAcidRain(wx, wy, radius) {
    for (const p of this.plants) {
      const traverse = (node) => {
        if (!node) return;

        const nodeWorldX = p.x + node.endX;
        const nodeWorldY = p.y + node.endY;
        const dist = Math.hypot(nodeWorldX - wx, nodeWorldY - wy);

        if (dist <= radius) {
          node.acidified = Math.min(1.0, node.acidified + 0.15);
          node.health -= 0.1;

          // 溶け落ち滴パーティクルを発生
          if (Math.random() < 0.4) {
            this.fallingDebris.push({
              x: nodeWorldX,
              y: nodeWorldY,
              vx: (Math.random() - 0.5) * 1.0,
              vy: Math.random() * 1.5,
              radius: 2 + Math.random() * 3,
              color: '#c026d3', // 酸性紫
              life: 35
            });
          }

          if (node.health <= 0) {
            node.children = []; // 子枝が切れて溶け落ちる
          }
        }

        for (const child of node.children) {
          traverse(child);
        }
      };

      if (p.rootNode) traverse(p.rootNode);
    }
  }

  // 溶岩 (Lava): 当たった部分が黒焦げになり、炎とともに焼断崩落！
  applyLavaBurn(wx, wy, radius) {
    for (const p of this.plants) {
      const traverse = (node) => {
        if (!node) return;

        const nodeWorldX = p.x + node.endX;
        const nodeWorldY = p.y + node.endY;
        const dist = Math.hypot(nodeWorldX - wx, nodeWorldY - wy);

        if (dist <= radius) {
          node.burnt = Math.min(1.0, node.burnt + 0.25);
          node.health -= 0.15;

          if (Math.random() < 0.5) {
            this.fallingDebris.push({
              x: nodeWorldX,
              y: nodeWorldY,
              vx: (Math.random() - 0.5) * 2.5,
              vy: -1 - Math.random() * 1.5,
              radius: 3 + Math.random() * 3,
              color: Math.random() > 0.5 ? '#ff4500' : '#1c1917',
              life: 40
            });
          }

          if (node.health <= 0) {
            node.children = []; // 焼き切れて切断
          }
        }

        for (const child of node.children) {
          traverse(child);
        }
      };

      if (p.rootNode) traverse(p.rootNode);
    }
  }

  // 剪定 / 消去: クリック範囲のノードを正確にカット
  removeNodesInRadius(wx, wy, radius) {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];

      const traverse = (node) => {
        if (!node) return;

        for (let c = node.children.length - 1; c >= 0; c--) {
          const child = node.children[c];
          const childWorldX = p.x + child.endX;
          const childWorldY = p.y + child.endY;

          if (Math.hypot(childWorldX - wx, childWorldY - wy) <= radius) {
            node.children.splice(c, 1); // カット
          } else {
            traverse(child);
          }
        }
      };

      if (p.rootNode) {
        if (Math.hypot(p.x - wx, p.y - wy) <= radius) {
          this.plants.splice(i, 1); // 根本からの削除
        } else {
          traverse(p.rootNode);
        }
      }
    }
  }

  // --- つるつる・滑らかな連続グラフィック描画 ---
  draw(ctx, camera) {
    // 1. 地中に伸びる滑らかな根系
    for (const p of this.plants) {
      this.drawRoots(ctx, camera, p);
    }

    // 2. 滑らかな幹・枝・葉・花・果実
    for (const p of this.plants) {
      this.drawPlantBranches(ctx, camera, p);
    }

    // 3. 溶け落ちる液体・破片の描画
    for (const fd of this.fallingDebris) {
      const screenPos = camera.worldToScreen(fd.x, fd.y);
      ctx.fillStyle = fd.color;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, (fd.radius || 2.5) * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 根の滑らかな描画
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
    ctx.quadraticCurveTo(basePos.x - 8 * camera.zoom, basePos.y + rootDepth * 0.5 * camera.zoom, basePos.x + 5 * camera.zoom, basePos.y + rootDepth * camera.zoom);
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

  // 幹・枝の滑らかなベジェ曲線＆連続葉群描画
  drawPlantBranches(ctx, camera, p) {
    if (!p.rootNode) return;

    const basePos = camera.worldToScreen(p.x, p.y);
    const d = plantData = p.data;
    const currentH = p.targetHeight * p.growth;

    ctx.save();
    ctx.translate(basePos.x, basePos.y);

    const drawNode = (node, parentGrowthProgress) => {
      if (!node) return;

      const progress = Math.max(0, Math.min(1.0, (p.growth - node.depth * 0.12) * 3.0));
      if (progress <= 0) return;

      ctx.save();

      // 色の決定（通常 / 酸性溶け紫 / 溶岩黒焦げ）
      let strokeColor = d.trunkColor || '#5c3a21';
      if (node.burnt > 0) {
        strokeColor = '#1c1917';
      } else if (node.acidified > 0) {
        strokeColor = '#701a75';
      }

      ctx.strokeStyle = strokeColor;
      const width = Math.max(1.5, (currentH * 0.05) * Math.pow(0.65, node.depth) * camera.zoom);
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 2次ベジェ曲線描画 (滑らかでカクツキなし)
      ctx.beginPath();
      ctx.moveTo(node.startX * camera.zoom, node.startY * camera.zoom);
      const currEndX = (node.startX + (node.endX - node.startX) * progress) * camera.zoom;
      const currEndY = (node.startY + (node.endY - node.startY) * progress) * camera.zoom;
      const currCtrlX = (node.startX + (node.controlX - node.startX) * progress) * camera.zoom;
      const currCtrlY = (node.startY + (node.controlY - node.startY) * progress) * camera.zoom;

      ctx.quadraticCurveTo(currCtrlX, currCtrlY, currEndX, currEndY);
      ctx.stroke();

      // 枝先または先端に滑らかな葉・花・果実を密生描画
      if (node.children.length === 0 || node.depth >= (d.maxBranchDepth || 4) - 1) {
        if (progress > 0.4) {
          this.drawFoliageCluster(ctx, camera, p, currEndX, currEndY, node);
        }
      }

      // 子枝への描画
      for (const child of node.children) {
        drawNode(child, progress);
      }

      ctx.restore();
    };

    drawNode(p.rootNode, 1.0);
    ctx.restore();
  }

  // 滑らかな葉・花・果実群の描画 (点々なし、連続的な美しい塗り)
  drawFoliageCluster(ctx, camera, p, x, y, node) {
    const d = p.data;
    const leafSize = 14 * camera.zoom;

    ctx.save();
    ctx.translate(x, y);

    let leafColor = d.leafColor || '#2e7d32';
    if (node.burnt > 0) leafColor = '#292524';
    else if (node.acidified > 0) leafColor = '#a855f7';

    ctx.fillStyle = leafColor;

    // 滑らかな葉の塗り
    const leafType = d.leafType || 'oval';

    if (leafType === 'needle') {
      ctx.strokeStyle = leafColor;
      ctx.lineWidth = 2 * camera.zoom;
      for (let a = -0.8; a <= 0.8; a += 0.4) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(a * leafSize, -leafSize * 1.2);
        ctx.stroke();
      }
    } else {
      // 連続する美しい重なり葉
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const angle = (i / 3) * Math.PI * 2;
        const lx = Math.cos(angle) * leafSize * 0.4;
        const ly = Math.sin(angle) * leafSize * 0.4;
        ctx.ellipse(lx, ly - leafSize * 0.5, leafSize * 0.5, leafSize * 0.8, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 滑らかな大輪の花
    if (d.flowerColor && p.growth >= (d.flowerStage || 0.45)) {
      const flowerRadius = leafSize * 0.8;
      ctx.fillStyle = d.flowerColor;

      for (let f = 0; f < 5; f++) {
        const fa = (f / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(fa) * flowerRadius * 0.5, Math.sin(fa) * flowerRadius * 0.5 - leafSize * 0.5, flowerRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -leafSize * 0.5, flowerRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 滑らかなツヤツヤ果実
    if (d.fruitType && p.growth >= (d.fruitStage || 0.65)) {
      const fruitRadius = leafSize * 0.85;
      ctx.fillStyle = d.fruitColor || '#e53935';
      ctx.beginPath();
      ctx.arc(0, fruitRadius * 0.4, fruitRadius, 0, Math.PI * 2);
      ctx.fill();

      // ツヤ光彩
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-fruitRadius * 0.3, fruitRadius * 0.1, fruitRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
