/**
 * KanjiSearch - app.js
 * メインコントローラー・4大検索ロジック・部位マルチAND検索・詳細モーダル表示
 */

import { HandwritingCanvas } from './handwriting.js';

class KanjiSearchApp {
  constructor() {
    this.currentTab = 'yomi';
    this.selectedParts = new Set();
    this.handwritingCanvas = null;

    this.initDOM();
    this.bindEvents();
    this.renderPartsMasterGrid();
    this.initHandwriting();
    
    // 初期検索実行
    this.executeSearch();
  }

  initDOM() {
    this.gridContainer = document.getElementById('kanji-results-grid');
    this.badgeCount = document.getElementById('results-count-badge');

    // Modals
    this.modal = document.getElementById('modal-kanji-detail');
    this.modalChar = document.getElementById('modal-kanji-char');
    this.modalStroke = document.getElementById('modal-kanji-stroke');
    this.modalBushu = document.getElementById('modal-kanji-bushu');
    this.modalGrade = document.getElementById('modal-kanji-grade');
    this.modalYomi = document.getElementById('modal-kanji-yomi');
    this.modalMeaning = document.getElementById('modal-kanji-meaning');
    this.modalExamples = document.getElementById('modal-kanji-examples');
  }

  initHandwriting() {
    const canvasEl = document.getElementById('handwriting-canvas');
    if (canvasEl) {
      this.handwritingCanvas = new HandwritingCanvas(canvasEl, (candidates) => {
        if (this.currentTab === 'handwriting') {
          this.renderResults(candidates);
        }
      });
    }
  }

