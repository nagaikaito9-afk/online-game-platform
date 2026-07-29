/**
 * Cell Simulation - sandbox_engine.js
 * 本格流体力学: 水圧平坦化 (Hydrostatic Equalization) ＆ 粘性分散 ＆ 流体表面ツヤ描画
 */

class SandboxEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.scale = 4;
    // ヘッダー(50px) + 下部ツールバー(70px) = 120px 控除
    this.cols = Math.floor(window.innerWidth / this.scale);
    this.rows = Math.floor((window.innerHeight - 120) / this.scale);

    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    const size = this.cols * this.rows;
    // 物理グリッドデータ構造
    this.gridId = new Uint16Array(size);
    this.gridVy = new Float32Array(size);
    this.gridVx = new Float32Array(size);
    this.gridTemp = new Float32Array(size);
    this.gridAirVy = new Float32Array(size); // TPT風 熱対流上昇気流

    this.nextGridId = new Uint16Array(size);
    this.nextVy = new Float32Array(size);
    this.nextVx = new Float32Array(size);
    this.nextTemp = new Float32Array(size);
    this.nextAirVy = new Float32Array(size);

    this.selectedElementId = 1; // 初期: 水
    this.brushSize = 5;
    this.isMouseDown = false;
    this.timeScale = 1.0;

    // バックバッファ ImageData
    this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    // 火花・爆発飛沫パーティクル
    this.sparks = [];

    // フレームタイマー
    this.tick = 0;

    this.elementMap = {};
    window.ALL_ELEMENTS.forEach(el => {
      this.elementMap[el.id] = el;
    });

    this.initBoundaryFloor();

    // リサイズハンドラ
    window.addEventListener('resize', () => {
      this.cols = Math.floor(window.innerWidth / this.scale);
      this.rows = Math.floor((window.innerHeight - 120) / this.scale);
      this.canvas.width = this.cols * this.scale;
      this.canvas.height = this.rows * this.scale;
      this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
      this.initBoundaryFloor();
    });
  }

  initBoundaryFloor() {
    this.gridId.fill(0);
    this.gridVy.fill(0);
    this.gridVx.fill(0);
    this.gridTemp.fill(20);
    this.gridAirVy.fill(0);

    const floorY = this.rows - 2;
    for (let x = 0; x < this.cols; x++) {
      const idx = floorY * this.cols + x;
      const idx2 = (floorY + 1) * this.cols + x;
      this.gridId[idx] = 21; // 玄武岩の地面
      this.gridId[idx2] = 21;
    }
  }

  getIndex(x, y) {
    return y * this.cols + x;
  }

  setPixel(x, y, elemId) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows - 2) {
      const idx = this.getIndex(x, y);
      const spec = this.elementMap[elemId] || {};
      this.gridId[idx] = elemId;
      this.gridVy[idx] = 0;
      this.gridVx[idx] = 0;
      this.gridTemp[idx] = spec.temp !== undefined ? spec.temp : 20;
      this.gridAirVy[idx] = 0;
    }
  }

  drawBrush(centerX, centerY) {
    const r = this.brushSize;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const px = centerX + dx;
          const py = centerY + dy;
          this.setPixel(px, py, this.selectedElementId);
        }
      }
    }
  }

  clearGrid() {
    this.initBoundaryFloor();
    this.sparks = [];
  }

  // 火花・粒子発生関数
  addSparks(x, y, count, color = [255, 200, 50]) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.0;
      this.sparks.push({
        x: x * this.scale + (this.scale / 2),
        y: y * this.scale + (this.scale / 2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: color,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.05
      });
    }
  }

  // 連鎖爆発
  triggerExplosion(centerX, centerY, radius = 9) {
    if (window.cellAudioEngine) window.cellAudioEngine.playSE('explode');
    this.addSparks(centerX, centerY, 35, [255, 220, 80]);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSq = dx * dx + dy * dy;
        if (distSq <= radius * radius) {
          const tx = centerX + dx;
          const ty = centerY + dy;
          if (tx >= 0 && tx < this.cols && ty >= 0 && ty < this.rows - 2) {
            const idx = this.getIndex(tx, ty);
            const eId = this.gridId[idx];
            if (eId === 21 || eId === 24) continue;

            this.nextAirVy[idx] = -8.0;

            if (distSq <= (radius * 0.5) * (radius * 0.5)) {
              this.nextGridId[idx] = 38; // 爆心部は火
              this.nextTemp[idx] = 1300;
            } else {
              this.nextGridId[idx] = 29; // 黒煙
              this.nextTemp[idx] = 450;
            }
          }
        }
      }
    }
  }

  // 物理ステップ更新
  update() {
    if (this.timeScale <= 0) return;
    this.tick++;

    const steps = Math.max(1, Math.min(20, Math.floor(this.timeScale)));
    const dt = (0.16 * this.timeScale) / steps;

    for (let s = 0; s < steps; s++) {
      this.stepPhysics(dt);
    }

    // パーティクル移動
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  stepPhysics(dt) {
    this.nextGridId.set(this.gridId);
    this.nextVy.set(this.gridVy);
    this.nextVx.set(this.gridVx);
    this.nextTemp.set(this.gridTemp);
    this.nextAirVy.set(this.gridAirVy);

    const gravity = 0.45;
    const globalWind = Math.sin(this.tick * 0.04) * 0.5;

    // ----------------------------------------------------
    // 1. TPT風 熱対流上昇気流場 (Thermal Convection)
    // ----------------------------------------------------
    for (let y = 0; y < this.rows - 2; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);
        const temp = this.gridTemp[idx];

        if (temp > 80) {
          const updraft = -(temp - 80) * 0.004;
          this.nextAirVy[idx] = Math.max(-6.0, this.nextAirVy[idx] + updraft);
        }
        this.nextAirVy[idx] *= 0.88;
      }
    }

    // ----------------------------------------------------
    // 2. セル物理演算 (粉末 vs 本格流体力学)
    // ----------------------------------------------------
    for (let y = this.rows - 3; y >= 0; y--) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);
        const elemId = this.gridId[idx];

        if (elemId === 0 || elemId === 21) continue;

        const spec = this.elementMap[elemId] || ALL_ELEMENTS[0];
        let currentTemp = this.gridTemp[idx];

        // A. 熱伝導 (Heat Conduction)
        const neighbors = [
          this.getIndex(x + 1, y), this.getIndex(x - 1, y),
          this.getIndex(x, y + 1), this.getIndex(x, y - 1)
        ];
        for (let nIdx of neighbors) {
          if (nIdx >= 0 && nIdx < this.gridId.length && this.gridId[nIdx] !== 0) {
            const nTemp = this.gridTemp[nIdx];
            const tempDiff = nTemp - currentTemp;
            if (Math.abs(tempDiff) > 1.5) {
              const heatTransfer = tempDiff * 0.1 * dt;
              currentTemp += heatTransfer;
              this.nextTemp[idx] = currentTemp;
              this.nextTemp[nIdx] -= heatTransfer;
            }
          }
        }

        // B. 相転移 ＆ 着火
        if (spec.boilPoint !== undefined && currentTemp >= spec.boilPoint && spec.boilTo) {
          this.nextGridId[idx] = spec.boilTo;
          if (window.cellAudioEngine) window.cellAudioEngine.playSE('boil');
          continue;
        }
        if (spec.freezePoint !== undefined && currentTemp <= spec.freezePoint && spec.freezeTo) {
          this.nextGridId[idx] = spec.freezeTo;
          continue;
        }
        if (spec.meltPoint !== undefined && currentTemp >= spec.meltPoint && spec.meltTo) {
          this.nextGridId[idx] = spec.meltTo;
          continue;
        }
        if (spec.ignitePoint !== undefined && currentTemp >= spec.ignitePoint) {
          if (elemId === 14 || elemId === 31) {
            this.triggerExplosion(x, y, elemId === 14 ? 10 : 7);
            continue;
          } else {
            this.nextGridId[idx] = 38;
            this.nextTemp[idx] = 800;
            continue;
          }
        }

        // C. 化学反応
        if (elemId === 4) { // 酸
          for (let nIdx of neighbors) {
            const targetId = this.gridId[nIdx];
            if (targetId !== 0 && targetId !== 4 && targetId !== 21 && targetId !== 24 && targetId !== 25) {
              if (Math.random() < 0.3) {
                this.nextGridId[idx] = 28;
                this.nextGridId[nIdx] = 0;
                if (window.cellAudioEngine) window.cellAudioEngine.playSE('acid');
                break;
              }
            }
          }
        }

        if (elemId === 2) { // 溶岩 ✕ 水
          for (let nIdx of neighbors) {
            if (this.gridId[nIdx] === 1) {
              this.nextGridId[idx] = 21;
              this.nextGridId[nIdx] = 28;
              this.nextTemp[nIdx] = 150;
              this.addSparks(x, y, 6, [255, 120, 30]);
              if (window.cellAudioEngine) window.cellAudioEngine.playSE('boil');
              break;
            }
          }
        }

        // D. 炎 (Fire: ID 38)
        if (elemId === 38) {
          currentTemp -= 15 * dt;
          this.nextTemp[idx] = currentTemp;

          if (currentTemp < 200 || Math.random() < 0.18) {
            if (Math.random() < 0.35) {
              this.nextGridId[idx] = 29; // 黒煙へ変化
              this.nextTemp[idx] = 120;
            } else {
              this.nextGridId[idx] = 0;
            }
            continue;
          }

          for (let nIdx of neighbors) {
            const tId = this.gridId[nIdx];
            const tSpec = this.elementMap[tId];
            if (tSpec && tSpec.ignitePoint && currentTemp >= tSpec.ignitePoint) {
              if (tId === 14) this.triggerExplosion(x % this.cols, Math.floor(nIdx / this.cols), 10);
              else this.nextGridId[nIdx] = 38;
            }
          }
        }

        // ----------------------------------------------------
        // E. 物理移動: 粉末(Powder) vs 本格流体力学(Liquid Hydrostatic Equalization)
        // ----------------------------------------------------
        if (spec.state === 'liquid') {
          // --- 本格流体力学 (Fluid Dynamics) ---
          let vy = this.gridVy[idx] + gravity * dt;
          vy = Math.min(12, vy);
          const belowIdx = this.getIndex(x, y + 1);

          // 1. 直下に空きがある場合 ➔ 直下へスムーズに重力落下
          if (y < this.rows - 3 && this.nextGridId[belowIdx] === 0) {
            this.swapPhysics(idx, belowIdx, vy, 0);
          }
          // 2. 直下に別の液体/粉末がある場合 ➔ 密度浮力チェック
          else if (y < this.rows - 3 && this.nextGridId[belowIdx] !== 0 && this.nextGridId[belowIdx] !== 21) {
            const bElemId = this.nextGridId[belowIdx];
            const bSpec = this.elementMap[bElemId];
            if (bSpec && (bSpec.state === 'liquid' || bSpec.state === 'powder') && spec.density > bSpec.density && Math.random() < 0.7) {
              this.swapPhysics(idx, belowIdx, vy, 0);
            } else {
              // 3. 着地している場合 ➔ 水圧水平平坦化 (Hydrostatic Equalization)
              this.fluidEqualize(x, y, idx, spec);
            }
          } else {
            // 3. 着地している場合 ➔ 水圧水平平坦化 (Hydrostatic Equalization)
            this.fluidEqualize(x, y, idx, spec);
          }
        } else if (spec.state === 'powder') {
          // --- 砂・粉末 (Powder: 山なり安息角物理) ---
          let vy = this.gridVy[idx] + gravity * dt;
          vy = Math.min(12, vy);
          if (y < this.rows - 3) {
            const belowIdx = this.getIndex(x, y + 1);
            if (this.nextGridId[belowIdx] === 0) {
              this.swapPhysics(idx, belowIdx, vy, 0);
            } else {
              // 斜め45度への崩落のみ
              const belowL = this.getIndex(x - 1, y + 1);
              const belowR = this.getIndex(x + 1, y + 1);
              const dir = Math.random() < 0.5 ? 1 : -1;
              const firstTarget = dir === 1 ? belowR : belowL;
              const secondTarget = dir === 1 ? belowL : belowR;
              const firstX = dir === 1 ? x + 1 : x - 1;
              const secondX = dir === 1 ? x - 1 : x + 1;

              if (firstX >= 0 && firstX < this.cols && this.nextGridId[firstTarget] === 0) {
                this.swapPhysics(idx, firstTarget, vy, dir);
              } else if (secondX >= 0 && secondX < this.cols && this.nextGridId[secondTarget] === 0) {
                this.swapPhysics(idx, secondTarget, vy, -dir);
              }
            }
          }
        } else if (spec.state === 'gas' || elemId === 38) {
          // --- 気体 ＆ 炎: TPT風 熱対流上昇気流 ✕ 多方向圧力拡散 ---
          const airUpstream = this.gridAirVy[idx];
          const upSpeed = Math.min(-0.8, -1.2 + airUpstream);

          if (y > 0) {
            const driftDir = (Math.random() < 0.4 ? (globalWind > 0 ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1));
            const targetX = Math.max(0, Math.min(this.cols - 1, x + driftDir));
            const aboveIdx = this.getIndex(targetX, y - 1);
            const sideIdx = this.getIndex(targetX, y);

            if (this.nextGridId[aboveIdx] === 0) {
              this.swapPhysics(idx, aboveIdx, upSpeed, driftDir * 0.8);
            } else if (this.nextGridId[sideIdx] === 0 && Math.random() < 0.7) {
              this.swapPhysics(idx, sideIdx, 0, driftDir * 1.2);
            }
          }
        }
      }
    }

    this.gridId.set(this.nextGridId);
    this.gridVy.set(this.nextVy);
    this.gridVx.set(this.nextVx);
    this.gridTemp.set(this.nextTemp);
    this.gridAirVy.set(this.nextAirVy);
  }

  // 本格水圧平坦化 (Hydrostatic Equalization & Horizontal Pressure Flow)
  fluidEqualize(x, y, idx, spec) {
    const maxDisp = spec.dispersion || 10;
    const startDir = Math.random() < 0.5 ? 1 : -1;
    const dirs = [startDir, -startDir];

    for (let dir of dirs) {
      for (let offset = 1; offset <= maxDisp; offset++) {
        const tx = x + (dir * offset);
        if (tx < 0 || tx >= this.cols) break;

        const targetIdx = this.getIndex(tx, y);
        const targetBelowIdx = this.getIndex(tx, y + 1);

        // より低い空隙(空セル)を発見した場合は即座に水平流動
        if (this.nextGridId[targetIdx] === 0 && (y + 1 >= this.rows - 2 || this.nextGridId[targetBelowIdx] === 0 || this.nextGridId[targetBelowIdx] === 0)) {
          this.swapPhysics(idx, targetIdx, 0, dir * 2.0);
          return;
        }

        // 途中に壁や高密度固形がある場合は流動ブロック
        if (this.nextGridId[targetIdx] !== 0 && this.nextGridId[targetIdx] !== spec.id) {
          break;
        }
      }
    }
  }

  swapPhysics(i1, i2, vy, vx) {
    this.nextGridId[i2] = this.nextGridId[i1];
    this.nextGridId[i1] = 0;

    this.nextVy[i2] = vy;
    this.nextVy[i1] = 0;

    this.nextVx[i2] = vx;
    this.nextVx[i1] = 0;

    this.nextTemp[i2] = this.nextTemp[i1];
    this.nextTemp[i1] = 20;

    this.nextAirVy[i2] = this.nextAirVy[i1];
    this.nextAirVy[i1] = 0;
  }

  // 本格流体表面ツヤハイライト ＆ シームレス融合描画
  render() {
    const data = this.imgData.data;
    let ptr = 0;
    const width = this.canvas.width;
    const height = this.canvas.height;

    for (let y = 0; y < height; y++) {
      const gy = Math.floor(y / this.scale);
      for (let x = 0; x < width; x++) {
        const gx = Math.floor(x / this.scale);
        const idx = gy * this.cols + gx;
        const elemId = this.gridId[idx];
        const temp = this.gridTemp[idx];
        const spec = this.elementMap[elemId] || { color: [10, 14, 24, 255] };

        let r = spec.color[0];
        let g = spec.color[1];
        let b = spec.color[2];
        let a = spec.color[3];

        if (elemId !== 0) {
          if (elemId === 38) {
            // 炎の TPT風 温度カラーグラデーション
            if (temp >= 850) {
              r = 255; g = 240; b = 180; a = 255;
            } else if (temp >= 550) {
              r = 255; g = 140; b = 20; a = 240;
            } else {
              r = 210; g = 50; b = 10; a = 210;
            }
          } else if (spec.state === 'liquid') {
            // --- 流体表面ツヤ ＆ 連続液面ハイライト (Fluid Surface Highlight) ---
            const aboveIdx = (gy > 0) ? (gy - 1) * this.cols + gx : -1;
            const isSurface = (aboveIdx >= 0 && (this.gridId[aboveIdx] === 0 || this.elementMap[this.gridId[aboveIdx]]?.state === 'gas'));

            if (isSurface) {
              // 水面の波紋ハイライト (水面にツヤと透明感を付加)
              const wave = Math.sin(gx * 0.1 + this.tick * 0.1) * 20;
              r = Math.min(255, r + 45 + wave);
              g = Math.min(255, g + 45 + wave);
              b = Math.min(255, b + 55 + wave);
            } else {
              // 深水部のスムーズグラデーション (粉感を消去)
              r = Math.max(0, r - (gy % 3) * 2);
              g = Math.max(0, g - (gy % 3) * 2);
              b = Math.max(0, b - (gy % 3) * 2);
            }
          } else {
            // 砂・粉末・固形物は粒状感テクスチャノイズ
            const noise = ((gx * 17 + gy * 31) % 13) - 6;
            r = Math.max(0, Math.min(255, r + noise));
            g = Math.max(0, Math.min(255, g + noise));
            b = Math.max(0, Math.min(255, b + noise));

            // 赤熱発光
            if (temp > 150) {
              const glowRatio = Math.min(1.0, (temp - 150) / 1000);
              r = Math.min(255, r + Math.floor(glowRatio * 180));
              g = Math.min(255, g + Math.floor(glowRatio * 40));
            }
          }
        }

        data[ptr]     = r;
        data[ptr + 1] = g;
        data[ptr + 2] = b;
        data[ptr + 3] = a;
        ptr += 4;
      }
    }

    this.ctx.putImageData(this.imgData, 0, 0);

    // 火花・スパーク粒子描画
    if (this.sparks.length > 0) {
      this.ctx.save();
      for (let p of this.sparks) {
        this.ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${p.life})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, Math.max(1, p.life * 2.5), 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }
}

window.SandboxEngine = SandboxEngine;
