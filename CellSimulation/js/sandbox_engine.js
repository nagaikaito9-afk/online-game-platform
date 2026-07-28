/**
 * Cell Simulation - sandbox_engine.js
 * 重力加速度 v_y = v_y + g*dt ＆ 熱伝導(℃) ＆ 水面波紋 ＆ 100倍速物理演算エンジン
 */

class SandboxEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.scale = 4;
    this.cols = Math.floor(window.innerWidth / this.scale);
    this.rows = Math.floor((window.innerHeight - 70) / this.scale);

    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    const size = this.cols * this.rows;
    // 物理グリッドデータ構造
    this.gridId = new Uint16Array(size);
    this.gridVy = new Float32Array(size);   // 落下速度 (重力加速度)
    this.gridVx = new Float32Array(size);   // 水平速度
    this.gridTemp = new Float32Array(size); // 温度 (℃)

    this.nextGridId = new Uint16Array(size);
    this.nextVy = new Float32Array(size);
    this.nextVx = new Float32Array(size);
    this.nextTemp = new Float32Array(size);

    this.selectedElementId = 1; // 初期: 水
    this.brushSize = 5;
    this.isMouseDown = false;
    this.timeScale = 1.0; // 0x (Pause) ～ 100x

    this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    this.elementMap = {};
    window.ALL_ELEMENTS.forEach(el => {
      this.elementMap[el.id] = el;
    });

    this.initBoundaryFloor();
  }

  initBoundaryFloor() {
    this.gridId.fill(0);
    this.gridVy.fill(0);
    this.gridVx.fill(0);
    this.gridTemp.fill(20); // 常温20℃

    const floorY = this.rows - 2;
    for (let x = 0; x < this.cols; x++) {
      const idx = floorY * this.cols + x;
      const idx2 = (floorY + 1) * this.cols + x;
      this.gridId[idx] = 21; // 21: 玄武岩
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
      this.gridTemp[idx] = spec.temp || 20;
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
  }

  // 重力加速度 ＆ 熱伝導 ＆ 物理ステップ
  update() {
    if (this.timeScale <= 0) return;

    // 100倍速制御 (物理計算サブステップ)
    const steps = Math.max(1, Math.min(20, Math.floor(this.timeScale)));
    const dt = (0.16 * this.timeScale) / steps;

    for (let s = 0; s < steps; s++) {
      this.stepPhysics(dt);
    }
  }

  stepPhysics(dt) {
    this.nextGridId.set(this.gridId);
    this.nextVy.set(this.gridVy);
    this.nextVx.set(this.gridVx);
    this.nextTemp.set(this.gridTemp);

    const gravity = 0.45; // 重力加速度 g

    for (let y = this.rows - 3; y >= 0; y--) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);
        const elemId = this.gridId[idx];

        if (elemId === 0 || elemId === 21) continue;

        const spec = this.elementMap[elemId] || ALL_ELEMENTS[0];
        let currentTemp = this.gridTemp[idx];

        // 1. 熱伝導 (Heat Conduction): 隣接セルと熱移動
        const neighbors = [
          this.getIndex(x + 1, y), this.getIndex(x - 1, y),
          this.getIndex(x, y + 1), this.getIndex(x, y - 1)
        ];
        for (let nIdx of neighbors) {
          if (nIdx >= 0 && nIdx < this.gridId.length && this.gridId[nIdx] !== 0) {
            const nTemp = this.gridTemp[nIdx];
            const tempDiff = nTemp - currentTemp;
            if (Math.abs(tempDiff) > 2) {
              const heatTransfer = tempDiff * 0.08 * dt;
              currentTemp += heatTransfer;
              this.nextTemp[idx] = currentTemp;
              this.nextTemp[nIdx] -= heatTransfer;
            }
          }
        }

        // 2. 溶岩 (Lava: ID 2) ✕ 水 (Water: ID 1) ➔ 熱交換・激しい沸騰・玄武岩化
        if (elemId === 2) {
          for (let nIdx of neighbors) {
            if (this.gridId[nIdx] === 1) { // 水
              this.nextGridId[idx] = 21; // 玄武岩
              this.nextGridId[nIdx] = 28; // 水蒸気
              this.nextTemp[nIdx] = 100;
              if (window.cellAudioEngine) window.cellAudioEngine.playSE('combine');
              break;
            }
          }
        }

        // 3. 火 (Fire: ID 38) ✕ 熱傷・焦げ(Charring) ＆ 消滅
        if (elemId === 38) {
          if (Math.random() < 0.18) this.nextGridId[idx] = 0;
          for (let nIdx of neighbors) {
            const tId = this.gridId[nIdx];
            if (tId === 27 || tId === 34 || tId === 3) { // 木・人間・石油
              this.nextGridId[nIdx] = 38; // 発火延焼
            }
          }
        }

        // 4. 重力加速度 (Gravitational Acceleration: v_y = v_y + g * dt)
        if (spec.state === 'powder' || spec.state === 'liquid') {
          let vy = this.gridVy[idx] + gravity * dt;
          let vx = this.gridVx[idx];
          vy = Math.min(12, vy); // 終端速度 (Terminal Velocity)

          if (y < this.rows - 3) {
            const moveSteps = Math.max(1, Math.floor(vy));
            let currY = y;
            let currX = x;

            for (let step = 0; step < moveSteps; step++) {
              const targetY = currY + 1;
              const belowIdx = this.getIndex(currX, targetY);

              if (this.nextGridId[belowIdx] === 0) {
                currY = targetY;
              } else {
                // 水などの流体(liquid)は左右に大きく流動水平化 (Fluid Leveling)
                if (spec.state === 'liquid') {
                  const maxFlow = spec.viscosity || 7;
                  const dir = Math.random() < 0.5 ? 1 : -1;
                  let fluidMoved = false;

                  for (let offset = 1; offset <= maxFlow; offset++) {
                    const tx = currX + (dir * offset);
                    if (tx >= 0 && tx < this.cols) {
                      const sideIdx = this.getIndex(tx, currY);
                      const sideBelowIdx = this.getIndex(tx, currY + 1);
                      if (this.nextGridId[sideIdx] === 0 && this.nextGridId[sideBelowIdx] === 0) {
                        currX = tx;
                        fluidMoved = true;
                        break;
                      }
                    }
                  }
                  if (!fluidMoved) vy = 0;
                } else {
                  // 砂など粉末(powder)の傾斜落下
                  const belowL = this.getIndex(currX - 1, currY + 1);
                  const belowR = this.getIndex(currX + 1, currY + 1);
                  if (currX > 0 && this.nextGridId[belowL] === 0) {
                    currX -= 1;
                    currY += 1;
                  } else if (currX < this.cols - 1 && this.nextGridId[belowR] === 0) {
                    currX += 1;
                    currY += 1;
                  } else {
                    vy = 0;
                  }
                }
                break;
              }
            }

            if (currX !== x || currY !== y) {
              const newIdx = this.getIndex(currX, currY);
              this.swapPhysics(idx, newIdx, vy, vx);
            }
          }
        } else if (spec.state === 'gas') {
          // 気体の上昇物理 (v_y = -1.5)
          if (y > 0) {
            const above = this.getIndex(x, y - 1);
            if (this.nextGridId[above] === 0) {
              this.swapPhysics(idx, above, -1.5, 0);
            }
          }
        }
      }
    }

    this.gridId.set(this.nextGridId);
    this.gridVy.set(this.nextVy);
    this.gridVx.set(this.nextVx);
    this.gridTemp.set(this.nextTemp);
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
  }

  // リアル発光 ＆ 熱放射グラデーション描画
  render() {
    const data = this.imgData.data;
    let ptr = 0;

    for (let y = 0; y < this.canvas.height; y++) {
      const gy = Math.floor(y / this.scale);
      for (let x = 0; x < this.canvas.width; x++) {
        const gx = Math.floor(x / this.scale);
        const idx = gy * this.cols + gx;
        const elemId = this.gridId[idx];
        const temp = this.gridTemp[idx];
        const spec = this.elementMap[elemId] || { color: [10, 14, 24, 255] };

        let r = spec.color[0];
        let g = spec.color[1];
        let b = spec.color[2];
        let a = spec.color[3];

        // 熱による赤色発光エフェクト (Emissive Heat Glow)
        if (temp > 200 && elemId !== 0) {
          const glowRatio = Math.min(1.0, (temp - 200) / 1000);
          r = Math.min(255, r + Math.floor(glowRatio * 180));
          g = Math.max(0, g - Math.floor(glowRatio * 50));
        }

        data[ptr]     = r;
        data[ptr + 1] = g;
        data[ptr + 2] = b;
        data[ptr + 3] = a;
        ptr += 4;
      }
    }

    this.ctx.putImageData(this.imgData, 0, 0);
  }
}

window.SandboxEngine = SandboxEngine;
