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

    // 2.png: ～プロローグ～ 完全な会話イベント発動！
    ui.startDialogueSequence([
      { speaker: 'ナレーター', text: '昔々、人間と魔物という対立した種族がいました。', face: '📜' },
      { speaker: 'ナレーター', text: '魔物にはたくさんの種類があり、その中でも一番弱いのがスライムでした。', face: '🟢' },
      { speaker: 'ナレーター', text: 'スライムは人間にたやすく倒され、ほかの魔物にも見下され、もう我慢の限界でした。', face: '💧' },
      { speaker: 'ナレーター', text: 'ですが何もできることはありませんでした。', face: '📜' },
      { speaker: 'ナレーター', text: 'その中で勇気を出して立ち上がったのが' + ui.playerName + 'です。', face: '🔴' },
      { speaker: 'ナレーター', text: 'ですがみんなは' + ui.playerName + 'を笑いました。', face: '🟢' },
      { speaker: 'ナレーター', text: 'なぜなら' + ui.playerName + 'は通常とは違い、赤い色でとても弱かったのです。', face: '🔴' },
      { speaker: ui.playerName, text: '「笑わないでよ！僕は本気なんだ！」', face: '🔴' },
      { speaker: 'スライム1', text: '「本気だと？」', face: '🟢' },
      { speaker: 'スライム2(おばあさん)', text: '「' + ui.playerName + '、人間はとても強いんだ。いかないでおくれ」', face: '👵' },
      { speaker: 'スライム3', text: '「じゃあ人間を一人でも倒して来いよ！そしたら認めてやる」', face: '🟢' },
      { speaker: ui.playerName + '(心の声)', text: '（みんなで僕をバカにして...）', face: '🔴' },
      { speaker: ui.playerName, text: '「もういいよ！僕は行くぞ！」', face: '🔴' },
      { speaker: 'スライム1', text: '「どうせ泣いて帰ってくるさ」', face: '🟢' },
      { speaker: 'スライム4', text: '「大丈夫かな...」', face: '🟢' },
      { speaker: 'ナレーター', text: ui.playerName + 'は森をでて後悔しました。だって人間なんて倒せるわけがないんだもの。', face: '🌲' },
      { speaker: ui.playerName + '(心の声)', text: '（まずはそこら辺の動物を吸収して経験値を集めてレベルアップしよう！）', face: '🔴' }
    ], () => {
      // プロローグ終了後、森の外フィールドで「動物を吸収してレベルアップ！」チュートリアル開始
      ui.showGameNotice('🎯 目的: フィールドの動物に近づいて [Space] キーで「吸収」してレベルアップしよう！');
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
    // Spaceキー: アクション音 ＆ 近くの動物を吸収！
    if (e.code === 'Space' && !ui.inventoryOpen && !ui.menuOpen && !ui.dialogueActive && !ui.battleActive) {
      playSE('action');

      // 近くの動物を吸収
      const absorbedAnimal = map.absorbNearbyAnimal(player.x, player.y, 50);
      if (absorbedAnimal) {
        player.exp = (player.exp || 0) + absorbedAnimal.exp;
        playSE('select');

        // レベルアップ判定 (例: 30expごとにLvUP)
        const nextLvExp = (player.level || 1) * 30;
        if (player.exp >= nextLvExp) {
          player.level = (player.level || 1) + 1;
          player.maxHp += 15;
          player.hp = player.maxHp;
          player.maxMp += 8;
          player.mp = player.maxMp;

          ui.showGameNotice(`✨ レベルアップ！ Lv.${player.level} になった！ (最大HP:${player.maxHp} HP全回復！)`, 5000);
        } else {
          ui.showGameNotice(`🍖 ${absorbedAnimal.name} を吸収した！ 経験値 +${absorbedAnimal.exp} (Total: ${player.exp}/${nextLvExp})`);
        }
      }
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
