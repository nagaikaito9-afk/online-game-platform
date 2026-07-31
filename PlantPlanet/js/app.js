/* PlantPlanet - app.js */
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

  const camera = new Camera(canvas);
  const plantEngine = new PlantEngine();
  const experimentEngine = new ExperimentEngine();

  const GROUND_Y = 250; // 草むら地表

  let selectedToolType = 'seed';
  let currentSeed = PLANT_DATABASE[0];
  let currentToolId = 'rain';
  let gameSpeed = 1.0;
  let isMouseDownLeft = false;

  // 初期配置（最初いくつかの植物を植える）
  plantEngine.plantSeed(PLANT_DATABASE[0], -150, GROUND_Y);
  plantEngine.plantSeed(PLANT_DATABASE[1], 0, GROUND_Y);
  plantEngine.plantSeed(PLANT_DATABASE[2], 150, GROUND_Y);

  // --- Web Audio サウンド ---
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

      if (type === 'plant') {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {}
  }

  // --- 左クリック操作 ---
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
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
        plantEngine.plantSeed(currentSeed, worldPos.x, GROUND_Y);
        playSound('plant');
      }
    } else if (selectedToolType === 'tool') {
      experimentEngine.triggerTool(currentToolId, worldPos.x, worldPos.y, plantEngine, isInitialClick);
    }
  }

  // --- UI イベント ---
  const seedTriggerBtn = document.getElementById('seed-catalog-trigger');
  const modalOverlay = document.getElementById('seed-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const seedGrid = document.getElementById('seed-grid');
  const currentBadge = document.getElementById('current-selection-badge');

  seedTriggerBtn?.addEventListener('click', () => modalOverlay.classList.add('open'));
  modalCloseBtn?.addEventListener('click', () => modalOverlay.classList.remove('open'));
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('open');
  });

  function renderSeedGrid(categoryFilter = 'all') {
    if (!seedGrid) return;
    seedGrid.innerHTML = '';

    const filtered = categoryFilter === 'all'
      ? PLANT_DATABASE
      : PLANT_DATABASE.filter(p => p.category === categoryFilter);

    filtered.forEach(plant => {
      const card = document.createElement('div');
      card.className = 'seed-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.innerHTML = `
        <div class="seed-icon">${plant.icon}</div>
        <div class="seed-info">
          <div class="seed-name">${plant.name}</div>
          <div class="seed-desc">${plant.desc}</div>
        </div>
      `;

      const selectPlant = () => {
        currentSeed = plant;
        selectedToolType = 'seed';
        updateSelectionBadge();
        modalOverlay.classList.remove('open');
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
      };

      card.addEventListener('click', selectPlant);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectPlant();
        }
      });

      seedGrid.appendChild(card);
    });
  }
  renderSeedGrid('all');

  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSeedGrid(tab.getAttribute('data-cat'));
    });
  });

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

  // --- 環境描画 (空・ゆったり雲・緑の草むら・茶色の土) ---
  function drawEnvironment() {
    // 空
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.6, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 雲（スピードを従来比 1/20 に超低速化）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const cloudTime = Date.now() * 0.000003; // 超スロー
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 450 + cloudTime * 10000) % (canvas.width + 600)) - 300;
      const cy = 70 + (i % 3) * 35;
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy - 8, 45, 0, Math.PI * 2);
      ctx.arc(cx + 60, cy, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    // 茶色の土層
    const groundScreen = camera.worldToScreen(0, GROUND_Y);
    const soilGrad = ctx.createLinearGradient(0, groundScreen.y, 0, canvas.height);
    soilGrad.addColorStop(0, '#5c3a21');
    soilGrad.addColorStop(0.3, '#3e2723');
    soilGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(0, groundScreen.y, canvas.width, canvas.height - groundScreen.y);

    // 緑色の草むら層
    const grassHeight = 14 * camera.zoom;
    const grassGrad = ctx.createLinearGradient(0, groundScreen.y - grassHeight, 0, groundScreen.y + 4);
    grassGrad.addColorStop(0, '#4ade80');
    grassGrad.addColorStop(1, '#15803d');

    ctx.fillStyle = grassGrad;
    ctx.beginPath();
    ctx.rect(0, groundScreen.y - 3 * camera.zoom, canvas.width, 8 * camera.zoom);
    ctx.fill();

    // 静的・安定したきれいな草むらの葉
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = Math.max(1, 2 * camera.zoom);
    const step = 7 * camera.zoom;

    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += step) {
      ctx.moveTo(x, groundScreen.y);
      ctx.lineTo(x + Math.sin(x * 0.15) * 2, groundScreen.y - grassHeight);
    }
    ctx.stroke();
  }

  // --- メインアニメーションループ ---
  function loop() {
    camera.update();
    plantEngine.update(gameSpeed);
    experimentEngine.update();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawEnvironment();
    plantEngine.draw(ctx, camera);
    experimentEngine.draw(ctx, camera);

    requestAnimationFrame(loop);
  }

  loop();
});
