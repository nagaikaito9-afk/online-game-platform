/**
 * Cell Simulation - sandbox_engine.js
 * 200元素対応 ＆ 本格リアルタイム流体・重力・化学反応物理エンジン
 * (※メニューの上に固定床を生成 ＆ 水のリアル流体物理演算)
 */

class SandboxEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.scale = 4; // 1ピクセルの描画スケール
    this.cols = Math.floor(window.innerWidth / this.scale);
    this.rows = Math.floor((window.innerHeight - 70) / this.scale);

    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    // グリッドデータ
    this.grid = new Uint16Array(this.cols * this.rows);
    this.nextGrid = new Uint16Array(this.cols * this.rows);

    this.selectedElementId = 1; // 初期: 水 (Water)
    this.brushSize = 5;
    this.isMouseDown = false;
    this.speed = 1;

    this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    // 元素インデックスマップ作成
    this.elementMap = {};
    window.ALL_ELEMENTS.forEach(el => {
      this.elementMap[el.id] = el;
    });

    this.initBoundaryFloor();
  }

  // メニューの直上に消えない境界床 (Boundary Ground Floor) を自動生成
  initBoundaryFloor() {
    this.grid.fill(0);
    const floorY = this.rows - 2;
    for (let x = 0; x < this.cols; x++) {
      this.grid[floorY * this.cols + x] = 21; // 21: 玄武岩/固定床
      this.grid[(floorY + 1) * this.cols + x] = 21;
    }
  }

  getIndex(x, y) {
    return y * this.cols + x;
  }

  setPixel(x, y, elemId) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows - 2) {
      this.grid[this.getIndex(x, y)] = elemId;
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

  // 🧪 本格的な流体・重力・化学反応物理ステップ
  update() {
    if (this.speed === 0) return;

    this.nextGrid.set(this.grid);

    // メニュー直上の床より上を物理処理
    for (let y = this.rows - 3; y >= 0; y--) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);
        const elemId = this.grid[idx];

        if (elemId === 0 || elemId === 21) continue; // 空虚または固定床はスキップ

        const spec = this.elementMap[elemId] || ALL_ELEMENTS[0];

        // 1. 溶岩 (Lava: ID 2) ✕ 水 (Water: ID 1) ➔ 玄武岩 (ID 21) ＋ 水蒸気 (ID 28) 反応
        if (elemId === 2) {
          const neighbors = [
            this.getIndex(x + 1, y), this.getIndex(x - 1, y),
            this.getIndex(x, y + 1), this.getIndex(x, y - 1)
          ];
          for (let nIdx of neighbors) {
            if (this.grid[nIdx] === 1) { // 水と接触
              this.nextGrid[idx] = 21; // 玄武岩化
              this.nextGrid[nIdx] = 28; // 水蒸気発生
              if (window.cellAudioEngine) window.cellAudioEngine.playSE('combine');
              break;
            }
          }
        }

        // 2. 酸 (Acid: ID 4) ✕ 侵食
        if (elemId === 4) {
          const below = this.getIndex(x, y + 1);
          if (y < this.rows - 3 && this.grid[below] !== 0 && this.grid[below] !== 4 && this.grid[below] !== 21) {
            this.nextGrid[idx] = 0;
            this.nextGrid[below] = 0;
          }
        }

        // 3. 火 (Fire: ID 38) ✕ 燃焼
        if (elemId === 38) {
          if (Math.random() < 0.2) this.nextGrid[idx] = 0;
          const neighbors = [
            this.getIndex(x + 1, y), this.getIndex(x - 1, y),
            this.getIndex(x, y + 1), this.getIndex(x, y - 1)
          ];
          for (let nIdx of neighbors) {
            const targetId = this.grid[nIdx];
            if (targetId === 27 || targetId === 34 || targetId === 3) { // 木材・人間・石油
              this.nextGrid[nIdx] = 38; // 発火
            }
          }
        }

        // 4. 細胞 (Cell: ID 33) ✕ 水 (Water: ID 1) ➔ 自動分裂
        if (elemId === 33 && Math.random() < 0.04) {
          const right = this.getIndex(x + 1, y);
          if (x < this.cols - 1 && this.grid[right] === 1) {
            this.nextGrid[right] = 33;
            if (window.cellAudioEngine) window.cellAudioEngine.playSE('cell_split');
          }
        }

        // 💧 5. 水・液体の本格リアル物理演算 (Fluid Physics Leveling)
        if (spec.state === 'liquid') {
          if (y < this.rows - 3) {
            const below = this.getIndex(x, y + 1);
            if (this.nextGrid[below] === 0) {
              this.swap(idx, below);
            } else {
              // 水は砂と違い、左右 1〜8 ピクセル先まで素早く流動して水平化（Fluid Leveling）
              const maxFlow = spec.viscosity || 6;
              let moved = false;
              const dir = Math.random() < 0.5 ? 1 : -1;

              for (let offset = 1; offset <= maxFlow; offset++) {
                const targetX = x + (dir * offset);
                if (targetX >= 0 && targetX < this.cols) {
                  const targetIdx = this.getIndex(targetX, y);
                  const targetBelow = this.getIndex(targetX, y + 1);
                  if (this.nextGrid[targetIdx] === 0 && this.nextGrid[targetBelow] === 0) {
                    this.swap(idx, targetIdx);
                    moved = true;
                    break;
                  }
                }
              }

              if (!moved) {
                // 左右直近への滑り落ち
                const belowL = this.getIndex(x - 1, y + 1);
                const belowR = this.getIndex(x + 1, y + 1);
                if (x > 0 && this.nextGrid[belowL] === 0) {
                  this.swap(idx, belowL);
                } else if (x < this.cols - 1 && this.nextGrid[belowR] === 0) {
                  this.swap(idx, belowR);
                }
              }
            }
          }
        } else if (spec.state === 'powder') {
          // 砂・粉末の安息角物理
          if (y < this.rows - 3) {
            const below = this.getIndex(x, y + 1);
            const belowL = this.getIndex(x - 1, y + 1);
            const belowR = this.getIndex(x + 1, y + 1);

            if (this.nextGrid[below] === 0) {
              this.swap(idx, below);
            } else if (x > 0 && this.nextGrid[belowL] === 0) {
              this.swap(idx, belowL);
            } else if (x < this.cols - 1 && this.nextGrid[belowR] === 0) {
              this.swap(idx, belowR);
            }
          }
        } else if (spec.state === 'gas') {
          // 気体の上昇物理
          if (y > 0) {
            const above = this.getIndex(x, y - 1);
            if (this.nextGrid[above] === 0) {
              this.swap(idx, above);
            }
          }
        }
      }
    }

    this.grid.set(this.nextGrid);
  }

  swap(i1, i2) {
    const temp = this.nextGrid[i1];
    this.nextGrid[i1] = this.nextGrid[i2];
    this.nextGrid[i2] = temp;
  }

  render() {
    const data = this.imgData.data;
    let ptr = 0;

    for (let y = 0; y < this.canvas.height; y++) {
      const gy = Math.floor(y / this.scale);
      for (let x = 0; x < this.canvas.width; x++) {
        const gx = Math.floor(x / this.scale);
        const elemId = this.grid[gy * this.cols + gx];
        const spec = this.elementMap[elemId] || { color: [10, 14, 24, 255] };

        data[ptr]     = spec.color[0];
        data[ptr + 1] = spec.color[1];
        data[ptr + 2] = spec.color[2];
        data[ptr + 3] = spec.color[3];
        ptr += 4;
      }
    }

    this.ctx.putImageData(this.imgData, 0, 0);
  }
}

window.SandboxEngine = SandboxEngine;
