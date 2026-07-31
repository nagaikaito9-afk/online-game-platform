/* SlimeRPG - player.js */
class EarthSlime {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 24;
    this.height = 20;

    // ステータス
    this.name = 'アース';
    this.hp = 50;
    this.maxHp = 50;
    this.mp = 20;
    this.maxMp = 20;
    this.speedWalk = 2.2;
    this.speedRun = 4.2;

    // アニメーション用変数
    this.facing = 'down'; // 'down', 'up', 'left', 'right'
    this.squishX = 1.0;
    this.squishY = 1.0;
    this.animTimer = 0;
    this.actionPulse = 0; // Spaceキーアクションエフェクト

    // ドット絵ピクセルデータ定義 (16x16 スライムグラフィック)
    this.colorMain = '#4ade80'; // フレッシュグリーン
    this.colorHighlight = '#86efac';
    this.colorShadow = '#15803d';
    this.colorEye = '#0f172a';
  }

  update(input, map) {
    const move = input.getMovementVector();
    const isRunning = input.isRunning();
    const speed = isRunning ? this.speedRun : this.speedWalk;

    // 速度計算
    this.vx = move.dx * speed;
    this.vy = move.dy * speed;

    // 衝突判定付き位置移動
    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;

    if (!map.isColliding(nextX - this.width / 2, this.y - this.height / 2, this.width, this.height)) {
      this.x = nextX;
    }
    if (!map.isColliding(this.x - this.width / 2, nextY - this.height / 2, this.width, this.height)) {
      this.y = nextY;
    }

    // 向き判定
    if (Math.abs(move.dx) > Math.abs(move.dy)) {
      this.facing = move.dx > 0 ? 'right' : 'left';
    } else if (Math.abs(move.dy) > 0) {
      this.facing = move.dy > 0 ? 'down' : 'up';
    }

    // 移動中の変形アニメーション (Squish & Stretch)
    this.animTimer += (Math.abs(this.vx) + Math.abs(this.vy)) > 0 ? 0.15 : 0.05;
    const isMoving = Math.abs(this.vx) > 0 || Math.abs(this.vy) > 0;

    if (isMoving) {
      this.squishX = 1.0 + Math.sin(this.animTimer * 2) * (isRunning ? 0.25 : 0.12);
      this.squishY = 1.0 - Math.sin(this.animTimer * 2) * (isRunning ? 0.25 : 0.12);
    } else {
      // 待機時のぷにぷに呼吸
      this.squishX = 1.0 + Math.sin(this.animTimer) * 0.05;
      this.squishY = 1.0 - Math.sin(this.animTimer) * 0.05;
    }

    // Spaceキーアクション (ぷにっと跳ねる)
    if (input.isJustPressed('Space')) {
      this.actionPulse = 1.0;
    }

    if (this.actionPulse > 0) {
      this.actionPulse -= 0.08;
      if (this.actionPulse < 0) this.actionPulse = 0;
    }
  }

  draw(ctx, camera) {
    const screenPos = camera.worldToScreen(this.x, this.y);
    const zoom = camera.zoom;

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    // アクション時のおおきな躍動
    const pulseScale = 1.0 + Math.sin(this.actionPulse * Math.PI) * 0.4;
    const renderSquishX = this.squishX * pulseScale;
    const renderSquishY = this.squishY * pulseScale;

    ctx.scale(renderSquishX, renderSquishY);

    // アースの影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 8 * zoom, 12 * zoom, 5 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();

    // 高精細ドット風スライム本体の描き込み
    const radius = 12 * zoom;

    // スライム外枠 (ダークグリーン)
    ctx.fillStyle = this.colorShadow;
    ctx.beginPath();
    ctx.arc(0, -2 * zoom, radius + 2 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // スライムメインドーム
    ctx.fillStyle = this.colorMain;
    ctx.beginPath();
    ctx.arc(0, -2 * zoom, radius, 0, Math.PI * 2);
    ctx.fill();

    // つや・ハイライト (左上)
    ctx.fillStyle = this.colorHighlight;
    ctx.beginPath();
    ctx.arc(-4 * zoom, -7 * zoom, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // つぶらな黒目 (アースの可愛らしい目)
    ctx.fillStyle = this.colorEye;
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;

    if (this.facing === 'left') eyeOffsetX = -3 * zoom;
    if (this.facing === 'right') eyeOffsetX = 3 * zoom;
    if (this.facing === 'up') eyeOffsetY = -3 * zoom;
    if (this.facing === 'down') eyeOffsetY = 1 * zoom;

    // 左目
    ctx.beginPath();
    ctx.arc((-4 * zoom) + eyeOffsetX, (-2 * zoom) + eyeOffsetY, 2 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // 右目
    ctx.beginPath();
    ctx.arc((4 * zoom) + eyeOffsetX, (-2 * zoom) + eyeOffsetY, 2 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // 目の白い輝き
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc((-4.8 * zoom) + eyeOffsetX, (-2.8 * zoom) + eyeOffsetY, 0.7 * zoom, 0, Math.PI * 2);
    ctx.arc((3.2 * zoom) + eyeOffsetX, (-2.8 * zoom) + eyeOffsetY, 0.7 * zoom, 0, Math.PI * 2);
    ctx.fill();

    // Spaceキーアクション時の波紋リング
    if (this.actionPulse > 0) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2 * zoom;
      ctx.globalAlpha = this.actionPulse;
      ctx.beginPath();
      ctx.arc(0, 0, (20 + (1 - this.actionPulse) * 25) * zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
