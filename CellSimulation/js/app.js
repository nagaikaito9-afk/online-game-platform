/**
 * Cell Simulation - app.js
 * The Powder Toy型 サンドボックスUI ＆ アラート完全不使用コントローラー
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('sim-canvas');
  if (!canvas) return;

  // 1. サンドボックスエンジンの初期化
  const engine = new SandboxEngine(canvas);
  window.simEngine = engine;

  // 2. カスタムトースト通知機能 (※alert(), confirm(), prompt() は絶対不使用)
  const toastContainer = document.getElementById('custom-toast');
  window.showToast = function(message, type = 'info', duration = 3000) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  showToast('🧪 Cell Simulation (The Powder Toy Edition) へようこそ！', 'success', 4000);

  // 3. UI表示更新用参照
  const currentMaterialDisplay = document.getElementById('current-selected-material-display');
  const currentTimeSpeedDisplay = document.getElementById('current-time-speed-display');
  const brushSizeVal = document.getElementById('brush-size-val');

  function updateSelectedMaterialUI(elemId) {
    engine.selectedElementId = elemId;

    let specName = '🧹 消しゴム (Eraser)';
    if (elemId !== 0) {
      const spec = engine.elementMap[elemId] || {};
      specName = spec.name || `物質 #${elemId}`;
    }

    if (currentMaterialDisplay) {
      currentMaterialDisplay.textContent = specName;
    }

    // クイックパレットボタンのアクティブ状態更新
    document.querySelectorAll('.elem-btn').forEach(btn => {
      if (parseInt(btn.getAttribute('data-id'), 10) === elemId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // 4. マウス ＆ タッチ描画イベント
  let isMouseDown = false;

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.floor((clientX - rect.left) / engine.scale);
    const y = Math.floor((clientY - rect.top) / engine.scale);
    return { x, y };
  }

  canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    const { x, y } = getCanvasCoords(e);
    engine.drawBrush(x, y);
    if (window.cellAudioEngine) window.cellAudioEngine.startPourSE();
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
    if (window.cellAudioEngine) window.cellAudioEngine.stopPourSE();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
      const { x, y } = getCanvasCoords(e);
      engine.drawBrush(x, y);
    }
  });

  // タッチ対応
  canvas.addEventListener('touchstart', (e) => {
    isMouseDown = true;
    const { x, y } = getCanvasCoords(e);
    engine.drawBrush(x, y);
    if (window.cellAudioEngine) window.cellAudioEngine.startPourSE();
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isMouseDown = false;
    if (window.cellAudioEngine) window.cellAudioEngine.stopPourSE();
  });

  canvas.addEventListener('touchmove', (e) => {
    if (isMouseDown) {
      const { x, y } = getCanvasCoords(e);
      engine.drawBrush(x, y);
    }
  }, { passive: true });

  // 5. クイックパレットボタン割り当て
  document.querySelectorAll('.elem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const elemId = parseInt(btn.getAttribute('data-id'), 10);
      updateSelectedMaterialUI(elemId);
    });
  });

  // 6. ペンサイズスライダー (1px 〜 30px)
  const brushSlider = document.getElementById('slider-brush-size');
  if (brushSlider) {
    brushSlider.addEventListener('input', (e) => {
      const size = parseInt(e.target.value, 10);
      engine.brushSize = size;
      if (brushSizeVal) brushSizeVal.textContent = `${size} px`;
    });
  }

  // 7. 重力逆転ボタン
  const btnToggleGravity = document.getElementById('btn-toggle-gravity');
  if (btnToggleGravity) {
    btnToggleGravity.addEventListener('click', () => {
      const dirY = engine.toggleGravity();
      if (dirY === -1) {
        btnToggleGravity.textContent = '🙃 重力: 逆転(上)';
        btnToggleGravity.style.borderColor = 'var(--accent-gold)';
        showToast('🙃 重力を逆転（上方向）に切替えました', 'warn');
      } else {
        btnToggleGravity.textContent = '🙃 重力: 通常(下)';
        btnToggleGravity.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        showToast('⬇️ 重力を通常（下方向）に戻しました', 'info');
      }
    });
  }

  // 8. 風吹きボタン (無風 -> 左風 -> 右風 -> 無風)
  const btnToggleWind = document.getElementById('btn-toggle-wind');
  let windState = 0; // 0: 無風, 1: 左風, 2: 右風
  if (btnToggleWind) {
    btnToggleWind.addEventListener('click', () => {
      windState = (windState + 1) % 3;
      if (windState === 0) {
        engine.setWind(0);
        btnToggleWind.textContent = '🌪️ 風: 無風';
        showToast('🌪️ 風が止みました', 'info');
      } else if (windState === 1) {
        engine.setWind(-3);
        btnToggleWind.textContent = '👈 風: 左強風';
        showToast('👈 左方向へ強風を吹かせました', 'info');
      } else {
        engine.setWind(3);
        btnToggleWind.textContent = '👉 風: 右強風';
        showToast('👉 右方向へ強風を吹かせました', 'info');
      }
    });
  }

  // 9. タイムコントロール (0x 〜 100x)
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = parseFloat(btn.getAttribute('data-speed'));
      engine.timeScale = speed;
      if (currentTimeSpeedDisplay) {
        currentTimeSpeedDisplay.textContent = speed === 0 ? '一時停止' : `${speed}x`;
      }
      showToast(`⚡ シミュレーション速度: ${speed === 0 ? '一時停止' : speed + 'x'}`, 'info', 1500);
    });
  });

  // 10. 清掃 (クリア) ボタン
  const btnClear = document.getElementById('btn-clear-canvas');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      engine.clearGrid();
      showToast('🧹 キャンバスをキレイに清掃しました', 'info');
    });
  }

  // 11. 実験プリセットボタン
  const presetLavaWater = document.getElementById('btn-preset-lava-water');
  if (presetLavaWater) {
    presetLavaWater.addEventListener('click', () => {
      engine.clearGrid();
      const midX = Math.floor(engine.cols / 2);
      // 下部に溶岩のプール
      for (let y = engine.rows - 15; y < engine.rows - 3; y++) {
        for (let x = midX - 25; x < midX + 25; x++) {
          engine.setPixel(x, y, 2); // 溶岩
        }
      }
      // 上部から水を降り注ぐ
      for (let y = 10; y < 25; y++) {
        for (let x = midX - 20; x < midX + 20; x++) {
          if (Math.random() < 0.6) engine.setPixel(x, y, 1); // 水
        }
      }
      showToast('🌋 溶岩 ✕ 水 の爆発的沸騰＆玄武岩化プリセットを配置しました！', 'success');
    });
  }

  const presetExplosion = document.getElementById('btn-preset-explosion');
  if (presetExplosion) {
    presetExplosion.addEventListener('click', () => {
      engine.clearGrid();
      const midX = Math.floor(engine.cols / 2);
      const midY = Math.floor(engine.rows / 2);
      // 火薬の塊
      for (let dy = -12; dy <= 12; dy++) {
        for (let dx = -12; dx <= 12; dx++) {
          if (dx * dx + dy * dy <= 144) {
            engine.setPixel(midX + dx, midY + dy, 14); // 火薬 (Gunpowder)
          }
        }
      }
      // 火花を一発投下
      engine.setPixel(midX, midY - 14, 38); // 火
      showToast('🔥 火薬庫の大爆発実験プリセット！', 'warn');
    });
  }

  const presetAcid = document.getElementById('btn-preset-acid-corrosion');
  if (presetAcid) {
    presetAcid.addEventListener('click', () => {
      engine.clearGrid();
      const midX = Math.floor(engine.cols / 2);
      // 鉄の壁
      for (let y = engine.rows - 20; y < engine.rows - 5; y++) {
        for (let x = midX - 30; x < midX + 30; x++) {
          engine.setPixel(x, y, 22); // 鉄
        }
      }
      // 上から強力な酸を注ぐ
      for (let y = 5; y < 20; y++) {
        for (let x = midX - 15; x < midX + 15; x++) {
          engine.setPixel(x, y, 4); // 酸
        }
      }
      showToast('🧪 強酸による金属侵食実験プリセットを配置しました！', 'success');
    });
  }

  const presetCell = document.getElementById('btn-preset-cell-growth');
  if (presetCell) {
    presetCell.addEventListener('click', () => {
      engine.clearGrid();
      const midX = Math.floor(engine.cols / 2);
      // 水のプール
      for (let y = engine.rows - 25; y < engine.rows - 3; y++) {
        for (let x = midX - 40; x < midX + 40; x++) {
          engine.setPixel(x, y, 1); // 水
        }
      }
      // 中央に生きた細胞を置く
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          engine.setPixel(midX + dx, engine.rows - 15 + dy, 33); // 細胞
        }
      }
      showToast('🦠 水中での細胞自動分裂＆代謝増殖プリセットを配置しました！', 'success');
    });
  }

  const presetHuman = document.getElementById('btn-preset-human-burn');
  if (presetHuman) {
    presetHuman.addEventListener('click', () => {
      engine.clearGrid();
      const midX = Math.floor(engine.cols / 2);
      // 人体組織の柱
      for (let y = engine.rows - 30; y < engine.rows - 3; y++) {
        for (let x = midX - 10; x < midX + 10; x++) {
          engine.setPixel(x, y, 34); // 人間組織
        }
      }
      // 上から酸と火を少量投下
      engine.setPixel(midX - 3, engine.rows - 33, 4); // 酸
      engine.setPixel(midX + 3, engine.rows - 33, 38); // 火
      showToast('🚶 人間組織 vs 溶岩・酸・熱傷実験プリセット！', 'warn');
    });
  }

  // 12. 全200種類 物質カタログモーダルの制御
  const catalogModal = document.getElementById('modal-material-catalog');
  const btnOpenCatalog = document.getElementById('btn-open-material-catalog');
  const btnCloseCatalog = catalogModal ? catalogModal.querySelector('.modal-close-btn') : null;
  const catalogGrid = document.getElementById('catalog-materials-grid');
  const searchInput = document.getElementById('catalog-search-input');
  const countInfo = document.getElementById('catalog-count-info');

  let currentCategory = 'ALL';

  function renderCatalogGrid() {
    if (!catalogGrid || !window.ALL_ELEMENTS) return;
    catalogGrid.innerHTML = '';

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const filtered = window.ALL_ELEMENTS.filter(el => {
      const matchCat = currentCategory === 'ALL' || el.cat === currentCategory;
      const matchQuery = !query || el.name.toLowerCase().includes(query) || (el.desc && el.desc.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });

    if (countInfo) {
      countInfo.textContent = `表示中: ${filtered.length} / ${window.ALL_ELEMENTS.length} 種類`;
    }

    filtered.forEach(el => {
      const card = document.createElement('div');
      card.className = 'catalog-card';

      const colorHex = `rgba(${el.color[0]}, ${el.color[1]}, ${el.color[2]}, 1)`;

      card.innerHTML = `
        <div class="catalog-card-header">
          <span class="catalog-card-color-dot" style="background: ${colorHex};"></span>
          <span>${el.name}</span>
        </div>
        <div class="catalog-card-desc">${el.desc || ''}</div>
      `;

      card.addEventListener('click', () => {
        updateSelectedMaterialUI(el.id);
        if (catalogModal) catalogModal.classList.remove('open');
        showToast(`選択しました: ${el.name}`, 'info', 2000);
      });

      catalogGrid.appendChild(card);
    });
  }

  if (btnOpenCatalog && catalogModal) {
    btnOpenCatalog.addEventListener('click', () => {
      catalogModal.classList.add('open');
      renderCatalogGrid();
    });
  }

  if (btnCloseCatalog && catalogModal) {
    btnCloseCatalog.addEventListener('click', () => {
      catalogModal.classList.remove('open');
    });
  }

  if (catalogModal) {
    catalogModal.addEventListener('click', (e) => {
      if (e.target === catalogModal) {
        catalogModal.classList.remove('open');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderCatalogGrid);
  }

  document.querySelectorAll('.catalog-cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.catalog-cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.getAttribute('data-cat');
      renderCatalogGrid();
    });
  });

  // 13. シミュレーションメインループ
  function loop() {
    engine.update();
    engine.render();
    requestAnimationFrame(loop);
  }

  loop();
});
