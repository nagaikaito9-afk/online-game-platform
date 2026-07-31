/* SlimeRPG - input.js */
class InputHandler {
  constructor() {
    this.keys = {};
    this.keyJustPressed = {};

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      const key = e.key;

      // ゲームで使うキーのデフォルトスクロール行為を防止
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        if (document.activeElement.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }

      if (!this.keys[code]) {
        this.keyJustPressed[code] = true;
      }
      this.keys[code] = true;
      if (key) this.keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key;
      this.keys[code] = false;
      this.keyJustPressed[code] = false;
      if (key) this.keys[key] = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    if (this.keyJustPressed[code]) {
      this.keyJustPressed[code] = false;
      return true;
    }
    return false;
  }

  // 移動ベクトルの取得 (WASD または 矢印キー)
  getMovementVector() {
    let dx = 0;
    let dy = 0;

    if (this.isDown('KeyW') || this.isDown('ArrowUp')) dy -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) dy += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) dx -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx += 1;

    // 斜め移動の正規化
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    return { dx, dy };
  }

  // 走るキー (Shift)
  isRunning() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }
}
