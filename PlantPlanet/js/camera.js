/* PlantPlanet - camera.js */
class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0; // ワールド座標におけるカメラの中心X
    this.y = 100; // ワールド座標におけるカメラの中心Y (地表250が画角下中央に見えるベストポジ)
    this.zoom = 1.0;
    this.targetZoom = 1.0;

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.cameraStartX = 0;
    this.cameraStartY = 0;

    this.initEvents();
  }

  initEvents() {
    // 右クリックコンテキストメニューを防止
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // マウスダウン（右クリック長押しでパン開始）
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // 2 = 右クリック
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.cameraStartX = this.x;
        this.cameraStartY = this.y;
        this.canvas.style.cursor = 'grabbing';
      }
    });

    // マウス移動
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = (e.clientX - this.dragStartX) / this.zoom;
        const dy = (e.clientY - this.dragStartY) / this.zoom;
        this.x = this.cameraStartX - dx;
        this.y = this.cameraStartY - dy;
      }
    });

    // マウスアップ
    window.addEventListener('mouseup', (e) => {
      if (e.button === 2 && this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
      }
    });

    // ホイールでズーム
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.targetZoom = Math.max(0.4, Math.min(3.0, this.targetZoom * zoomFactor));
    }, { passive: false });
  }

  update() {
    // ズーム補間
    this.zoom += (this.targetZoom - this.zoom) * 0.15;
  }

  // ワールド座標 -> 画面（キャンバス）座標
  worldToScreen(wx, wy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const sx = (wx - this.x) * this.zoom + cx;
    const sy = (wy - this.y) * this.zoom + cy;
    return { x: sx, y: sy };
  }

  // 画面（キャンバス）座標 -> ワールド座標
  screenToWorld(sx, sy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const wx = (sx - cx) / this.zoom + this.x;
    const wy = (sy - cy) / this.zoom + this.y;
    return { x: wx, y: wy };
  }
}
