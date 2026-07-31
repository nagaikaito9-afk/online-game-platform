/* SlimeRPG - app.js */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const input = new InputHandler();
  const camera = new RPGCamera(canvas);
  const map = new RPGMap();
  const player = new EarthSlime(20 * 32, 20 * 32); // マップ中央からスタート
  const ui = new UIManager(player);

  // --- Web Audio サウンドエンジン (レトロゲーム効果音) ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSE(type) {
    try {
      const actx = getAudioContext();
      if (!actx) return;

      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);

      if (type === 'open') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'close') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'action') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {}
  }

  // --- キー入力とモーダル切替の監視 ---
  window.addEventListener('keydown', (e) => {
    getAudioContext();

    // Eキー: 持ち物 (インベントリ)
    if (e.code === 'KeyE') {
      if (ui.inventoryOpen) {
        ui.closeInventory();
        playSE('close');
      } else {
        ui.openInventory();
        playSE('open');
      }
    }

    // Escキー: システムメニュー
    if (e.code === 'Escape') {
      if (ui.menuOpen || ui.inventoryOpen) {
        ui.closeMenu();
        ui.closeInventory();
        playSE('close');
      } else {
        ui.openMenu();
        playSE('open');
      }
    }

    // Spaceキー: アクション音
    if (e.code === 'Space' && !ui.inventoryOpen && !ui.menuOpen) {
      playSE('action');
    }
  });

  // --- メインゲームループ ---
  function loop() {
    // モーダルが開いていない時だけプレイヤーを更新
    if (!ui.inventoryOpen && !ui.menuOpen) {
      player.update(input, map);
    }

    // カメラの追従
    camera.follow(player.x, player.y);

    // HUDの更新
    ui.updateHUD();

    // 描画処理
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    map.draw(ctx, camera);
    player.draw(ctx, camera);

    requestAnimationFrame(loop);
  }

  loop();
});
