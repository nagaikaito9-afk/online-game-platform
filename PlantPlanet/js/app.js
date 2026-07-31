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

  let mouseScreenX = -1000;
  let mouseScreenY = -1000;
  let isMouseOverCanvas = false;

  // 初期配置（美しい3本の植物からスタート）
  plantEngine.plantSeed(PLANT_DATABASE[0], -180, GROUND_Y);
  plantEngine.plantSeed(PLANT_DATABASE[1], 0, GROUND_Y);
  plantEngine.plantSeed(PLANT_DATABASE[2], 180, GROUND_Y);

  // --- Web Audio サウンド合成エンジン ---
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
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'water' || type === 'rain') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'sun' || type === 'fertilizer') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'lava' || type === 'acid') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'prune' || type === 'eraser') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.linearRampToValueAtTime(280, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'ui') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {}
  }

  // --- マウス/タッチ操作ハンドリング ---
  canvas.addEventListener('mouseenter', () => {
    isMouseOverCanvas = true;
  });

  canvas.addEventListener('mouseleave', () => {
    isMouseOverCanvas = false;
    mouseScreenX = -1000;
    mouseScreenY = -1000;
  });

  window.addEventListener('mousemove', (e) => {
    mouseScreenX = e.clientX;
    mouseScreenY = e.clientY;
  });

  // クリック（ドラッグパン移動でなければツール/種植え発動）
  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0 && !camera.hasMovedFar) {
      getAudioContext();
      handleActionClick(e.clientX, e.clientY);
    }
  });

  // タッチデバイス対応
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      getAudioContext();
      const touch = e.touches[0];
      mouseScreenX = touch.clientX;
      mouseScreenY = touch.clientY;
      isMouseOverCanvas = true;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!camera.hasMovedFar && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      handleActionClick(touch.clientX, touch.clientY);
    }
  });

  function handleActionClick(screenX, screenY) {
    const worldPos = camera.screenToWorld(screenX, screenY);

    if (selectedToolType === 'seed') {
      plantEngine.plantSeed(currentSeed, worldPos.x, GROUND_Y);
      playSound('plant');
    } else if (selectedToolType === 'tool') {
      experimentEngine.triggerTool(currentToolId, worldPos.x, worldPos.y, plantEngine, true);
      playSound(currentToolId);
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

  // --- カーソル追従ガイド描画（超クリアな操作感） ---
  function drawCursorGuide() {
    if (!isMouseOverCanvas || mouseScreenX < 0 || mouseScreenY < 0) return;

    const worldPos = camera.screenToWorld(mouseScreenX, mouseScreenY);
    const groundScreen = camera.worldToScreen(worldPos.x, GROUND_Y);

    ctx.save();

    if (selectedToolType === 'seed') {
      // 種植えモードガイド: マウスから地面への点線 ＋ 地面の植え付けリング
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mouseScreenX, mouseScreenY);
      ctx.lineTo(groundScreen.x, groundScreen.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 地面の植え付けプレビュー円
      ctx.fillStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(groundScreen.x, groundScreen.y, 12 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // アイコンプレビュー
      ctx.font = `${Math.max(14, 20 * camera.zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(currentSeed.icon, groundScreen.x, groundScreen.y - 14 * camera.zoom);
    } else {
      // ツールモードガイド: 効果範囲リング
      let toolRadiusWorld = 60;
      let toolColor = 'rgba(56, 189, 248, 0.6)';

      if (currentToolId === 'lava') { toolColor = 'rgba(255, 69, 0, 0.6)'; }
      else if (currentToolId === 'acid') { toolColor = 'rgba(192, 38, 211, 0.6)'; }
      else if (currentToolId === 'sunbeam') { toolColor = 'rgba(254, 240, 138, 0.7)'; toolRadiusWorld = 80; }
      else if (currentToolId === 'fertilizer') { toolColor = 'rgba(132, 204, 22, 0.6)'; toolRadiusWorld = 90; }
      else if (currentToolId === 'freeze') { toolColor = 'rgba(186, 230, 253, 0.7)'; toolRadiusWorld = 70; }
      else if (currentToolId === 'prune' || currentToolId === 'eraser') { toolColor = 'rgba(244, 63, 94, 0.6)'; toolRadiusWorld = 45; }

      const screenRadius = toolRadiusWorld * camera.zoom;
      ctx.strokeStyle = toolColor;
      ctx.fillStyle = toolColor.replace(/0\.\d+/, '0.1');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouseScreenX, mouseScreenY, screenRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
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
    drawCursorGuide();

    requestAnimationFrame(loop);
  }

  loop();
});



