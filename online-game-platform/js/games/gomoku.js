/**
 * gomoku.js - 五目並べ実装 (15x15)
 */

class GomokuGame {
  constructor(container, onFinish) {
    this.container = container;
    this.onFinish = onFinish;
    this.size = 15;
    this.board = Array(15).fill(null).map(() => Array(15).fill(null));
    this.currentTurn = 'B'; // B: Black (Player), W: White (AI/Opponent)
    this.isOver = false;
  }

  init(isAi, aiLevel) {
    this.isAi = isAi;
    this.aiLevel = aiLevel;
    this.board = Array(15).fill(null).map(() => Array(15).fill(null));
    this.currentTurn = 'B';
    this.isOver = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-board-wrapper">
        <div class="game-status-bar">
          ${this.currentTurn === 'B' ? 'あなたのターン (⚫ 黒)' : (this.isAi ? `AI Level ${this.aiLevel} のターン (⚪ 白)` : '相手のターン (⚪ 白)')}
        </div>
        <div class="gomoku-grid">
          ${this.board.map((row, r) => row.map((cell, c) => `
            <div class="gomoku-cell" data-r="${r}" data-c="${c}">
              ${cell === 'B' ? '<div class="stone black"></div>' : cell === 'W' ? '<div class="stone white"></div>' : ''}
            </div>
          `).join('')).join('')}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.gomoku-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        this.makeMove(r, c);
      });
    });
  }

  makeMove(r, c) {
    if (this.isOver || this.board[r][c] !== null || (this.isAi && this.currentTurn !== 'B')) return;

    audioManager.playSE('place');
    this.board[r][c] = this.currentTurn;

    if (this.checkWin(r, c, this.currentTurn)) {
      this.isOver = true;
      this.render();
      const isWin = (this.currentTurn === 'B');
      audioManager.playSE(isWin ? 'win' : 'lose');
      setTimeout(() => this.onFinish(isWin ? 'win' : 'lose'), 500);
      return;
    }

    this.currentTurn = (this.currentTurn === 'B') ? 'W' : 'B';
    this.render();

    if (this.isAi && this.currentTurn === 'W' && !this.isOver) {
      setTimeout(() => {
        const validMoves = [];
        for (let i = 0; i < 15; i++) {
          for (let j = 0; j < 15; j++) {
            if (this.board[i][j] === null) validMoves.push({ r: i, c: j });
          }
        }

        const countAdj = (row, col) => {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr, nc = col + dc;
              if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] !== null) count++;
            }
          }
          return count;
        };

        const move = GameAIEngine.getBestMove('gomoku', { validMoves, countAdjacentStones: countAdj }, this.aiLevel);
        if (move) {
          audioManager.playSE('place');
          this.board[move.r][move.c] = 'W';

          if (this.checkWin(move.r, move.c, 'W')) {
            this.isOver = true;
            this.render();
            audioManager.playSE('lose');
            setTimeout(() => this.onFinish('lose'), 500);
            return;
          }
          this.currentTurn = 'B';
          this.render();
        }
      }, 500);
    }
  }

  checkWin(r, c, player) {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let count = 1;
      // プラス方向
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === player) {
        count++;
        nr += dr;
        nc += dc;
      }
      // マイナス方向
      nr = r - dr; nc = c - dc;
      while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === player) {
        count++;
        nr -= dr;
        nc -= dc;
      }
      if (count >= 5) return true;
    }
    return false;
  }
}

window.GomokuGame = GomokuGame;
