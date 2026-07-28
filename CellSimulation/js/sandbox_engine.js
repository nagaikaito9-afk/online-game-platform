/**
 * Cell Simulation - sandbox_engine.js
 * The Powder Toy / Falling Sand スタイル グリッド物理＆元素反応エンジン
 */

// 元素・物質ID定義
const ELEMENT_TYPES = {
  EMPTY: 0,
  SAND: 1,
  WATER: 2,
  LAVA: 3,
  STEAM: 4,
  STONE: 5,
  FIRE: 6,
  PLANT: 7,
  CELL: 8,
  HUMAN: 9,
  ACID: 10,
  IRON: 11
};

const ELEMENT_SPECS = {
  0:  { name: '空虚 (Air)', color: [10, 14, 24, 255], density: 0, state: 'gas' },
  1:  { name: '砂 (Sand)', color: [235, 195, 115, 255], density: 10, state: 'powder' },
  2:  { name: '水 (Water)', color: [0, 180, 254, 230], density: 5, state: 'liquid' },
  3:  { name: '溶岩 (Lava)', color: [255, 60, 0, 255], density: 8, state: 'liquid', temp: 1200 },
  4:  { name: '水蒸気 (Steam)', color: [200, 220, 255, 160], density: -2, state: 'gas' },
  5:  { name: '玄武岩 (Stone)', color: [90, 95, 110, 255], density: 20, state: 'solid' },
  6:  { name: '火 (Fire)', color: [255, 180, 0, 255], density: -5, state: 'gas', temp: 800 },
  7:  { name: '植物 (Plant)', color: [40, 200, 90, 255], density: 15, state: 'solid' },
  8:  { name: '細胞 (Cell)', color: [0, 255, 140, 255], density: 6, state: 'solid' },
  9:  { name: '人間組織 (Human)', color: [240, 160, 150, 255], density: 7, state: 'solid' },
  10: { name: '酸 (Acid)', color: [160, 255, 0, 220], density: 5, state: 'liquid' },
  11: { name: '鉄 (Iron)', color: [140, 150, 165, 255], density: 30, state: 'solid' }
};

class SandboxEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.scale = 4; // 1ピクセル物理の解像度スケール
    this.cols = Math.floor(window.innerWidth / this.scale);
    this.rows = Math.floor((window.innerHeight - 80) / this.scale);

    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    // グリッド配列 (0: EMPTY)
    this.grid = new Uint8Array(this.cols * this.rows);
    this.nextGrid = new Uint8Array(this.cols * this.rows);

    this.selectedElement = ELEMENT_TYPES.SAND;
    this.brushSize = 4;
    this.isMouseDown = false;
    this.speed = 1;

    this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    this.initPreset();
  }

  initPreset() {
    this.grid.fill(ELEMENT_TYPES.EMPTY);
  }

  getIndex(x, y) {
    return y * this.cols + x;
  }

  setPixel(x, y, type) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      this.grid[this.getIndex(x, y)] = type;
    }
  }

  drawBrush(centerX, centerY) {
    const r = this.brushSize;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const px = centerX + dx;
          const py = centerY + dy;
          this.setPixel(px, py, this.selectedElement);
        }
      }
    }
  }

  clearGrid() {
    this.grid.fill(ELEMENT_TYPES.EMPTY);
  }

  // The Powder Toy スタイル リアルタイム化学物理アップデート
  update() {
    if (this.speed === 0) return;

    this.nextGrid.set(this.grid);

    for (let y = this.rows - 1; y >= 0; y--) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);
        const type = this.grid[idx];

        if (type === ELEMENT_TYPES.EMPTY) continue;

        const spec = ELEMENT_SPECS[type];

        // 1. 溶岩 (Lava) ✕ 水 (Water) ➔ 玄武岩 (Stone) ＋ 水蒸気 (Steam) 反応
        if (type === ELEMENT_TYPES.LAVA) {
          const neighbors = [
            this.getIndex(x + 1, y), this.getIndex(x - 1, y),
            this.getIndex(x, y + 1), this.getIndex(x, y - 1)
          ];
          for (let nIdx of neighbors) {
            if (this.grid[nIdx] === ELEMENT_TYPES.WATER) {
              this.nextGrid[idx] = ELEMENT_TYPES.STONE;
              this.nextGrid[nIdx] = ELEMENT_TYPES.STEAM;
              if (window.cellAudioEngine) window.cellAudioEngine.playSE('combine');
              break;
            }
          }
        }

        // 2. 火 (Fire) ✕ 植物 (Plant) / 人間 (Human) ➔ 燃焼 ＋ 火の延焼
        if (type === ELEMENT_TYPES.FIRE) {
          if (Math.random() < 0.15) this.nextGrid[idx] = ELEMENT_TYPES.EMPTY; // 火の消滅
          const neighbors = [
            this.getIndex(x + 1, y), this.getIndex(x - 1, y),
            this.getIndex(x, y + 1), this.getIndex(x, y - 1)
          ];
          for (let nIdx of neighbors) {
            if (this.grid[nIdx] === ELEMENT_TYPES.PLANT || this.grid[nIdx] === ELEMENT_TYPES.HUMAN) {
              this.nextGrid[nIdx] = ELEMENT_TYPES.FIRE;
            }
          }
        }

        // 3. 酸 (Acid) ✕ 他の物質 ➔ 侵食溶解
        if (type === ELEMENT_TYPES.ACID) {
          const below = this.getIndex(x, y + 1);
          if (y < this.rows - 1 && this.grid[below] !== ELEMENT_TYPES.EMPTY && this.grid[below] !== ELEMENT_TYPES.ACID && this.grid[below] !== ELEMENT_TYPES.STONE) {
            this.nextGrid[idx] = ELEMENT_TYPES.EMPTY;
            this.nextGrid[below] = ELEMENT_TYPES.EMPTY;
          }
        }

        // 4. 細胞 (Cell) ✕ 水 (Water) ➔ 代謝・自動分裂
        if (type === ELEMENT_TYPES.CELL && Math.random() < 0.03) {
          const right = this.getIndex(x + 1, y);
          if (x < this.cols - 1 && this.grid[right] === ELEMENT_TYPES.WATER) {
            this.nextGrid[right] = ELEMENT_TYPES.CELL;
            if (window.cellAudioEngine) window.cellAudioEngine.playSE('cell_split');
          }
        }

        // 5. 重力・流体物理移動 (Falling Sand)
        if (spec.state === 'powder') {
          // 砂の落下の物理
          if (y < this.rows - 1) {
            const below = this.getIndex(x, y + 1);
            const belowL = this.getIndex(x - 1, y + 1);
            const belowR = this.getIndex(x + 1, y + 1);

            if (this.nextGrid[below] === ELEMENT_TYPES.EMPTY) {
              this.swap(idx, below);
            } else if (x > 0 && this.nextGrid[belowL] === ELEMENT_TYPES.EMPTY) {
              this.swap(idx, belowL);
            } else if (x < this.cols - 1 && this.nextGrid[belowR] === ELEMENT_TYPES.EMPTY) {
              this.swap(idx, belowR);
            }
          }
        } else if (spec.state === 'liquid') {
          // 液体の物理 (下 ➔ 横流動)
          if (y < this.rows - 1) {
            const below = this.getIndex(x, y + 1);
            const dir = Math.random() < 0.5 ? 1 : -1;
            const side = this.getIndex(x + dir, y);

            if (this.nextGrid[below] === ELEMENT_TYPES.EMPTY) {
              this.swap(idx, below);
            } else if (x + dir >= 0 && x + dir < this.cols && this.nextGrid[side] === ELEMENT_TYPES.EMPTY) {
              this.swap(idx, side);
            }
          }
        } else if (spec.state === 'gas') {
          // 気体の物理 (上昇)
          if (y > 0) {
            const above = this.getIndex(x, y - 1);
            if (this.nextGrid[above] === ELEMENT_TYPES.EMPTY) {
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
        const type = this.grid[gy * this.cols + gx];
        const spec = ELEMENT_SPECS[type] || ELEMENT_SPECS[0];

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
