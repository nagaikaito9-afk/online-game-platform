/**
 * tictactoe.js - 〇✕ゲーム実装
 */

class TicTacToeGame {
  constructor(container, onFinish) {
    this.container = container;
    this.onFinish = onFinish;
    this.board = Array(9).fill(null);
    this.currentTurn = 'X'; // X: Player / Host, O: AI / Opponent
    this.isOver = false;
  }

  init(isAi, aiLevel) {
    this.isAi = isAi;
    this.aiLevel = aiLevel;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-board-wrapper">
        <div class="game-status-bar" id="tictactoe-status">
          ${this.currentTurn === 'X' ? 'あなたのターン (❌)' : (this.isAi ? `AI Level ${this.aiLevel} のターン (⭕)` : '相手のターン (⭕)')}
        </div>
        <div class="tictactoe-grid">
          ${this.board.map((cell, idx) => `
            <div class="tictactoe-cell ${cell ? 'filled' : ''}" data-index="${idx}">
              ${cell === 'X' ? '<span class="mark-x">❌</span>' : cell === 'O' ? '<span class="mark-o">⭕</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.tictactoe-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const idx = parseInt(cell.dataset.index);
        this.makeMove(idx);
      });
    });
  }

  makeMove(idx) {
    if (this.isOver || this.board[idx] !== null || (this.isAi && this.currentTurn !== 'X')) return;

    audioManager.playSE('place');
    this.board[idx] = this.currentTurn;
    
    if (this.checkWin(this.currentTurn)) {
      this.isOver = true;
      this.render();
      const isWin = (this.currentTurn === 'X');
      audioManager.playSE(isWin ? 'win' : 'lose');
      setTimeout(() => this.onFinish(isWin ? 'win' : 'lose'), 500);
      return;
    }

    if (this.board.every(cell => cell !== null)) {
      this.isOver = true;
      this.render();
      audioManager.playSE('click');
      setTimeout(() => this.onFinish('draw'), 500);
      return;
    }

    this.currentTurn = (this.currentTurn === 'X') ? 'O' : 'X';
    this.render();

    if (this.isAi && this.currentTurn === 'O' && !this.isOver) {
      setTimeout(() => {
        const aiMove = GameAIEngine.getBestMove('tictactoe', { board: this.board }, this.aiLevel);
        if (aiMove !== null) {
          this.makeAiMove(aiMove);
        }
      }, 500);
    }
  }

  makeAiMove(idx) {
    if (this.isOver || this.board[idx] !== null) return;

    audioManager.playSE('place');
    this.board[idx] = 'O';

    if (this.checkWin('O')) {
      this.isOver = true;
      this.render();
      audioManager.playSE('lose');
      setTimeout(() => this.onFinish('lose'), 500);
      return;
    }

    if (this.board.every(cell => cell !== null)) {
      this.isOver = true;
      this.render();
      audioManager.playSE('click');
      setTimeout(() => this.onFinish('draw'), 500);
      return;
    }

    this.currentTurn = 'X';
    this.render();
  }

  checkWin(player) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    return lines.some(([a,b,c]) => this.board[a] === player && this.board[b] === player && this.board[c] === player);
  }
}

window.TicTacToeGame = TicTacToeGame;
