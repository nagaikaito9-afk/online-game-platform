/* PlantPlanet - plantEngine.js */
class PlantEngine {
  constructor() {
    this.plants = [];
  }

  // 種を植える（ワールド座標）
  plantSeed(data, worldX, worldY) {
    const gene = {
      crookedness: (data.crookedness || 0.15) + (Math.random() - 0.5) * 0.15,
      angleVar: (Math.random() - 0.5) * 0.25,
      speedMult: 0.85 + Math.random() * 0.3,
      maxHeightMult: 0.85 + Math.random() * 0.3,
      leafSizeMult: 0.8 + Math.random() * 0.4,
      leafHueShift: (Math.random() - 0.5) * 20, // 葉の色の微妙な違い
      seedId: Math.random().toString(36).substring(2, 9)
    };

    const plant = {
      data: data,
      gene: gene,
      x: worldX,
      y: worldY, // 地表（草むらの位置）
      growth: 0.01, // 0.0 ~ 1.0 (成長度)
      health: 1.0,
      frozen: false,
      frozenTimer: 0,
      burnStage: 0.0, // 0: 正常, 1: 完全に焦げ焦げ
      acidStage: 0.0, // 0: 正常, 1: 毒枯れ
      fertilized: 1.0, // 太さ倍率
      windFlex: 0.0, // 風による揺れ偏位
      rootProgress: 0.0, // 根の伸び具合
      branches: null // 構造分岐データ（初回更新時にプロシージャル生成）
    };

    this.plants.push(plant);
    return plant;
  }

  // 植物の更新
  update(speedMultiplier = 1.0) {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];

      // 氷結タイマー
      if (p.frozenTimer > 0) {
        p.frozenTimer -= speedMultiplier;
        if (p.frozenTimer <= 0) p.frozen = false;
      }

      // 成長処理 (氷結していない場合)
      if (!p.frozen && p.health > 0) {
        const baseSpeed = (p.data.growthSpeed || 1.0) * 0.0006 * p.gene.speedMult;
        p.growth = Math.min(1.0, p.growth + baseSpeed * speedMultiplier);
        p.rootProgress = Math.min(1.0, p.rootProgress + baseSpeed * 1.2 * speedMultiplier);
      }

      // 風の戻り減衰
      p.windFlex *= 0.92;

