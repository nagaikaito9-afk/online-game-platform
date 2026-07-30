/**
 * AiNurture - app.js
 * メインコントローラー・お世話アクション・チャットUI・確実進化判定・自動セーブ
 */

import { AiEngine } from './ai_engine.js';

class AiNurtureApp {
  constructor() {
    this.engine = new AiEngine();
    this.audioCtx = null;

    this.initDOM();
    this.loadSaveData();
    this.bindEvents();
    this.updateUI();

    // 初期ウェルカムメッセージ
    this.addChatBubble('system', '🐣 AIのたまごから新しい生命が誕生しました！お世話や教育を通じて様々な性格・将来へ成長します！');
    this.triggerAiGreeting();
  }

  initDOM() {
    this.stageBadge = document.getElementById('ai-stage-badge');
    this.avatarEmoji = document.getElementById('ai-avatar-emoji');
    this.nameText = document.getElementById('ai-name');
    this.epochText = document.getElementById('ai-epoch-text');

    // Status Bars & Values
    this.barIntel = document.getElementById('bar-intel');
    this.barAffec = document.getElementById('bar-affec');
    this.barMood = document.getElementById('bar-mood');
    this.barEnergy = document.getElementById('bar-energy');

    this.valIntel = document.getElementById('val-intel');
    this.valAffec = document.getElementById('val-affec');
    this.valMood = document.getElementById('val-mood');
    this.valEnergy = document.getElementById('val-energy');

    // Board & Chat & Evolution Modal
    this.chatContainer = document.getElementById('chat-history-container');
    this.chatInput = document.getElementById('chat-user-input');

    this.evoModal = document.getElementById('modal-evolution');
    this.evoModalEmoji = document.getElementById('evo-modal-emoji');
    this.evoModalTitle = document.getElementById('evo-modal-title');
    this.evoModalDesc = document.getElementById('evo-modal-desc');
    this.btnCloseEvoModal = document.getElementById('btn-close-evo-modal');
  }

  bindEvents() {
    // 6大お世話アクションボタン
    document.getElementById('btn-act-feed').addEventListener('click', () => this.handleAction('feed'));
    document.getElementById('btn-act-study').addEventListener('click', () => this.handleAction('study'));
    document.getElementById('btn-act-play').addEventListener('click', () => this.handleAction('play'));
    document.getElementById('btn-act-pet').addEventListener('click', () => this.handleAction('pet'));
    document.getElementById('btn-act-scold').addEventListener('click', () => this.handleAction('scold'));
    document.getElementById('btn-act-sleep').addEventListener('click', () => this.handleAction('sleep'));

    // チャット送信
    document.getElementById('btn-send-chat').addEventListener('click', () => this.handleSendMessage());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSendMessage();
    });

    // 進化モーダル閉じる
    if (this.btnCloseEvoModal) {
      this.btnCloseEvoModal.addEventListener('click', () => {
        this.evoModal.classList.remove('active');
      });
    }
  }

  playSE(type) {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'feed') {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'pet' || type === 'praise') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'evo') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {}
  }

  handleAction(actionType) {
    this.playSE(actionType);
    const res = this.engine.performAction(actionType);

    this.addChatBubble('system', res.msg);
    if (res.emoji) this.avatarEmoji.textContent = res.emoji;

    // 確実な進化判定モーダル表示
    if (res.evoResult && res.evoResult.isEvolved) {
      this.playSE('evo');
      this.showEvolutionModal(res.evoResult.subType);
    }

    this.updateUI();
    this.saveData();

    // AIの自律コメント
    setTimeout(() => {
      const aiResp = this.engine.generateResponse('お世話してくれてありがとう');
      this.addChatBubble('ai', aiResp.reply, aiResp.emoji);
    }, 600);
  }

  showEvolutionModal(subType) {
    if (!this.evoModal) return;
    this.evoModalTitle.textContent = `✨ AIが成長進化しました！`;
    this.evoModalDesc.textContent = `育ち方によって【${subType}】へ進化！`;
    this.evoModalEmoji.textContent = '🌟';
    this.evoModal.classList.add('active');
  }

  handleSendMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.chatInput.value = '';
    this.playSE('click');

    // ユーザー吹き出し
    this.addChatBubble('user', text);

    // AIの自律応答生成
    setTimeout(() => {
      const res = this.engine.generateResponse(text);
      this.addChatBubble('ai', res.reply, res.emoji);
      if (res.emoji) this.avatarEmoji.textContent = res.emoji;
      
      this.engine.status.affection = Math.min(100, this.engine.status.affection + 2);
      this.engine.status.exp += 2;
      this.updateUI();
      this.saveData();
    }, 400);
  }

  triggerAiGreeting() {
    const res = this.engine.generateResponse('こんにちは');
    this.addChatBubble('ai', res.reply, res.emoji);
  }

  addChatBubble(sender, text, emoji = null) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    let senderLabel = 'システム';
    if (sender === 'user') senderLabel = 'あなた';
    if (sender === 'ai') senderLabel = `${this.engine.status.name} (${this.engine.status.subType}) ${emoji ? emoji : ''}`;

    bubble.innerHTML = `
      <span class="bubble-sender">${senderLabel}</span>
      <div class="bubble-text">${text}</div>
    `;

    this.chatContainer.appendChild(bubble);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  updateUI() {
    const s = this.engine.status;

    // Stage Name & Badge
    const stageNames = ['', '🐣 赤ちゃん期', '🧒 幼児期', '👧 成長期', '👑 大人パートナー期'];
    this.stageBadge.textContent = `${stageNames[s.stage]} ｜ ${s.subType}`;
    
    this.nameText.textContent = s.name;
    this.epochText.textContent = `年齢: ${s.epoch}日目 (エポック ${s.epoch})`;

    // Status Bars
    this.barIntel.style.width = `${Math.min(100, s.intelligence)}%`;
    this.barAffec.style.width = `${Math.min(100, s.affection)}%`;
    this.barMood.style.width = `${Math.min(100, s.mood)}%`;
    this.barEnergy.style.width = `${Math.min(100, s.energy)}%`;

    this.valIntel.textContent = s.intelligence;
    this.valAffec.textContent = s.affection;
    this.valMood.textContent = s.mood;
    this.valEnergy.textContent = s.energy;
  }

  saveData() {
    try {
      localStorage.setItem('ainurture_save_data', JSON.stringify(this.engine.status));
    } catch (e) {}
  }

  loadSaveData() {
    try {
      const dataStr = localStorage.getItem('ainurture_save_data');
      if (dataStr) {
        const loaded = JSON.parse(dataStr);
        Object.assign(this.engine.status, loaded);
      }
    } catch (e) {}
  }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.aiApp = new AiNurtureApp();
});
