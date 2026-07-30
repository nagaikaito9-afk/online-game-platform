/**
 * AiNurture - app.js
 * メインコントローラー・お世話アクション・チャットUI・セーブデータ管理・Web Audio API 音声SE
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
    this.addChatBubble('system', '🐣 AIのたまごから新しい生命が誕生しました！優しくお世話して育ててあげましょう。');
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

    // Board & Chat
    this.systemPromptBoard = document.getElementById('ai-system-prompt-display');
    this.chatContainer = document.getElementById('chat-history-container');
    this.chatInput = document.getElementById('chat-user-input');
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
      } else if (type === 'scold') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      // Audio fallback
    }
  }

  handleAction(actionType) {
    this.playSE(actionType);
    const res = this.engine.performAction(actionType);

    this.addChatBubble('system', res.msg);
    if (res.emoji) this.avatarEmoji.textContent = res.emoji;

    this.updateUI();
    this.saveData();

    // アクションに対するAIの自動コメント
    setTimeout(() => {
      const aiResp = this.engine.generateResponse('お世話してくれてありがとう');
      this.addChatBubble('ai', aiResp.reply, aiResp.emoji);
    }, 600);
  }

  handleSendMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.chatInput.value = '';
    this.playSE('click');

    // ユーザーメッセージ吹き出し追加
    this.addChatBubble('user', text);

    // AIの自律応答生成
    setTimeout(() => {
      const res = this.engine.generateResponse(text);
      this.addChatBubble('ai', res.reply, res.emoji);
      if (res.emoji) this.avatarEmoji.textContent = res.emoji;
      
      // 愛着・経験値の微増
      this.engine.status.affection = Math.min(100, this.engine.status.affection + 2);
      this.engine.status.exp += 2;
      this.updateUI();
      this.saveData();
    }, 500);
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
    if (sender === 'ai') senderLabel = `${this.engine.status.name} ${emoji ? emoji : ''}`;

    bubble.innerHTML = `
      <span class="bubble-sender">${senderLabel}</span>
      <div class="bubble-text">${text}</div>
    `;

    this.chatContainer.appendChild(bubble);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  updateUI() {
    const sys = this.engine.getSystemPrompt();
    const s = this.engine.status;

    // Stage & Name & Epoch
    this.stageBadge.textContent = sys.stageName;
    this.avatarEmoji.textContent = sys.avatarEmoji;
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

    // 裏システム指示ボード
    this.systemPromptBoard.textContent = sys.prompt;
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
