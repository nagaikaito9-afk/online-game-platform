/**
 * Cell Simulation - sandbox_engine.js
 * Falling Sand / The Powder Toy型 ピクセル物理シミュレーター
 * 高速 Cellular Automata ＆ リアルタイム熱力学 ＆ 化学反応 ＆ 生命代謝エンジン
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
    // グリッド物理データ構造
    this.gridId = new Uint16Array(size);
    this.gridVy = new Float32Array(size);
    this.gridVx = new Float32Array(size);
    this.gridTemp = new Float32Array(size);
    this.gridAirVy = new Float32Array(size); // 上昇気流・熱対流

    this.nextGridId = new Uint16Array(size);
    this.nextVy = new Float32Array(size);
    this.nextVx = new Float32Array(size);
    this.nextTemp = new Float32Array(size);
    this.nextAirVy = new Float32Array(size);

    this.selectedElementId = 1; // 初期: 水 (Water)
    this.brushSize = 5;         // 初期ペン径: 5px (1~30px)
    this.isMouseDown = false;
    this.timeScale = 1.0;

    // 環境物理フラグ
    this.gravityDirY = 1; // 1: 通常重力 (下), -1: 逆転重力 (上)
    this.windForce = 0;   // 0: 無風, -2: 左風, 2: 右風

    // バックバッファ ImageData
    this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    // 火花・爆発パーティクル
    this.sparks = [];

    // フレームカウント
    this.tick = 0;

    // データベースマッピング
    this.elementMap = {};
    if (window.ALL_ELEMENTS) {
      window.ALL_ELEMENTS.forEach(el => {
        this.elementMap[el.id] = el;
      });
    }

    this.initBoundaryFloor();

    // リサイズ対応
    window.addEventListener('resize', () => {
      this.cols = Math.floor(window.innerWidth / this.scale);
      this.rows = Math.floor((window.innerHeight - 120) / this.scale);
      this.canvas.width = this.cols * this.scale;
      this.canvas.height = this.rows * this.scale;
      this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
      this.initBoundaryFloor();
    });
  }

  // 床・境界線の初期化
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
      this.gridId[idx] = 21;  // 玄武岩
      this.gridId[idx2] = 21;
    }
  }

  getIndex(x, y) {
    return y * this.cols + x;
  }

  // ピクセル書き込み
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

  // ペン（ブラッシング）描画 (半径 1~30px)
  drawBrush(centerX, centerY) {
    const r = Math.max(1, Math.min(30, this.brushSize));
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

  // キャンバスクリア
  clearGrid() {
    this.initBoundaryFloor();
    this.sparks = [];
  }

  // 重力反転切り替え
  toggleGravity() {
    this.gravityDirY = this.gravityDirY === 1 ? -1 : 1;
    return this.gravityDirY;
  }

  // 風吹きセット (-5〜5)
  setWind(force) {
    this.windForce = force;
  }

  // Sparks (火花・爆発飛沫パーティクル)
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

  // 爆発処理
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
            if (eId === 21) continue; // 玄武岩床は破壊不可能

            this.nextAirVy[idx] = -8.0 * this.gravityDirY;

            if (distSq <= (radius * 0.5) * (radius * 0.5)) {
              this.gridId[idx] = 38; // 火 (Fire)
              this.gridTemp[idx] = 1200;
            } else if (Math.random() < 0.6) {
              this.gridId[idx] = 29; // 煙 (Smoke)
            }
          }
        }
      }
    }
  }

  // メイン物理フレーム更新
  update() {
    if (this.timeScale === 0) return; // 一時停止

    const loops = Math.max(1, Math.floor(this.timeScale));
    for (let step = 0; step < loops; step++) {
      this.stepPhysics();
    }

    // 火花アニメーション更新
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.15 * this.gravityDirY;
      s.life -= s.decay;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    this.tick++;
  }

  // 格子オートマトン (Cellular Automata) 単一ステップ演算
  stepPhysics() {
    this.nextGridId.set(this.gridId);
    this.nextVy.set(this.gridVy);
    this.nextVx.set(this.gridVx);
    this.nextTemp.set(this.gridTemp);
    this.nextAirVy.set(this.gridAirVy);

    // 順序による偏りを防ぐため、X走査方向を交互に入れ替え
    const xLeftToRight = (this.tick % 2 === 0);

    // 重力方向に応じた走査順（通常重力なら下から上へ）
    const startY = this.gravityDirY === 1 ? this.rows - 3 : 0;
    const endY = this.gravityDirY === 1 ? 0 : this.rows - 3;
    const stepY = this.gravityDirY === 1 ? -1 : 1;

    for (let y = startY; y !== endY; y += stepY) {
      for (let i = 0; i < this.cols; i++) {
        const x = xLeftToRight ? i : (this.cols - 1 - i);
        const idx = y * this.cols + x;
        const eId = this.gridId[idx];

        if (eId === 0) continue; // 空マス

        const spec = this.elementMap[eId] || { state: 'solid', density: 10, temp: 20 };
        let temp = this.gridTemp[idx];

        // 1. 風の影響（気体・粉末・流体に水平加速度）
        if (this.windForce !== 0 && (spec.state === 'gas' || spec.state === 'powder' || spec.state === 'liquid')) {
          if (Math.random() < 0.4) {
            const windTargetX = x + (this.windForce > 0 ? 1 : -1);
            if (windTargetX >= 0 && windTargetX < this.cols) {
              const targetIdx = y * this.cols + windTargetX;
              if (this.nextGridId[targetIdx] === 0) {
                this.swapCells(idx, targetIdx);
                continue;
              }
            }
          }
        }

        // 2. 特殊化学・生命インタラクション
        // ----------------------------------------------------
        // (A) 溶岩 (2) + 水 (1) ➔ 玄武岩 (21) + 水蒸気 (28)
        if (eId === 2 || eId === 1) {
          const neighborIndices = [
            (y - 1) * this.cols + x, (y + 1) * this.cols + x,
            y * this.cols + (x - 1), y * this.cols + (x + 1)
          ];
          for (const nIdx of neighborIndices) {
            if (nIdx >= 0 && nIdx < this.cols * (this.rows - 2)) {
              const nId = this.gridId[nIdx];
              if ((eId === 2 && nId === 1) || (eId === 1 && nId === 2)) {
                // 水 ✕ 溶岩 反応！
                this.nextGridId[idx] = 21; // 玄武岩化
                this.nextTemp[idx] = 400;
                this.nextGridId[nIdx] = 28; // 水蒸気化
                this.nextTemp[nIdx] = 180;
                this.nextAirVy[nIdx] = -6.0 * this.gravityDirY;
                this.addSparks(x, y, 3, [255, 255, 200]);
                if (window.cellAudioEngine && Math.random() < 0.1) {
                  window.cellAudioEngine.playSE('hiss');
                }
                break;
              }
            }
          }
        }

        // (B) 水 (1) + 生きている細胞 (33) ➔ 細胞分裂・自動成長
        if (eId === 33) {
          const emptyNeighbors = [];
          const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows - 2) {
              const nIdx = ny * this.cols + nx;
              if (this.gridId[nIdx] === 1) { // 水を吸収
                emptyNeighbors.push(nIdx);
              }
            }
          }
          if (emptyNeighbors.length > 0 && Math.random() < 0.15) {
            const targetIdx = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
            this.nextGridId[targetIdx] = 33; // 細胞増殖！
            this.nextTemp[targetIdx] = 36.5;
            if (window.cellAudioEngine && Math.random() < 0.05) {
              window.cellAudioEngine.playSE('synth');
            }
          }
        }

        // (C) 火 (38) / 溶岩 (2) / 酸 (4) + 人間組織 (34) ➔ 熱傷・溶解・変成
        if (eId === 34) {
          const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows - 2) {
              const nIdx = ny * this.cols + nx;
              const nId = this.gridId[nIdx];
              if (nId === 38 || nId === 2) { // 火または溶岩で焼ける
                this.nextGridId[idx] = 38; // 発火
                this.nextTemp[idx] = 800;
                this.addSparks(x, y, 2, [255, 100, 20]);
                break;
              } else if (nId === 4) { // 酸で溶解
                this.nextGridId[idx] = 29; // 煙（溶解ガス）
                this.nextGridId[nIdx] = 0; // 酸も消費
                this.nextTemp[idx] = 50;
                this.addSparks(x, y, 2, [180, 255, 0]);
                break;
              }
            }
          }
        }

        // (D) 火 (38) + 植物/木材 (36, 27) ➔ 燃焼 ＆ 灰 (15) ＋ 煙 (29)
        if (eId === 38) {
          const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows - 2) {
              const nIdx = ny * this.cols + nx;
              const nId = this.gridId[nIdx];
              if (nId === 36 || nId === 27 || nId === 14) { // 可燃物
                if (nId === 14) { // 火薬
                  this.triggerExplosion(nx, ny, 12);
                } else {
                  this.nextGridId[nIdx] = 38; // 発火
                  this.nextTemp[nIdx] = 600;
                }
              }
            }
          }
          // 火自体の寿命
          if (Math.random() < 0.2) {
            this.nextGridId[idx] = Math.random() < 0.5 ? 29 : 0; // 煙か消滅
          }
        }

        // (E) 酸 (4) + 鉄 (22) / 石 (21) ➔ 侵食溶解
        if (eId === 4) {
          const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows - 2) {
              const nIdx = ny * this.cols + nx;
              const nId = this.gridId[nIdx];
              if (nId === 22 || (nId === 21 && Math.random() < 0.1)) {
                this.nextGridId[nIdx] = 29; // 溶けて煙化
                this.nextGridId[idx] = 0;   // 酸消滅
                break;
              }
            }
          }
        }

        // 3. 状態別 物理移動アルゴリズム
        // ----------------------------------------------------
        const state = spec.state;
        const gDir = this.gravityDirY;

        // (A) 粉末 (Powder: Sand, Ash, Gunpowder)
        if (state === 'powder') {
          const targetY = y + gDir;
          if (targetY >= 0 && targetY < this.rows - 2) {
            const downIdx = targetY * this.cols + x;
            if (this.canMoveOrDisplace(idx, downIdx)) {
              this.swapCells(idx, downIdx);
            } else {
              // 斜め下スライド
              const dir = Math.random() < 0.5 ? 1 : -1;
              const diag1X = x + dir;
              const diag2X = x - dir;
              let moved = false;

              if (diag1X >= 0 && diag1X < this.cols) {
                const diag1Idx = targetY * this.cols + diag1X;
                if (this.canMoveOrDisplace(idx, diag1Idx)) {
                  this.swapCells(idx, diag1Idx);
                  moved = true;
                }
              }
              if (!moved && diag2X >= 0 && diag2X < this.cols) {
                const diag2Idx = targetY * this.cols + diag2X;
                if (this.canMoveOrDisplace(idx, diag2Idx)) {
                  this.swapCells(idx, diag2Idx);
                }
              }
            }
          }
        }

        // (B) 液体 (Liquid: Water, Lava, Acid, Oil, Mercury)
        else if (state === 'liquid') {
          const targetY = y + gDir;
          let moved = false;
          if (targetY >= 0 && targetY < this.rows - 2) {
            const downIdx = targetY * this.cols + x;
            if (this.canMoveOrDisplace(idx, downIdx)) {
              this.swapCells(idx, downIdx);
              moved = true;
            } else {
              // 斜め下
              const dir = Math.random() < 0.5 ? 1 : -1;
              const diag1X = x + dir;
              const diag2X = x - dir;

              if (diag1X >= 0 && diag1X < this.cols) {
                const diag1Idx = targetY * this.cols + diag1X;
                if (this.canMoveOrDisplace(idx, diag1Idx)) {
                  this.swapCells(idx, diag1Idx);
                  moved = true;
                }
              }
              if (!moved && diag2X >= 0 && diag2X < this.cols) {
                const diag2Idx = targetY * this.cols + diag2X;
                if (this.canMoveOrDisplace(idx, diag2Idx)) {
                  this.swapCells(idx, diag2Idx);
                  moved = true;
                }
              }
            }
          }

          // 水平水圧流動 (Dispersion)
          if (!moved) {
            const disp = spec.dispersion || 5;
            const dir = Math.random() < 0.5 ? 1 : -1;
            for (let d = 1; d <= disp; d++) {
              const sideX = x + (dir * d);
              if (sideX >= 0 && sideX < this.cols) {
                const sideIdx = y * this.cols + sideX;
                if (this.canMoveOrDisplace(idx, sideIdx)) {
                  this.swapCells(idx, sideIdx);
                  break;
                }
              }
            }
          }
        }

        // (C) 気体 (Gas: Steam, Smoke, Methane)
        else if (state === 'gas') {
          const riseY = y - gDir; // 上昇（重力の逆方向）
          if (riseY >= 0 && riseY < this.rows - 2) {
            const upIdx = riseY * this.cols + x;
            if (this.nextGridId[upIdx] === 0 || this.isLighterThan(idx, upIdx)) {
              this.swapCells(idx, upIdx);
            } else {
              // 斜め上上昇
              const dir = Math.random() < 0.5 ? 1 : -1;
              const diagX = x + dir;
              if (diagX >= 0 && diagX < this.cols) {
                const diagIdx = riseY * this.cols + diagX;
                if (this.nextGridId[diagIdx] === 0) {
                  this.swapCells(idx, diagIdx);
                }
              }
            }
          }
        }
      }
    }

    // シングルバッファ反映
    this.gridId.set(this.nextGridId);
    this.gridVy.set(this.nextVy);
    this.gridVx.set(this.nextVx);
    this.gridTemp.set(this.nextTemp);
    this.gridAirVy.set(this.nextAirVy);
  }

  // セル置換・浮力判定
  canMoveOrDisplace(srcIdx, dstIdx) {
    const dstId = this.nextGridId[dstIdx];
    if (dstId === 0) return true; // 空マス
    const srcDensity = (this.elementMap[this.gridId[srcIdx]] || {}).density || 10;
    const dstDensity = (this.elementMap[dstId] || {}).density || 10;
    return srcDensity > dstDensity; // 密度差による置換（重い粒子が沈む）
  }

  isLighterThan(srcIdx, dstIdx) {
    const dstId = this.nextGridId[dstIdx];
    if (dstId === 0) return true;
    const srcDensity = (this.elementMap[this.gridId[srcIdx]] || {}).density || 10;
    const dstDensity = (this.elementMap[dstId] || {}).density || 10;
    return srcDensity < dstDensity;
  }

  swapCells(idxA, idxB) {
    const tempId = this.nextGridId[idxA];
    const tempT = this.nextTemp[idxA];

    this.nextGridId[idxA] = this.nextGridId[idxB];
    this.nextTemp[idxA] = this.nextTemp[idxB];

    this.nextGridId[idxB] = tempId;
    this.nextTemp[idxB] = tempT;
  }

  // 描画レンダリング (ImageData へ直接一括ピクセル色塗り)
  render() {
    const data = this.imgData.data;
    const w = this.canvas.width;
    const scale = this.scale;

    data.fill(0); // 背景リセット (暗黒空間)

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = y * this.cols + x;
        const eId = this.gridId[idx];

        if (eId === 0) continue;

        const spec = this.elementMap[eId] || { color: [200, 200, 200, 255] };
        const [r, g, b, a] = spec.color;

        // ピクセル拡大描画
        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            const pixelX = x * scale + px;
            const pixelY = y * scale + py;
            const pIdx = (pixelY * w + pixelX) * 4;

            data[pIdx] = r;
            data[pIdx + 1] = g;
            data[pIdx + 2] = b;
            data[pIdx + 3] = a !== undefined ? a : 255;
          }
        }
      }
    }

    this.ctx.putImageData(this.imgData, 0, 0);

    // 火花・粒子エフェクト描画
    if (this.sparks.length > 0) {
      this.ctx.save();
      for (const s of this.sparks) {
        this.ctx.fillStyle = `rgba(${s.color[0]}, ${s.color[1]}, ${s.color[2]}, ${s.life})`;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }
}

window.SandboxEngine = SandboxEngine;
