/* PlantPlanet - app.js */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // キャンバスリサイズ
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // モジュール初期化
  const camera = new Camera(canvas);
  const plantEngine = new PlantEngine();
  const experimentEngine = new ExperimentEngine();

  // 地表のYワールド座標（草むらの上面）
  const GROUND_Y = 250;

  // ゲーム状態
  let selectedToolType = 'seed'; // 'seed' | 'tool'
  let currentSeed = PLANT_DATABASE[0]; // トマト or 杉
  let currentToolId = 'rain';
  let gameSpeed = 1.0;
  let isMouseDownLeft = false;

  // 初期配置（緑の豊かな大地に最初いくつかの植物を植えておく）
  plantEngine.plantSeed(PLANT_DATABASE[0], -150, GROUND_Y); // トマト
  plantEngine.plantSeed(PLANT_DATABASE[1], 0, GROUND_Y);    // 杉の木
  plantEngine.plantSeed(PLANT_DATABASE[2], 150, GROUND_Y);  // ヒマワリ

  // --- Web Audio サウンドシステム ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ctxA = getAudioContext();
      if (!ctxA) return;

      const osc = ctxA.createOscillator();
      const gain = ctxA.createGain();
      osc.connect(gain);
      gain.connect(ctxA.destination);

      const now = ctxA.currentTime;

      if (type === 'plant') { // ポコン（芽吹き）
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'water') { // サァー（水）
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      // オーディオ未許可無視
    }
  }

  // --- イベントハンドラー (左クリック操作) ---
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // 0 = 左クリック
      isMouseDownLeft = true;
      handleLeftClick(e.clientX, e.clientY, true);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      isMouseDownLeft = false;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isMouseDownLeft) {
      handleLeftClick(e.clientX, e.clientY, false);
    }
  });

  function handleLeftClick(screenX, screenY, isInitialClick) {
    const worldPos = camera.screenToWorld(screenX, screenY);

    if (selectedToolType === 'seed') {
      if (isInitialClick) {
        // 地表（GROUND_Y）付近に種を植える
        plantEngine.plantSeed(currentSeed, worldPos.x, GROUND_Y);
        playSound('plant');
      }
    } else if (selectedToolType === 'tool') {
      experimentEngine.triggerTool(currentToolId, worldPos.x, worldPos.y, plantEngine, isInitialClick);
      if (isInitialClick && (currentToolId === 'rain' || currentToolId === 'water_drop')) {
        playSound('water');
      }
    }
  }

  // --- UI イベント構築 ---
  const seedTriggerBtn = document.getElementById('seed-catalog-trigger');
  const modalOverlay = document.getElementById('seed-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const seedGrid = document.getElementById('seed-grid');
  const currentBadge = document.getElementById('current-selection-badge');

  // 種カタログモーダルの開閉
  seedTriggerBtn?.addEventListener('click', () => {
    modalOverlay.classList.add('open');
  });

  modalCloseBtn?.addEventListener('click', () => {
    modalOverlay.classList.remove('open');
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('open');
    }
  });

  // 種グリッド描画
  function renderSeedGrid(categoryFilter = 'all') {
    if (!seedGrid) return;
    seedGrid.innerHTML = '';

    const filtered = categoryFilter === 'all'
      ? PLANT_DATABASE
      : PLANT_DATABASE.filter(p => p.category === categoryFilter);

    filtered.forEach(plant => {
      const card = document.createElement('div');
      card.className = 'seed-card';
      card.innerHTML = `
        <div class="seed-icon">${plant.icon}</div>
        <div class="seed-info">
          <div class="seed-name">${plant.name}</div>
          <div class="seed-desc">${plant.desc}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        currentSeed = plant;
        selectedToolType = 'seed';
        updateSelectionBadge();
        modalOverlay.classList.remove('open');

        // ツールボタンのアクティブ解除
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
      });

      seedGrid.appendChild(card);
    });
  }
  renderSeedGrid('all');

  // カテゴリタブ切り替え
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSeedGrid(tab.getAttribute('data-cat'));
    });
  });

  // 実験ツールボタン
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentToolId = btn.getAttribute('data-tool');
      selectedToolType = 'tool';
      updateSelectionBadge();
    });
  });

  // 倍速ボタン
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameSpeed = parseFloat(btn.getAttribute('data-speed'));
    });
  });

  // インジケーターバッジの更新
  function updateSelectionBadge() {
    if (!currentBadge) return;
    if (selectedToolType === 'seed') {
      currentBadge.innerHTML = `<span>選択中:</span> ${currentSeed.icon} <strong>${currentSeed.name}</strong> (種植え)`;
    } else {
      const activeToolBtn = document.querySelector(`.tool-btn[data-tool="${currentToolId}"]`);
      const tooltip = activeToolBtn ? activeToolBtn.getAttribute('data-tooltip') : currentToolId;
      const icon = activeToolBtn ? activeToolBtn.textContent.trim() : '🧪';
      currentBadge.innerHTML = `<span>選択中:</span> ${icon} <strong>${tooltip}</strong>`;
    }
  }
  updateSelectionBadge();

  // --- 地球・環境描画 (緑の草むら ＆ 茶色の土) ---
  function drawEnvironment() {
    // 1. 空のグラデーション背景
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0284c7'); // 爽やかな青空
    skyGrad.addColorStop(0.6, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 雲の自動描画
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const cloudTime = Date.now() * 0.00005;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 400 + cloudTime * 20000) % (canvas.width + 600)) - 300;
      const cy = 80 + (i % 3) * 40;
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy - 10, 50, 0, Math.PI * 2);
      ctx.arc(cx + 70, cy, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 茶色の土層 (Soil / Dirt Layer)
    const groundScreen = camera.worldToScreen(0, GROUND_Y);
    const soilGrad = ctx.createLinearGradient(0, groundScreen.y, 0, canvas.height);
    soilGrad.addColorStop(0, '#5c3a21'); // 豊かな表土
    soilGrad.addColorStop(0.3, '#3e2723'); // 深層土
    soilGrad.addColorStop(1, '#1c1917');

    ctx.fillStyle = soilGrad;
    ctx.fillRect(0, groundScreen.y, canvas.width, canvas.height - groundScreen.y);

    // 4. 鮮やかな緑の草むら層 (Grass / Lawn Layer)
    const grassHeight = 16 * camera.zoom;
    const grassGrad = ctx.createLinearGradient(0, groundScreen.y - grassHeight, 0, groundScreen.y + 6);
    grassGrad.addColorStop(0, '#4ade80'); // 鮮やかな草色
    grassGrad.addColorStop(1, '#15803d');

    ctx.fillStyle = grassGrad;
    ctx.beginPath();
    ctx.rect(0, groundScreen.y - 4 * camera.zoom, canvas.width, 10 * camera.zoom);
    ctx.fill();

    // 草むらのブレード（葉っぱ）をそよがせる描画
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = Math.max(1, 2 * camera.zoom);
    const step = 8 * camera.zoom;
    const windOffset = Math.sin(Date.now() * 0.003) * 4 * camera.zoom;

    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += step) {
      ctx.moveTo(x, groundScreen.y);
      ctx.lineTo(x + windOffset + Math.sin(x * 0.1) * 3, groundScreen.y - grassHeight);
    }
    ctx.stroke();
  }

  // --- メイン アニメーションループ ---
  function loop() {
    // 物理・成長更新
    camera.update();
    plantEngine.update(gameSpeed);
    experimentEngine.update();

    // 画面クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 環境描画
    drawEnvironment();

    // 植物描画
    plantEngine.draw(ctx, camera);

    // パーティクル実験描画
    experimentEngine.draw(ctx, camera);

    requestAnimationFrame(loop);
  }

  loop();
});
