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
  const player = new EarthSlime(20 * 32, 20 * 32); // マップ中央スタート
  const ui = new UIManager(player);

  let gameStarted = false;

  // --- Web Audio サウンドエンジン ---
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

      if (type === 'open' || type === 'select') {
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
      }
    } catch (e) {}
  }

  // --- 1.png タイトル画面 ＆ 名前入力の処理 ---
  const titleScreen = document.getElementById('title-screen');
  const btnNewGame = document.getElementById('btn-new-game');
  const btnContinue = document.getElementById('btn-continue');
  const nameModal = document.getElementById('name-modal');
  const nameInput = document.getElementById('player-name-input');
  const btnStartStory = document.getElementById('btn-start-story');

  btnNewGame?.addEventListener('click', () => {
    getAudioContext();
    playSE('select');
    nameModal?.classList.add('open');
  });

  btnContinue?.addEventListener('click', () => {
    getAudioContext();
    playSE('select');
    alert('セーブデータがありません。初めからスタートします！');
    nameModal?.classList.add('open');
  });

  btnStartStory?.addEventListener('click', () => {
    getAudioContext();
    playSE('select');

    const enteredName = nameInput ? nameInput.value : 'アース';
    ui.setPlayerName(enteredName);

    // タイトル画面と名前入力モーダルを非表示
    nameModal?.classList.remove('open');
    titleScreen?.classList.remove('active');
    document.getElementById('hud')?.classList.remove('hidden');

    gameStarted = true;

    // 2.png: ～プロローグ～ 会話イベント発動！
    ui.startDialogueSequence([
      { speaker: 'ナレーション', text: '昔々、人間と魔物という対立した種族がいました。', face: '📜' },
      { speaker: 'ナレーション', text: '魔物にはたくさんの種類があり、その中でも一番弱いのがスライムでした。', face: '🟢' },
      { speaker: 'ナレーション', text: 'スライムは人間にたやすく倒され、ほかの魔物にも見下され、もう我慢の限界でした。', face: '💧' },
      { speaker: ui.playerName, text: '「ボクたちが一番弱いなんて嫌だ！人間のいじめに立ち向かうんだ！」', face: '🔴' },
      { speaker: '緑スライム', text: '「ハハハ！見ろよアイツ！緑色じゃなくて真っ赤だし、一番弱いくせに何言ってるんだよ！」', face: '🟢' },
      { speaker: '長老スライム', text: '「そうだぞ赤スライムの' + ui.playerName + 'や...人間は強すぎる。お前には何もできやせん...」', face: '👴' },
      { speaker: ui.playerName, text: '「笑われたって関係ない！ボクは強くなってスライムのみんなを助けるんだ！」', face: '🔴' }
    ], () => {
      // 最初の試練の戦闘イベントテスト発動 (3.png FF3スタイル)
      ui.startDialogueSequence([
        { speaker: '村を襲う人間', text: '「おい！弱っちい赤スライムめ、俺様の経験値になれ！」', face: '👨' }
      ], () => {
        ui.startBattle({ name: '村を襲う人間', icon: '👨' });
      });
    });
  });

  // --- キー入力監視 ---
  window.addEventListener('keydown', (e) => {
    if (!gameStarted) return;
    getAudioContext();

    if (e.code === 'KeyE') {
      ui.toggleInventory();
    }
    if (e.code === 'Escape') {
      ui.toggleMenu();
    }
  });

  // --- メインゲームループ ---
  function loop() {
    if (gameStarted && !ui.inventoryOpen && !ui.menuOpen && !ui.dialogueActive && !ui.battleActive) {
      player.update(input, map);
    }

    camera.follow(player.x, player.y);
    ui.updateHUD();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    map.draw(ctx, camera);
    player.draw(ctx, camera);

    requestAnimationFrame(loop);
  }

  loop();
});
