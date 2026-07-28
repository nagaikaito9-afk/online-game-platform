/**
 * reversi.js - オセロ (リバーシ) 実装
 */

class ReversiGame {
  constructor(container, onFinish) {
    this.container = container;
    this.onFinish = onFinish;
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.currentTurn = 'B'; // B: Black (Player 1), W: White (Player 2 / AI)
    this.isOver = false;
  }

  init(isAi, aiLevel) {
    this.isAi = isAi;
    this.aiLevel = aiLevel;
    // 初期配置 (中央4石)
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.board[3][3] = 'W';
    this.board[3][4] = 'B';
    this.board[4][3] = 'B';
    this.board[4][4] = 'W';
    this.currentTurn = 'B';
    this.isOver = false;
    this.render();
  }

  getValidMoves(player) {
    const moves = [];
    const opp = (player === 'B') ? 'W' : 'B';
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] !== null) continue;
        const flips = [];

        dirs.forEach(([dr, dc]) => {
          let nr = r + dr;
          let nc = c + dc;
          const temp = [];

          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && this.board[nr][nc] === opp) {
            temp.push({ r: nr, c: nc });
            nr += dr;
            nc += dc;
          }

          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && this.board[nr][nc] === player && temp.length > 0) {
            flips.push(...temp);
          }
        });

        if (flips.length > 0) {
          moves.push({ r, c, flips });
        }
      }
    }
    return moves;
  }

  render() {
    const validMoves = this.getValidMoves(this.currentTurn);
    let blackCount = 0;
    let whiteCount = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] === 'B') blackCount++;
        if (this.board[r][c] === 'W') whiteCount++;
      }
    }

    this.container.innerHTML = `
      <div class="game-board-wrapper">
        <div class="reversi-score-bar">
          <div class="score-box ${this.currentTurn === 'B' ? 'active' : ''}">⚫ あなた: ${blackCount}</div>
          <div class="score-box ${this.currentTurn === 'W' ? 'active' : ''}">⚪ ${this.isAi ? 'AI' : '相手'}: ${whiteCount}</div>
        </div>
        <div class="reversi-grid">
          ${this.board.map((row, r) => row.map((cell, c) => {
            const isValid = validMoves.some(m => m.r === r && m.c === c);
            return `
              <div class="reversi-cell ${isValid ? 'valid-move' : ''}" data-r="${r}" data-c="${c}">
                ${cell === 'B' ? '<div class="disc black"></div>' : cell === 'W' ? '<div class="disc white"></div>' : ''}
              </div>
            `;
          }).join('')).join('')}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.reversi-cell.valid-move').forEach(cell => {
      cell.addEventListener('click', () => {
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        this.makeMove(r, c, validMoves);
      });
    });
  }

  makeMove(r, c, validMoves) {
    if (this.isOver || (this.isAi && this.currentTurn !== 'B')) return;

    const move = validMoves.find(m => m.r === r && m.c === c);
    if (!move) return;

    audioManager.playSE('place');
    this.board[r][c] = this.currentTurn;
    move.flips.forEach(f => {
      this.board[f.r][f.c] = this.currentTurn;
    });

    this.switchTurn();
  }

  switchTurn() {
    this.currentTurn = (this.currentTurn === 'B') ? 'W' : 'B';
    const nextValid = this.getValidMoves(this.currentTurn);

    if (nextValid.length === 0) {
      // パスチェック
      this.currentTurn = (this.currentTurn === 'B') ? 'W' : 'B';
      const prevValid = this.getValidMoves(this.currentTurn);
      if (prevValid.length === 0) {
        // 両者打つ場所なし＝ゲーム終了
        this.finishGame();
        return;
      }
    }

    this.render();

    if (this.isAi && this.currentTurn === 'W' && !this.isOver) {
      setTimeout(() => {
        const aiValid = this.getValidMoves('W');
        const bestMove = GameAIEngine.getBestMove('reversi', { validMoves: aiValid }, this.aiLevel);
        if (bestMove) {
          audioManager.playSE('place');
          this.board[bestMove.r][bestMove.c] = 'W';
          bestMove.flips.forEach(f => {
            this.board[f.r][f.c] = 'W';
          });
          this.switchTurn();
        } else {
          this.switchTurn();
        }
      }, 600);
    }
  }

  finishGame() {
    this.isOver = true;
    let b = 0, w = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] === 'B') b++;
        if (this.board[r][c] === 'W') w++;
      }
    }
    this.render();

    let result = 'draw';
    if (b > w) result = 'win';
    else if (w > b) result = 'lose';

    audioManager.playSE(result === 'win' ? 'win' : result === 'lose' ? 'lose' : 'click');
    setTimeout(() => this.onFinish(result), 500);
  }
}

window.ReversiGame = ReversiGame;
