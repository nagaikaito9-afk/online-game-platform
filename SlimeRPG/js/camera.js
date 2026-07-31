/* SlimeRPG - camera.js */
class RPGCamera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 2.5; // ドット絵に最適な拡大ズーム比
  }

  follow(targetX, targetY) {
    // ターゲット位置へスムーズ補間追従 (Lerp)
    const targetCamX = targetX;
    const targetCamY = targetY;

    this.x += (targetCamX - this.x) * 0.12;
    this.y += (targetCamY - this.y) * 0.12;
  }

  worldToScreen(wx, wy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const sx = (wx - this.x) * this.zoom + cx;
    const sy = (wy - this.y) * this.zoom + cy;
    return { x: sx, y: sy };
  }

  screenToWorld(sx, sy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const wx = (sx - cx) / this.zoom + this.x;
    const wy = (sy - cy) / this.zoom + this.y;
    return { x: wx, y: wy };
  }
}
