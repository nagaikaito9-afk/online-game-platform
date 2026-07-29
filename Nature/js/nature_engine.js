/**
 * Nature - nature_engine.js
 * 大自然水循環 ＆ 雲形成 ＆ 降雨 ＆ 100倍速大気物理演算エンジン
 */

class NatureEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.scale = 3;
    this.cols = Math.floor(window.innerWidth / this.scale);
    this.rows = Math.floor((window.innerHeight - 124) / this.scale);

    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    const size = this.cols * this.rows;

    // 物質グリッド ID:
    // 0: 空白, 1: 水 (Water), 2: 土壌 (Soil), 3: 岩 (Rock), 4: 水蒸気 (Vapor)
    // 5: 雲 (Cloud), 6: 雨 (Rain), 7: 植物 (Plant), 8: 太陽熱線 (Sunlight)
    // 9: 寒気 (Cold), 10: 雪 (Snow)
    this.gridId = new Uint8Array(size);
    this.gridTemp = new Float32Array(size);   // 温度 (℃)
    this.gridMoist = new Float32Array(size);  // 水分量 (0.0 ～ 1.0)
    this.gridVy = new Float32Array(size);     // 垂直移動速度

    this.nextGridId = new Uint8Array(size);
    this.nextTemp = new Float32Array(size);
    this.nextMoist = new Float32Array(size);
    this.nextVy = new Float32Array(size);

    this.selectedTool = 1; // 初期: 水
    this.brushSize = 6;
    this.isMouseDown = false;
    this.timeScale = 1.0;
    this.tick = 0;

    // 統計・環境ステータス
    this.stats = {
      waterCount: 0,
      vaporCount: 0,
      cloudCount: 0,
      rainCount: 0,
      plantCount: 0
    };

    this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    this.initDefaultTerrain();

    window.addEventListener('resize', () => {
      this.cols = Math.floor(window.innerWidth / this.scale);
      this.rows = Math.floor((window.innerHeight - 124) / this.scale);
      this.canvas.width = this.cols * this.scale;
      this.canvas.height = this.rows * this.scale;
      this.imgData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
      this.initDefaultTerrain();
    });
  }

  // 初期自然地形の自動生成 (山、大地、海)
  initDefaultTerrain() {
    this.gridId.fill(0);
    this.gridTemp.fill(20);
    this.gridMoist.fill(0);
    this.gridVy.fill(0);

    const groundY = Math.floor(this.rows * 0.70);
    const seaX = Math.floor(this.cols * 0.60);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);

        // 山脈の斜面計算
        const mountainH = Math.sin(x * 0.03) * 15 + Math.cos(x * 0.08) * 8;
        const currentGround = groundY + Math.floor(mountainH);

        if (y >= currentGround) {
          if (x >= seaX) {
            // 海底・海プール
            if (y > currentGround + 8) {
              this.gridId[idx] = 3; // 岩床
            } else {
              this.gridId[idx] = 1; // 水
              this.gridMoist[idx] = 1.0;
            }
          } else {
            // 大地・土壌
            if (y === currentGround) {
              this.gridId[idx] = 7; // 最初は表面に少し草原
            } else {
              this.gridId[idx] = 2; // 土
              this.gridMoist[idx] = 0.3;
            }
          }
        }
      }
    }
  }

  getIndex(x, y) {
    return y * this.cols + x;
  }

  setPixel(x, y, typeId) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      const idx = this.getIndex(x, y);
      this.gridId[idx] = typeId;
      this.gridVy[idx] = 0;

      if (typeId === 1) { // 水
        this.gridTemp[idx] = 20;
        this.gridMoist[idx] = 1.0;
      } else if (typeId === 8) { // 太陽熱線
        this.gridTemp[idx] = 90;
      } else if (typeId === 9) { // 寒気
        this.gridTemp[idx] = -30;
      } else {
        this.gridTemp[idx] = 20;
      }
    }
  }

  drawBrush(centerX, centerY) {
    const r = this.brushSize;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const px = centerX + dx;
          const py = centerY + dy;
          this.setPixel(px, py, this.selectedTool);
        }
      }
    }
  }

  clearGrid() {
    this.gridId.fill(0);
    this.gridTemp.fill(20);
    this.gridMoist.fill(0);
    this.gridVy.fill(0);
  }

  // 100倍速対応 物理ステップ
  update() {
    if (this.timeScale <= 0) return;
    this.tick++;

    const steps = Math.max(1, Math.min(25, Math.floor(this.timeScale)));
    const dt = (0.15 * this.timeScale) / steps;

    for (let s = 0; s < steps; s++) {
      this.stepPhysics(dt);
    }
  }

  stepPhysics(dt) {
    this.nextGridId.set(this.gridId);
    this.nextTemp.set(this.gridTemp);
    this.nextMoist.set(this.gridMoist);
    this.nextVy.set(this.gridVy);

    // カウントリセット
    let wCount = 0, vCount = 0, cCount = 0, rCount = 0, pCount = 0;

    const topSkyLimit = Math.floor(this.rows * 0.35); // 雲が広がる上空高度

    for (let y = this.rows - 1; y >= 0; y--) {
      for (let x = 0; x < this.cols; x++) {
        const idx = this.getIndex(x, y);
        const type = this.gridId[idx];

        if (type === 0) continue;

        let temp = this.gridTemp[idx];
        let moist = this.gridMoist[idx];

        // 統計集計
        if (type === 1) wCount++;
        else if (type === 4) vCount++;
        else if (type === 5) cCount++;
        else if (type === 6 || type === 10) rCount++;
        else if (type === 7) pCount++;

        // 隣接インデックス
        const nAbove = (y > 0) ? this.getIndex(x, y - 1) : -1;
        const nBelow = (y < this.rows - 1) ? this.getIndex(x, y + 1) : -1;
        const nLeft = (x > 0) ? this.getIndex(x - 1, y) : -1;
        const nRight = (x < this.cols - 1) ? this.getIndex(x + 1, y) : -1;

        // ----------------------------------------------------
        // A. 太陽熱 ＆ 寒気の発散 (Sunlight / Cold Radiance)
        // ----------------------------------------------------
        if (type === 8) { // 太陽熱
          if (nBelow >= 0) this.nextTemp[nBelow] = Math.min(100, this.nextTemp[nBelow] + 15 * dt);
          if (Math.random() < 0.05) this.nextGridId[idx] = 0; // 徐々に減衰
          continue;
        }
        if (type === 9) { // 寒気
          if (nBelow >= 0) this.nextTemp[nBelow] = Math.max(-50, this.nextTemp[nBelow] - 15 * dt);
          if (Math.random() < 0.05) this.nextGridId[idx] = 0;
          continue;
        }

        // ----------------------------------------------------
        // B. 地球規模 水循環 (Water Cycle Dynamics)
        // ----------------------------------------------------

        // 1. 水 (Water: ID 1) ➔ 太陽熱で蒸発 (Evaporation) ➔ 水蒸気 (Vapor: ID 4)
        if (type === 1) {
          if (temp >= 40 || (y < topSkyLimit + 10 && Math.random() < 0.03)) {
            // 水が熱せられるか表面で蒸発して水蒸気へ相転移！
            this.nextGridId[idx] = 4; // 水蒸気へ
            this.nextTemp[idx] = 45;
            if (window.natureAudioEngine && Math.random() < 0.05) window.natureAudioEngine.playSE('sun_heat');
          } else {
            // 水圧流動 (Fluid Equalization)
            if (nBelow >= 0 && this.nextGridId[nBelow] === 0) {
              this.swap(idx, nBelow);
            } else {
              // 水平面への流動
              const dir = Math.random() < 0.5 ? 1 : -1;
              const sideIdx = (dir === 1) ? nRight : nLeft;
              if (sideIdx >= 0 && this.nextGridId[sideIdx] === 0) {
                this.swap(idx, sideIdx);
              }
            }
          }
          continue;
        }

        // 2. 水蒸気 (Vapor: ID 4) ➔ 上昇気流 (Updraft) ➔ 高空で凝結して雲 (Cloud: ID 5)
        if (type === 4) {
          // 上空へふんわり上昇
          if (y > 10 && nAbove >= 0 && this.nextGridId[nAbove] === 0) {
            this.swap(idx, nAbove);
          } else {
            // 左右へ漂い拡散
            const dir = Math.random() < 0.5 ? 1 : -1;
            const sideIdx = (dir === 1) ? nRight : nLeft;
            if (sideIdx >= 0 && this.nextGridId[sideIdx] === 0) {
              this.swap(idx, sideIdx);
            }
          }

          // 上空高度（Cold Zone）に達すると冷却されて「雲」へ凝結！
          if (y <= topSkyLimit || temp <= 10) {
            this.nextGridId[idx] = 5; // 雲 (Cloud)
            this.nextMoist[idx] = 0.5; // 初期雲水分
          }
          continue;
        }

        // 3. 雲 (Cloud: ID 5) ➔ 水分を蓄え「雨 (Rain: ID 6)」または「雪 (Snow: ID 10)」を降らせる
        if (type === 5) {
          // 周囲の水蒸気を吸い寄せて巨大雨雲へ成長
          if (nBelow >= 0 && this.gridId[nBelow] === 4) {
            this.nextGridId[nBelow] = 0;
            moist = Math.min(1.0, moist + 0.2);
            this.nextMoist[idx] = moist;
          }

          // 雲の風漂流
          const windDir = (Math.sin(this.tick * 0.02) > 0) ? 1 : -1;
          if (Math.random() < 0.4) {
            const sideIdx = (windDir === 1) ? nRight : nLeft;
            if (sideIdx >= 0 && this.nextGridId[sideIdx] === 0) {
              this.swap(idx, sideIdx);
            }
          }

          // 水分飽和または確率で雨/雪を降下させる (Precipitation)
          if (moist >= 0.7 || Math.random() < 0.08) {
            if (nBelow >= 0 && this.nextGridId[nBelow] === 0) {
              this.nextGridId[nBelow] = (temp < 0) ? 10 : 6; // 雪 または 雨
              this.nextMoist[idx] = Math.max(0.1, moist - 0.2);
              if (window.natureAudioEngine && Math.random() < 0.02) window.natureAudioEngine.playSE('thunder');
            }
          }
          continue;
        }

        // 4. 雨 (Rain: ID 6) / 雪 (Snow: ID 10) ➔ 高速で降下し地表を潤す
        if (type === 6 || type === 10) {
          if (nBelow >= 0) {
            if (this.nextGridId[nBelow] === 0) {
              this.swap(idx, nBelow);
            } else if (this.gridId[nBelow] === 2) { // 土壌に命中
              this.nextMoist[nBelow] = Math.min(1.0, this.nextMoist[nBelow] + 0.3);
              this.nextGridId[idx] = 0; // 土に吸い込まれて消滅
            } else if (this.gridId[nBelow] === 1) { // 水面に命中
              this.nextGridId[idx] = 0; // 水と同化
            } else {
              this.nextGridId[idx] = 1; // 蓄積して水プール化
            }
          }
          continue;
        }

        // 5. 土壌 (Soil: ID 2) ＆ 植物 (Plant: ID 7) ➔ 雨で潤い芽吹いて大自然森林化
        if (type === 2) {
          // 雨の水分を吸うと表面から草木（Plant: ID 7）が自律成長！
          if (moist >= 0.4 && nAbove >= 0 && this.nextGridId[nAbove] === 0 && Math.random() < 0.06) {
            this.nextGridId[nAbove] = 7; // 草木の芽吹き
            if (window.natureAudioEngine && Math.random() < 0.08) window.natureAudioEngine.playSE('growth');
          }
          continue;
        }

        if (type === 7) { // 植物・樹木
          // 水分を得て上や左右へ伸びる
          if (Math.random() < 0.02) {
            const growTarget = Math.random() < 0.7 ? nAbove : (Math.random() < 0.5 ? nLeft : nRight);
            if (growTarget >= 0 && this.nextGridId[growTarget] === 0) {
              this.nextGridId[growTarget] = 7;
            }
          }
          continue;
        }
      }
    }

    this.gridId.set(this.nextGridId);
    this.gridTemp.set(this.nextTemp);
    this.gridMoist.set(this.nextMoist);

    this.stats = {
      waterCount: wCount,
      vaporCount: vCount,
      cloudCount: cCount,
      rainCount: rCount,
      plantCount: pCount
    };
  }

  swap(i1, i2) {
    this.nextGridId[i2] = this.nextGridId[i1];
    this.nextGridId[i1] = 0;

    this.nextTemp[i2] = this.nextTemp[i1];
    this.nextTemp[i1] = 20;

    this.nextMoist[i2] = this.nextMoist[i1];
    this.nextMoist[i1] = 0;
  }

  // 大自然ビジュアルレンダラー
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
        const type = this.gridId[idx];
        const moist = this.gridMoist[idx];

        let r = 7, g = 10, b = 18, a = 255; // 大気の背景ネイビー

        if (type === 1) {
          // 水 (Water) - 綺麗なアクアブルー
          r = 14; g = 165; b = 233; a = 220;
        } else if (type === 2) {
          // 土 (Soil) - 湿り気で色が変わるリアル土色
          r = Math.floor(120 - moist * 40);
          g = Math.floor(80 - moist * 30);
          b = Math.floor(40 - moist * 20);
        } else if (type === 3) {
          // 岩石 (Rock)
          r = 71; g = 85; b = 105;
        } else if (type === 4) {
          // 水蒸気 (Vapor) - ふんわり光る白青の気体
          r = 186; g = 230; b = 253; a = 140;
        } else if (type === 5) {
          // 雲 (Cloud) - モコモコ美しい白〜雨雲グレー
          const cloudDarkness = Math.floor(255 - moist * 120);
          r = cloudDarkness; g = cloudDarkness; b = Math.min(255, cloudDarkness + 20); a = 230;
        } else if (type === 6) {
          // 雨 (Rain) - 半透明の滴り
          r = 56; g = 189; b = 248; a = 240;
        } else if (type === 10) {
          // 雪 (Snow)
          r = 241; g = 245; b = 249; a = 255;
        } else if (type === 7) {
          // 植物・森林 (Plant) - 鮮やかなエメラルドグリーン
          r = 34; g = 197; b = 94; a = 255;
        } else if (type === 8) {
          // 太陽光熱 (Heat)
          r = 251; g = 191; b = 36; a = 255;
        } else if (type === 9) {
          // 寒気 (Cold)
          r = 147; g = 197; b = 253; a = 200;
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

window.NatureEngine = NatureEngine;
