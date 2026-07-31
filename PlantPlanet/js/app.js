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

  let selectedToolType = 'seed'; // 'seed' または 'tool'
  let currentSeed = PLANT_DATABASE[0];
  let currentToolId = 'rain';
  let gameSpeed = 1.0;
  let isMouseDownLeft = false;
  let lastToolTriggerTime = 0;

  // さりげない水面・土のシンプル波紋リング（文字なし）
  const cleanRipples = [];

  // 初期配置（美しい3本の植物からスタート）
  plantEngine.plantSeed(PLANT_DATABASE[0], -180, GROUND_Y);
  plantEngine.plantSeed(PLANT_DATABASE[1], 0, GROUND_Y);
  plantEngine.plantSeed(PLANT_DATABASE[2], 180, GROUND_Y);

  // --- Web Audio サウンド合成エンジン (優しく静かな自然音) ---
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

  function playSound(type) {
    try {
      const actx = getAudioContext();
      if (!actx) return;

      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);

      if (type === 'plant') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'water' || type === 'rain') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'sun' || type === 'fertilizer') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'lava' || type === 'acid') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'prune' || type === 'eraser') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'ui') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {}
  }

  // --- マウス/タッチ操作ハンドリング ---
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // 左クリック
      isMouseDownLeft = true;
      getAudioContext();
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
      const now = Date.now();
      if (now - lastToolTriggerTime > 80) { // 連続トリガーの間隔を80msに制限
        handleLeftClick(e.clientX, e.clientY, false);
        lastToolTriggerTime = now;
      }
    }
  });

  // タッチデバイス対応
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isMouseDownLeft = true;
      getAudioContext();
      const touch = e.touches[0];
      handleLeftClick(touch.clientX, touch.clientY, true);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (isMouseDownLeft && e.touches.length === 1) {
      const now = Date.now();
      if (now - lastToolTriggerTime > 80) {
        const touch = e.touches[0];
        handleLeftClick(touch.clientX, touch.clientY, false);
        lastToolTriggerTime = now;
      }
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    isMouseDownLeft = false;
  });

  function handleLeftClick(screenX, screenY, isInitialClick) {
    const worldPos = camera.screenToWorld(screenX, screenY);

    if (selectedToolType === 'seed') {
      // 種植えはクリックした瞬間だけ（ドラッグでの連続大量発生を防止）
      if (isInitialClick) {
        plantEngine.plantSeed(currentSeed, worldPos.x, GROUND_Y);
        playSound('plant');

        // シンプルで繊細な土の小さな波紋（テキスト・文字は一切表示しない）
        const groundScreen = camera.worldToScreen(worldPos.x, GROUND_Y);
        cleanRipples.push({
          x: groundScreen.x,
          y: groundScreen.y,
          radius: 4,
          maxRadius: 24,
          alpha: 0.8,
          color: '#86efac'
        });
      }
    } else if (selectedToolType === 'tool') {
      experimentEngine.triggerTool(currentToolId, worldPos.x, worldPos.y, plantEngine, isInitialClick);
      if (isInitialClick) {
        playSound(currentToolId);
      }
    }
  }

  // --- UI イベント & モーダル ---
  const seedTriggerBtn = document.getElementById('seed-catalog-trigger');
  const seedPlantModeBtn = document.getElementById('seed-plant-mode-btn');
  const modalOverlay = document.getElementById('seed-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const seedGrid = document.getElementById('seed-grid');
  const currentBadge = document.getElementById('current-selection-badge');

  seedTriggerBtn?.addEventListener('click', () => {
    playSound('ui');
    modalOverlay.classList.add('open');
  });

  seedPlantModeBtn?.addEventListener('click', () => {
    playSound('ui');
    selectedToolType = 'seed';
    updateSelectionUI();
  });

  modalCloseBtn?.addEventListener('click', () => {
    playSound('ui');
    modalOverlay.classList.remove('open');
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('open');
    }
  });

  function renderSeedGrid(categoryFilter = 'all') {
    if (!seedGrid) return;
    seedGrid.innerHTML = '';

    const filtered = categoryFilter === 'all'
      ? PLANT_DATABASE
      : PLANT_DATABASE.filter(p => p.category === categoryFilter);

    filtered.forEach(plant => {
      const card = document.createElement('div');
      card.className = `seed-card ${currentSeed.id === plant.id ? 'active' : ''}`;
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
        playSound('plant');
        currentSeed = plant;
        selectedToolType = 'seed';
        updateSelectionUI();
        modalOverlay.classList.remove('open');
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
      playSound('ui');
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSeedGrid(tab.getAttribute('data-cat'));
    });
  });

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('ui');
      currentToolId = btn.getAttribute('data-tool');
      selectedToolType = 'tool';
      updateSelectionUI();
    });
  });

  // 倍速ボタン
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('ui');
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameSpeed = parseFloat(btn.getAttribute('data-speed'));
    });
  });

  function updateSelectionUI() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      if (selectedToolType === 'tool' && btn.getAttribute('data-tool') === currentToolId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (seedPlantModeBtn) {
      if (selectedToolType === 'seed') {
        seedPlantModeBtn.classList.add('active');
      } else {
        seedPlantModeBtn.classList.remove('active');
      }
    }

    if (!currentBadge) return;
    if (selectedToolType === 'seed') {
      currentBadge.innerHTML = `<span>選択中:</span> ${currentSeed.icon} <strong>${currentSeed.name}</strong> (種植えモード)`;
    } else {
      const activeToolBtn = document.querySelector(`.tool-btn[data-tool="${currentToolId}"]`);
      const tooltip = activeToolBtn ? activeToolBtn.getAttribute('data-tooltip') : currentToolId;
      const icon = activeToolBtn ? activeToolBtn.textContent.trim() : '🧪';
      currentBadge.innerHTML = `<span>選択中:</span> ${icon} <strong>${tooltip}</strong>`;
    }
  }
  updateSelectionUI();

  // --- 環境描画 ---
  function drawEnvironment() {
    // 空
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.6, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 雲
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const cloudTime = Date.now() * 0.000003;
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

    // 草むらの葉
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

  // シンプルな土の波紋（文字なし）
  function drawRipples() {
    for (let i = cleanRipples.length - 1; i >= 0; i--) {
      const r = cleanRipples[i];
      r.radius += 0.8;
      r.alpha -= 0.04;

      if (r.alpha <= 0) {
        cleanRipples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = r.alpha;
      ctx.strokeStyle = r.color || '#86efac';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
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
    drawRipples();

    requestAnimationFrame(loop);
  }

  loop();
});


