/* SlimeRPG - map.js */
class RPGMap {
  constructor() {
    this.tileSize = 32;
    this.cols = 40;
    this.rows = 40;
    this.tiles = [];
    this.decorations = [];

    this.generateMap();
  }

  generateMap() {
    // 0: 草地, 1: レンガ道, 2: 水辺, 3: 木(障害物), 4: 花
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        // 外枠は木の障害物壁
        if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1) {
          row.push(3);
        } else if (r >= 18 && r <= 22 && c >= 5 && c <= 35) {
          row.push(1); // レンガの小道
        } else if (c >= 18 && c <= 22 && r >= 5 && r <= 35) {
          row.push(1);
        } else if (r >= 8 && r <= 12 && c >= 8 && c <= 12) {
          row.push(2); // 小さな池
        } else if (Math.random() < 0.08) {
          row.push(3); // 点在する木
        } else if (Math.random() < 0.12) {
          row.push(4); // お花畑
        } else {
          row.push(0); // 草地
        }
      }
      this.tiles.push(row);
    }
  }

  // 衝突判定 (木や水辺、画面外)
  isColliding(x, y, width, height) {
    const startCol = Math.floor(x / this.tileSize);
    const endCol = Math.floor((x + width) / this.tileSize);
    const startRow = Math.floor(y / this.tileSize);
    const endRow = Math.floor((y + height) / this.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
          return true;
        }
        const tile = this.tiles[r][c];
        if (tile === 3 || tile === 2) { // 木 または 水辺は進入不可
          return true;
        }
      }
    }
    return false;
  }

  draw(ctx, camera) {
    const zoom = camera.zoom;
    const ts = this.tileSize * zoom;

    // 画面内に見えるタイルの範囲を計算 (パフォーマンス最適化)
    const screenLeftWorld = camera.x - (ctx.canvas.width / 2) / camera.zoom;
    const screenRightWorld = camera.x + (ctx.canvas.width / 2) / camera.zoom;
    const screenTopWorld = camera.y - (ctx.canvas.height / 2) / camera.zoom;
    const screenBottomWorld = camera.y + (ctx.canvas.height / 2) / camera.zoom;

    const startCol = Math.max(0, Math.floor(screenLeftWorld / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil(screenRightWorld / this.tileSize));
    const startRow = Math.max(0, Math.floor(screenTopWorld / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.ceil(screenBottomWorld / this.tileSize));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tileType = this.tiles[r][c];
        const worldX = c * this.tileSize;
        const worldY = r * this.tileSize;
        const screenPos = camera.worldToScreen(worldX, worldY);

        // タイルタイプ別描き込み
        if (tileType === 0) { // 草地
          ctx.fillStyle = '#1e3a1e';
          ctx.fillRect(screenPos.x, screenPos.y, ts + 0.5, ts + 0.5);

          // 草のディテール
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(screenPos.x + 4 * zoom, screenPos.y + 6 * zoom, 2 * zoom, 4 * zoom);
          ctx.fillRect(screenPos.x + 18 * zoom, screenPos.y + 20 * zoom, 2 * zoom, 4 * zoom);
        } else if (tileType === 1) { // レンガ小道
          ctx.fillStyle = '#78350f';
          ctx.fillRect(screenPos.x, screenPos.y, ts + 0.5, ts + 0.5);
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1 * zoom;
          ctx.strokeRect(screenPos.x, screenPos.y, ts, ts);
        } else if (tileType === 2) { // 水辺
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(screenPos.x, screenPos.y, ts + 0.5, ts + 0.5);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(screenPos.x + (Math.sin(Date.now() * 0.003 + c) * 4 + 8) * zoom, screenPos.y + 12 * zoom, 8 * zoom, 2 * zoom);
        } else if (tileType === 3) { // 木
          // 地面
          ctx.fillStyle = '#1e3a1e';
          ctx.fillRect(screenPos.x, screenPos.y, ts + 0.5, ts + 0.5);

          // 幹
          ctx.fillStyle = '#5c3a21';
          ctx.fillRect(screenPos.x + 12 * zoom, screenPos.y + 16 * zoom, 8 * zoom, 16 * zoom);

          // 葉のドーム
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(screenPos.x + 16 * zoom, screenPos.y + 12 * zoom, 14 * zoom, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(screenPos.x + 13 * zoom, screenPos.y + 9 * zoom, 8 * zoom, 0, Math.PI * 2);
          ctx.fill();
        } else if (tileType === 4) { // お花畑
          ctx.fillStyle = '#1e3a1e';
          ctx.fillRect(screenPos.x, screenPos.y, ts + 0.5, ts + 0.5);

          // 花弁
          ctx.fillStyle = (c + r) % 2 === 0 ? '#ff4081' : '#ffeb3b';
          ctx.beginPath();
          ctx.arc(screenPos.x + 10 * zoom, screenPos.y + 14 * zoom, 3 * zoom, 0, Math.PI * 2);
          ctx.arc(screenPos.x + 22 * zoom, screenPos.y + 20 * zoom, 3 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}
