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
      growth: 0.05, // 0.0 ~ 1.0
      targetHeight: (data.maxHeight || 150) * gene.maxHeightMult,
      rootNode: null,
      health: 1.0
    };

    this.buildTreeNodes(plant);
    this.plants.push(plant);
    return plant;
  }

  // ツリー構造ノードの生成
  buildTreeNodes(plant) {
    const d = plant.data;
    const maxH = plant.targetHeight;
    const maxDepth = Math.min(5, d.maxBranchDepth || 4); // 最大深度を安全に制限

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
    const baseGrowthStep = 0.00001 * safeSpeed;

    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];

      if (p.growth < 1.0) {
        p.growth = Math.min(1.0, p.growth + baseGrowthStep * p.gene.speedMult);
      }

      if (p.health <= 0.05) {
        this.plants.splice(i, 1);
      }
    }

    // 溶け落ちた液滴物理
    for (let i = this.fallingDebris.length - 1; i >= 0; i--) {
      const fd = this.fallingDebris[i];
      fd.x += fd.vx;
      fd.y += fd.vy;
      fd.vy += 0.25;
      fd.life--;

      if (fd.life <= 0 || fd.y > 600) {
        this.fallingDebris.splice(i, 1);
      }
    }
  }

  // 物理干渉
  applySunlightBeam(wx, wy, radius) {
    for (const p of this.plants) {
      if (Math.abs(p.x - wx) < radius + 80) {
        p.growth = Math.min(1.0, p.growth + 0.01);
      }
    }
  }

  applyAcidRain(wx, wy, radius) {
    for (const p of this.plants) {
      const traverse = (node) => {
        if (!node) return;

        const nodeWorldX = p.x + node.endX;
        const nodeWorldY = p.y + node.endY;
        const dist = Math.hypot(nodeWorldX - wx, nodeWorldY - wy);

        if (dist <= radius) {
          node.acidified = Math.min(1.0, node.acidified + 0.2);
          node.health -= 0.12;

          if (Math.random() < 0.3) {
            this.fallingDebris.push({
              x: nodeWorldX,
              y: nodeWorldY,
              vx: (Math.random() - 0.5) * 1.0,
              vy: Math.random() * 1.5,
              radius: 2.5,
              color: '#c026d3',
              life: 30
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

  applyLavaBurn(wx, wy, radius) {
    for (const p of this.plants) {
      const traverse = (node) => {
        if (!node) return;

        const nodeWorldX = p.x + node.endX;
        const nodeWorldY = p.y + node.endY;
        const dist = Math.hypot(nodeWorldX - wx, nodeWorldY - wy);

        if (dist <= radius) {
          node.burnt = Math.min(1.0, node.burnt + 0.3);
          node.health -= 0.18;

          if (Math.random() < 0.4) {
            this.fallingDebris.push({
              x: nodeWorldX,
              y: nodeWorldY,
              vx: (Math.random() - 0.5) * 2.0,
              vy: -1 - Math.random() * 1.5,
              radius: 3,
              color: Math.random() > 0.5 ? '#ff4500' : '#1c1917',
              life: 35
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
            node.children.splice(c, 1);
          } else {
            traverse(child);
          }
        }
      };

      if (p.rootNode) {
        if (Math.hypot(p.x - wx, p.y - wy) <= radius) {
          this.plants.splice(i, 1);
        } else {
          traverse(p.rootNode);
        }
      }
    }
  }

  // 描画
  draw(ctx, camera) {
    for (const p of this.plants) {
      this.drawRoots(ctx, camera, p);
    }

    for (const p of this.plants) {
      this.drawPlantBranches(ctx, camera, p);
    }

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

  // 幹・枝の描画
  drawPlantBranches(ctx, camera, p) {
    if (!p.rootNode) return;

    const basePos = camera.worldToScreen(p.x, p.y);
    const d = p.data;
    const currentH = p.targetHeight;

    ctx.save();
    ctx.translate(basePos.x, basePos.y);

    const drawNode = (node) => {
      if (!node) return;

      const startThreshold = node.depth * 0.15;
      const branchProgress = Math.max(0, Math.min(1.0, (p.growth - startThreshold) / 0.22));

      if (branchProgress <= 0) return;

      ctx.save();

      let strokeColor = d.trunkColor || '#5c3a21';
      if (node.burnt > 0) strokeColor = '#1c1917';
      else if (node.acidified > 0) strokeColor = '#701a75';

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

      if (node.children.length === 0 || node.depth >= (d.maxBranchDepth || 4) - 1) {
        if (branchProgress > 0.5) {
          const leafScale = Math.max(0, Math.min(1.0, (branchProgress - 0.5) / 0.5));
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

  // 葉・花・果実の描画
  drawFoliageCluster(ctx, camera, p, x, y, node, scale) {
    if (!scale || scale <= 0.05) return;
    const d = p.data;
    const leafSize = Math.max(1, 14 * scale * camera.zoom);

    ctx.save();
    ctx.translate(x, y);

    let leafColor = d.leafColor || '#2e7d32';
    if (node.burnt > 0) leafColor = '#292524';
    else if (node.acidified > 0) leafColor = '#a855f7';

    ctx.fillStyle = leafColor;
    const leafType = d.leafType || 'oval';

    if (leafType === 'needle') {
      ctx.strokeStyle = leafColor;
      ctx.lineWidth = Math.max(1, 2 * camera.zoom);
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
        const rx = Math.max(0.5, leafSize * 0.5);
        const ry = Math.max(0.5, leafSize * 0.8);
        ctx.beginPath();
        ctx.ellipse(lx, ly - leafSize * 0.5, rx, ry, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 花
    if (d.flowerColor && scale > 0.6 && p.growth >= (d.flowerStage || 0.45)) {
      const flowerRadius = Math.max(1, leafSize * 0.8 * scale);
      ctx.fillStyle = d.flowerColor;

      for (let f = 0; f < 5; f++) {
        const fa = (f / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(fa) * flowerRadius * 0.5, Math.sin(fa) * flowerRadius * 0.5 - leafSize * 0.5, Math.max(0.5, flowerRadius * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -leafSize * 0.5, Math.max(0.5, flowerRadius * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // 果実
    if (d.fruitType && scale > 0.8 && p.growth >= (d.fruitStage || 0.65)) {
      const fruitRadius = Math.max(1, leafSize * 0.85 * scale);
      ctx.fillStyle = d.fruitColor || '#e53935';
      ctx.beginPath();
      ctx.arc(0, fruitRadius * 0.4, fruitRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-fruitRadius * 0.3, fruitRadius * 0.1, Math.max(0.5, fruitRadius * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
