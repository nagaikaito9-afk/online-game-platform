/* PlantPlanet - camera.js */
class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0; // ワールド座標におけるカメラの中心X
    this.y = 100; // ワールド座標におけるカメラの中心Y
    this.zoom = 1.0;
    this.targetZoom = 1.0;

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.cameraStartX = 0;
    this.cameraStartY = 0;
    this.hasMovedFar = false; // ドラッグ移動閾値超えフラグ

    this.initEvents();
  }

  initEvents() {
    // 右クリックコンテキストメニューを防止
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // マウスダウン（左クリックまたは右クリック長押しでパン準備）
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.hasMovedFar = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.cameraStartX = this.x;
      this.cameraStartY = this.y;
    });

    // マウス移動（一定距離動いたらカメラパン開始）
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dxScreen = e.clientX - this.dragStartX;
        const dyScreen = e.clientY - this.dragStartY;
        const dist = Math.hypot(dxScreen, dyScreen);

        if (dist > 4) {
          this.hasMovedFar = true;
          this.canvas.style.cursor = 'grabbing';
          const dxWorld = dxScreen / this.zoom;
          const dyWorld = dyScreen / this.zoom;
          this.x = this.cameraStartX - dxWorld;
          this.y = this.cameraStartY - dyWorld;
        }
      }
    });

    // マウスアップ
    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
      }
    });

    // ホイールでスムーズズーム
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      this.targetZoom = Math.max(0.35, Math.min(3.5, this.targetZoom * zoomFactor));
    }, { passive: false });
  }

  update() {
    // ズーム補間
    this.zoom += (this.targetZoom - this.zoom) * 0.18;
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

