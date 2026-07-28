/**
 * playing_cards.js - トランプゲーム全種実装
 * (大富豪, 7ならべ, スピード, ババ抜き, ジジ抜き)
 */

class PlayingCardsGame {
  constructor(container, onFinish) {
    this.container = container;
    this.onFinish = onFinish;
    this.subType = 'cards_daifugo'; // cards_daifugo, cards_sevens, cards_speed, cards_oldmaid, cards_jijinuki
    this.deck = [];
    this.playerHand = [];
    this.aiHand = [];
    this.tableCards = [];
    this.currentTurn = 'player';
    this.isOver = false;
  }

  init(subType, isAi, aiLevel) {
    this.subType = subType;
    this.isAi = isAi;
    this.aiLevel = aiLevel;
    this.isOver = false;
    this.currentTurn = 'player';
    this.tableCards = [];

    this.createDeck();
    this.dealCards();
    this.render();
  }

  createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    this.deck = [];
    suits.forEach(s => {
      for (let v = 1; v <= 13; v++) {
        this.deck.push({ suit: s, value: v, isRed: (s === '♥' || s === '♦') });
      }
    });

    if (this.subType === 'cards_oldmaid' || this.subType === 'cards_jijinuki') {
      this.deck.push({ suit: '🃏', value: 99, isJoker: true });
    }
    // シャッフル
    this.deck.sort(() => Math.random() - 0.5);
  }

  dealCards() {
    if (this.subType === 'cards_jijinuki') {
      this.deck.pop(); // 1枚伏せて除外
    }

    const half = Math.floor(this.deck.length / 2);
    this.playerHand = this.deck.slice(0, half);
    this.aiHand = this.deck.slice(half);

    // ババ抜き / ジジ抜き時の初期ペア捨て処理
    if (this.subType === 'cards_oldmaid' || this.subType === 'cards_jijinuki') {
      this.playerHand = this.removePairs(this.playerHand);
      this.aiHand = this.removePairs(this.aiHand);
    }
  }

  removePairs(hand) {
    const counts = {};
    hand.forEach(c => {
      if (!c.isJoker) {
        counts[c.value] = (counts[c.value] || 0) + 1;
      }
    });
    return hand.filter(c => c.isJoker || (counts[c.value] % 2 !== 0));
  }

  getGameTitle() {
    const names = {
      'cards_daifugo': 'トランプ：大富豪',
      'cards_sevens': 'トランプ：7ならべ',
      'cards_speed': 'トランプ：スピード',
      'cards_oldmaid': 'トランプ：ババ抜き',
      'cards_jijinuki': 'トランプ：ジジ抜き'
    };
    return names[this.subType] || 'トランプ';
  }

  render() {
    this.container.innerHTML = `
      <div class="game-board-wrapper">
        <div class="game-status-bar">
          ${this.getGameTitle()} ｜ ${this.currentTurn === 'player' ? 'あなたの番' : (this.isAi ? `AI Level ${this.aiLevel} の番` : '相手の番')}
        </div>

        <div class="card-table-area">
          <div class="opponent-hand-display">
            相手の手札: ${this.aiHand.length} 枚
          </div>

          <div class="center-table-display">
            ${this.tableCards.length > 0 ? `
              <div class="card ${this.tableCards[this.tableCards.length - 1].isRed ? 'red' : ''}">
                <span class="card-suit">${this.tableCards[this.tableCards.length - 1].suit}</span>
                <span class="card-value">${this.tableCards[this.tableCards.length - 1].value}</span>
              </div>
            ` : '<div class="empty-table-slot">場札なし</div>'}
          </div>

          <div class="player-hand-display">
            <div class="hand-label">あなたの手札 (${this.playerHand.length}枚):</div>
            <div class="card-hand-row">
              ${this.playerHand.map((card, idx) => `
                <div class="card ${card.isRed ? 'red' : ''} ${card.isJoker ? 'joker' : ''}" data-idx="${idx}">
                  <span class="card-suit">${card.suit}</span>
                  <span class="card-value">${card.isJoker ? 'JOKER' : card.value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card-action-controls">
          ${this.subType === 'cards_daifugo' ? '<button id="card-pass-btn" class="btn btn-secondary">パス</button>' : ''}
          ${(this.subType === 'cards_oldmaid' || this.subType === 'cards_jijinuki') && this.currentTurn === 'player' ? '<button id="card-draw-btn" class="btn btn-primary">相手の手札を1枚引く</button>' : ''}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.player-hand-display .card').forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const idx = parseInt(cardEl.dataset.idx);
        this.playPlayerCard(idx);
      });
    });

    const passBtn = this.container.querySelector('#card-pass-btn');
    if (passBtn) {
      passBtn.addEventListener('click', () => this.handlePass());
    }

    const drawBtn = this.container.querySelector('#card-draw-btn');
    if (drawBtn) {
      drawBtn.addEventListener('click', () => this.drawFromOpponent());
    }
  }

  playPlayerCard(idx) {
    if (this.isOver || this.currentTurn !== 'player') return;

    const card = this.playerHand[idx];
    audioManager.playSE('place');

    this.playerHand.splice(idx, 1);
    this.tableCards.push(card);

    if (this.playerHand.length === 0) {
      this.finishGame(true);
      return;
    }

    this.currentTurn = 'ai';
    this.render();

    if (this.isAi && !this.isOver) {
      setTimeout(() => this.playAiTurn(), 700);
    }
  }

  drawFromOpponent() {
    if (this.isOver || this.currentTurn !== 'player' || this.aiHand.length === 0) return;

    audioManager.playSE('click');
    const randomIdx = Math.floor(Math.random() * this.aiHand.length);
    const drawn = this.aiHand.splice(randomIdx, 1)[0];
    this.playerHand.push(drawn);
    this.playerHand = this.removePairs(this.playerHand);

    if (this.playerHand.length === 0) {
      this.finishGame(true);
      return;
    }

    this.currentTurn = 'ai';
    this.render();

    if (this.isAi && !this.isOver) {
      setTimeout(() => this.playAiTurn(), 700);
    }
  }

  playAiTurn() {
    if (this.isOver) return;

    if (this.subType === 'cards_oldmaid' || this.subType === 'cards_jijinuki') {
      if (this.playerHand.length > 0) {
        audioManager.playSE('click');
        const randomIdx = Math.floor(Math.random() * this.playerHand.length);
        const drawn = this.playerHand.splice(randomIdx, 1)[0];
        this.aiHand.push(drawn);
        this.aiHand = this.removePairs(this.aiHand);

        if (this.aiHand.length === 0) {
          this.finishGame(false);
          return;
        }
      }
    } else {
      if (this.aiHand.length > 0) {
        audioManager.playSE('place');
        const card = this.aiHand.pop();
        this.tableCards.push(card);

        if (this.aiHand.length === 0) {
          this.finishGame(false);
          return;
        }
      }
    }

    this.currentTurn = 'player';
    this.render();
  }

  handlePass() {
    audioManager.playSE('click');
    this.currentTurn = 'ai';
    this.render();
    if (this.isAi && !this.isOver) {
      setTimeout(() => this.playAiTurn(), 600);
    }
  }

  finishGame(isPlayerWin) {
    this.isOver = true;
    this.render();
    audioManager.playSE(isPlayerWin ? 'win' : 'lose');
    setTimeout(() => this.onFinish(isPlayerWin ? 'win' : 'lose'), 500);
  }
}

window.PlayingCardsGame = PlayingCardsGame;