  bindEvents() {
    // タブ切り替え
    const tabs = document.querySelectorAll('.mode-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.currentTab = tab.dataset.tab;

        // パネル切り替え
        document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(`panel-${this.currentTab}`);
        if (activePanel) activePanel.classList.add('active');

        this.executeSearch();
      });
    });

    // 1. ふりがな検索入力
    const inputYomi = document.getElementById('input-yomi');
    if (inputYomi) {
      inputYomi.addEventListener('input', () => this.executeSearch());
    }

    // 2. 漢字検索入力
    const inputKanji = document.getElementById('input-kanji');
    if (inputKanji) {
      inputKanji.addEventListener('input', () => this.executeSearch());
    }

    // 3. 手書きコントロール
    document.getElementById('btn-hw-clear').addEventListener('click', () => {
      if (this.handwritingCanvas) this.handwritingCanvas.clear();
    });
    document.getElementById('btn-hw-undo').addEventListener('click', () => {
      if (this.handwritingCanvas) this.handwritingCanvas.undo();
    });

    // 4. 部位クリア
    document.getElementById('btn-clear-parts').addEventListener('click', () => {
      this.selectedParts.clear();
      this.renderSelectedPartsBar();
      this.updatePartsButtonsState();
      this.executeSearch();
    });

    // 部位フィルター入力
    document.getElementById('filter-parts-input').addEventListener('input', (e) => {
      this.renderPartsMasterGrid(e.target.value.trim());
    });

    // モーダル閉じる
    document.getElementById('modal-detail-close').addEventListener('click', () => {
      this.modal.classList.remove('active');
    });
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.modal.classList.remove('active');
    });
  }

  executeSearch() {
    const database = window.KANJI_DATABASE || [];
    let results = [];

    if (this.currentTab === 'yomi') {
      const q = (document.getElementById('input-yomi').value || '').trim().toLowerCase();
      if (!q) {
        results = database;
      } else {
        results = database.filter(item => {
          return item.yomi.some(y => y.toLowerCase().includes(q));
        });
      }
    } else if (this.currentTab === 'kanji') {
      const q = (document.getElementById('input-kanji').value || '').trim();
      if (!q) {
        results = database;
      } else {
        results = database.filter(item => {
          return item.kanji.includes(q) || (item.bushu && item.bushu.includes(q));
        });
      }
    } else if (this.currentTab === 'parts') {
      if (this.selectedParts.size === 0) {
        results = database;
      } else {
        const requiredParts = Array.from(this.selectedParts);
        // AND 検索 (すべての選択部位を含む漢字を抽出)
        results = database.filter(item => {
          const itemParts = item.parts || [];
          return requiredParts.every(p => itemParts.includes(p) || item.kanji === p || item.bushu === p);
        });
      }
    } else if (this.currentTab === 'handwriting') {
      if (this.handwritingCanvas) {
        this.handwritingCanvas.recognize();
        return;
      }
    }

    this.renderResults(results);
  }

  renderResults(results) {
    this.gridContainer.innerHTML = '';
    this.badgeCount.textContent = `(${results.length} 件表示)`;

    if (results.length === 0) {
      this.gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-sub);">
          🌸 条件に該当する漢字が見つかりませんでした。<br>別の検索ワードや部位を選択してみてください。
        </div>
      `;
      return;
    }

    results.forEach(item => {
      const card = document.createElement('div');
      card.className = 'kanji-card';
      card.innerHTML = `
        <div class="kanji-char">${item.kanji}</div>
        <div class="kanji-yomi">${item.yomi.slice(0, 2).join(' / ')}</div>
        <div class="kanji-meta">${item.stroke}画 ｜ 部首:${item.bushu}</div>
      `;
      card.addEventListener('click', () => this.openDetailModal(item));
      this.gridContainer.appendChild(card);
    });
  }

  renderPartsMasterGrid(filterText = '') {
    const container = document.getElementById('parts-master-grid');
    container.innerHTML = '';

    const list = window.BUSHU_PARTS_LIST || [];
    
    // 画数でグループ分け
    const groups = {};
    list.forEach(p => {
      if (filterText && !p.name.includes(filterText)) return;
      if (!groups[p.stroke]) groups[p.stroke] = [];
      groups[p.stroke].push(p.name);
    });

    Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(stroke => {
      const sec = document.createElement('div');
      sec.innerHTML = `<div class="stroke-category">${stroke} 画</div>`;
      
      const grid = document.createElement('div');
      grid.className = 'parts-btn-grid';

      groups[stroke].forEach(partName => {
        const btn = document.createElement('button');
        btn.className = `part-btn ${this.selectedParts.has(partName) ? 'selected' : ''}`;
        btn.textContent = partName;
        btn.setAttribute('data-part', partName);

        btn.addEventListener('click', () => {
          if (this.selectedParts.has(partName)) {
            this.selectedParts.delete(partName);
          } else {
            this.selectedParts.add(partName);
          }
          this.renderSelectedPartsBar();
          this.updatePartsButtonsState();
          this.executeSearch();
        });

        grid.appendChild(btn);
      });

      sec.appendChild(grid);
      container.appendChild(sec);
    });
  }

  renderSelectedPartsBar() {
    const container = document.getElementById('selected-parts-container');
    container.innerHTML = '';

    if (this.selectedParts.size === 0) {
      container.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-sub);">（下の部位ボタンをタップして選択してください）</span>`;
      return;
    }

    this.selectedParts.forEach(part => {
      const tag = document.createElement('div');
      tag.className = 'selected-part-tag';
      tag.innerHTML = `<span>${part}</span> <span style="font-size:0.8rem;">✕</span>`;
      tag.addEventListener('click', () => {
        this.selectedParts.delete(part);
        this.renderSelectedPartsBar();
        this.updatePartsButtonsState();
        this.executeSearch();
      });
      container.appendChild(tag);
    });
  }

  updatePartsButtonsState() {
    const btns = document.querySelectorAll('.part-btn');
    btns.forEach(btn => {
      const part = btn.getAttribute('data-part');
      if (this.selectedParts.has(part)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  openDetailModal(item) {
    this.modalChar.textContent = item.kanji;
    this.modalStroke.textContent = `${item.stroke} 画`;
    this.modalBushu.textContent = `${item.bushu}`;
    this.modalGrade.textContent = `${item.grade || '常用漢字'}`;
    this.modalYomi.textContent = item.yomi.join(' / ');
    this.modalMeaning.textContent = item.meaning || '意味の解説準備中';

    this.modalExamples.innerHTML = '';
    const examples = item.examples || [];
    if (examples.length === 0) {
      this.modalExamples.innerHTML = `<span style="font-size:0.85rem; color:var(--text-sub);">熟語例データ</span>`;
    } else {
      examples.forEach(ex => {
        const tag = document.createElement('div');
        tag.className = 'example-tag';
        tag.textContent = ex;
        this.modalExamples.appendChild(tag);
      });
    }

    this.modal.classList.add('active');
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.kanjiApp = new KanjiSearchApp();
});