      // 焼失または完全に枯れた場合の削除
      if (p.burnStage >= 1.0 || p.health <= 0.05) {
        this.plants.splice(i, 1);
      }
    }
  }

  // エフェクト半径適用
  applyEffectRadius(wx, wy, radius, effectType, intensity) {
    for (const p of this.plants) {
      const dist = Math.hypot(p.x - wx, p.y - wy);
      if (dist <= radius) {
        if (effectType === 'water') {
          p.health = Math.min(1.0, p.health + intensity);
          p.growth = Math.min(1.0, p.growth + intensity * 0.05);
        } else if (effectType === 'sunlight') {
          p.growth = Math.min(1.0, p.growth + intensity * 0.08);
        } else if (effectType === 'fertilize') {
          p.fertilized = Math.min(2.2, p.fertilized + intensity * 0.2);
          p.growth = Math.min(1.0, p.growth + intensity * 0.06);
        } else if (effectType === 'burn') {
          p.burnStage = Math.min(1.0, p.burnStage + intensity);
          p.health -= intensity * 0.5;
        } else if (effectType === 'freeze') {
          p.frozen = true;
          p.frozenTimer = 180;
        } else if (effectType === 'acid') {
          p.acidStage = Math.min(1.0, p.acidStage + intensity);
          p.health -= intensity * 0.3;
        }
      }
    }
  }

  // 風の力を与える
  applyWindForce(wx, wy, radius, force) {
    for (const p of this.plants) {
      const dist = Math.abs(p.x - wx);
      if (dist <= radius) {
        p.windFlex += force * (1 - dist / radius);
      }
    }
  }

  // 剪定
  pruneAt(wx, wy, radius) {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];
      const dist = Math.hypot(p.x - wx, (p.y - (p.data.maxHeight * p.growth * 0.5)) - wy);
      if (dist <= radius) {
        p.growth *= 0.6; // 高さを縮小カット
        p.health -= 0.1;
      }
    }
  }

  // 削除
  removePlantAt(wx, wy, radius) {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];
      const dist = Math.hypot(p.x - wx, p.y - wy);
      if (dist <= radius) {
        this.plants.splice(i, 1);
      }
    }
  }

  // 全植物の描画
  draw(ctx, camera) {
    for (const p of this.plants) {
      this.drawPlant(ctx, camera, p);
    }
  }

  // 個別植物描画（プロシージャル再帰）
  drawPlant(ctx, camera, p) {
    const basePos = camera.worldToScreen(p.x, p.y);
    const targetHeight = (p.data.maxHeight || 150) * p.gene.maxHeightMult * p.growth;
    const maxDepth = p.data.maxBranchDepth || 4;

    ctx.save();

    // 1. 地中への根の描画（茶色の土の中に伸びる）
    this.drawRoots(ctx, camera, p);

    // 2. 地上の幹・枝の描画
    ctx.translate(basePos.x, basePos.y);

    // 風の傾き・曲がり
    const totalWind = (p.windFlex || 0) + Math.sin(Date.now() * 0.002 + p.x) * 0.05;
    ctx.rotate(totalWind * 0.15);

    // 幹の太さ
    const baseWidth = Math.max(2, (targetHeight * 0.07) * (p.data.trunkWidthMult || 1.0) * p.fertilized * camera.zoom);

    // 再帰的に幹・枝・葉・花・果実を成長・描画
    this.drawBranch(
      ctx,
      camera,
      p,
      0, // current depth
      maxDepth,
      targetHeight,
      baseWidth,
      -Math.PI / 2, // 真上を向く
      0, 0
    );

    // 氷結エフェクト重ね描画
    if (p.frozen) {
      ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.beginPath();
      ctx.arc(0, -targetHeight * 0.6, targetHeight * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 根のプロシージャル描画
  drawRoots(ctx, camera, p) {
    const rootDepth = (p.data.rootDepth || 60) * p.rootProgress;
    if (rootDepth < 5) return;

    const basePos = camera.worldToScreen(p.x, p.y);
    ctx.save();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = Math.max(1, 3 * camera.zoom);
    ctx.globalAlpha = 0.7;

    ctx.beginPath();
    ctx.moveTo(basePos.x, basePos.y);
    // 中央主根
    ctx.lineTo(basePos.x + Math.sin(p.gene.crookedness * 3) * 15 * camera.zoom, basePos.y + rootDepth * camera.zoom);
    ctx.stroke();

    // 左右側根
    ctx.lineWidth = Math.max(1, 1.5 * camera.zoom);
    ctx.beginPath();
    ctx.moveTo(basePos.x, basePos.y + 10 * camera.zoom);
    ctx.lineTo(basePos.x - 20 * camera.zoom, basePos.y + (rootDepth * 0.7) * camera.zoom);
    ctx.moveTo(basePos.x, basePos.y + 15 * camera.zoom);
    ctx.lineTo(basePos.x + 25 * camera.zoom, basePos.y + (rootDepth * 0.8) * camera.zoom);
    ctx.stroke();

    ctx.restore();
  }

  // 再帰的分岐描画
  drawBranch(ctx, camera, p, depth, maxDepth, length, width, angle, x, y) {
    if (depth >= maxDepth || length < 3) return;

    ctx.save();

    // 支点の回転
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2 + p.gene.angleVar * (depth === 0 ? 0 : 1));

    // 色演算（焦げ/毒/通常）
    let branchColor = p.data.trunkColor || '#5c3a21';
    if (p.burnStage > 0) {
      branchColor = '#1c1917'; // 炭化
    } else if (p.acidStage > 0) {
      branchColor = '#4a044e'; // 紫毒
    }

    ctx.strokeStyle = branchColor;
    ctx.lineWidth = Math.max(1, width * camera.zoom);
    ctx.lineCap = 'round';

    // 幹/枝を描く
    const endX = 0;
    const endY = -length;

    ctx.beginPath();
    ctx.moveTo(0, 0);

    // くねり表現
    const curveMid = p.gene.crookedness * 15 * (depth % 2 === 0 ? 1 : -1);
    ctx.quadraticCurveTo(curveMid, -length * 0.5, endX, endY);
    ctx.stroke();

    // 葉・花・果実の描画（先端または一定深度以上）
    const isTip = (depth >= maxDepth - 1) || (length < 15);
    if (isTip || depth >= 1) {
      this.drawFoliageAndFruit(ctx, camera, p, endX, endY, depth, maxDepth);
    }

    // 次の分岐
    if (depth < maxDepth - 1) {
      const nextLength = length * 0.68;
      const nextWidth = width * 0.65;
      const splitAngle = (p.data.branchAngle || 0.7) + (Math.random() - 0.5) * 0.1;

      // 左枝
      this.drawBranch(
        ctx, camera, p,
        depth + 1, maxDepth,
        nextLength, nextWidth,
        -splitAngle,
        endX, endY
      );

      // 右枝
      this.drawBranch(
        ctx, camera, p,
        depth + 1, maxDepth,
        nextLength, nextWidth,
        splitAngle,
        endX, endY
      );
    }

    ctx.restore();
  }

  // 葉・花・果実の描画
  drawFoliageAndFruit(ctx, camera, p, x, y, depth, maxDepth) {
    ctx.save();
    ctx.translate(x, y);

    const leafSize = (12 * p.gene.leafSizeMult * (p.growth * 0.8 + 0.2)) * camera.zoom;
    let leafColor = p.data.leafColor || '#2e7d32';

    if (p.burnStage > 0) {
      leafColor = '#292524';
    } else if (p.acidStage > 0) {
      leafColor = '#701a75';
    }

    ctx.fillStyle = leafColor;

    // 葉のタイプ別グラフィック
    const leafType = p.data.leafType || 'oval';

    if (leafType === 'needle') { // 針葉 (松・杉)
      ctx.strokeStyle = leafColor;
      ctx.lineWidth = 1.5 * camera.zoom;
      for (let a = -1; a <= 1; a += 0.5) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(a * leafSize * 0.8, -leafSize);
        ctx.stroke();
      }
    } else if (leafType === 'palm') { // 椰子の葉
      for (let i = -2; i <= 2; i++) {
        ctx.rotate(0.3 * i);
        ctx.beginPath();
        ctx.ellipse(0, -leafSize * 1.5, leafSize * 0.3, leafSize * 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (leafType === 'mushroom') { // キノコの傘
      ctx.fillStyle = p.data.leafColor || '#e53935';
      ctx.beginPath();
      ctx.arc(0, 0, leafSize * 1.6, Math.PI, Math.PI * 2);
      ctx.fill();
      // キノコの柄と斑点
      if (p.data.id === 'doku_kinoko') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-leafSize * 0.6, -leafSize * 0.8, leafSize * 0.3, 0, Math.PI * 2);
        ctx.arc(leafSize * 0.6, -leafSize * 0.8, leafSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else { // 通常の楕円 / ハート葉
      ctx.beginPath();
      ctx.ellipse(0, -leafSize * 0.5, leafSize * 0.6, leafSize, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 花の描画 (成長段階が flowerStage を超えている場合)
    if (p.data.flowerColor && p.growth >= (p.data.flowerStage || 0.5)) {
      const flowerSize = leafSize * 1.1;
      ctx.fillStyle = p.data.flowerColor;

      // 花弁（5弁花など）
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const fAngle = (i / 5) * Math.PI * 2;
        const fx = Math.cos(fAngle) * flowerSize * 0.6;
        const fy = Math.sin(fAngle) * flowerSize * 0.6;
        ctx.arc(fx, fy, flowerSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // 花芯
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, flowerSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 果実の描画 (成長段階が fruitStage を超えている場合)
    if (p.data.fruitType && p.growth >= (p.data.fruitStage || 0.7)) {
      const fruitSize = leafSize * 1.3;
      ctx.fillStyle = p.data.fruitColor || '#e53935';
      ctx.beginPath();
      ctx.arc(0, fruitSize * 0.6, fruitSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
