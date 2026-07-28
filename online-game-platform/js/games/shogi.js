/**
 * shogi.js - 将棋実装 (9x9 盤面)
 */

class ShogiGame {
  constructor(container, onFinish) {
    this.container = container;
    this.onFinish = onFinish;
    this.selectedSquare = null;
    this.currentTurn = 'S'; // S: 先手(Sente - Player), G: 後手(Gote - AI/Opponent)
    this.isOver = false;
  }

  init(isAi, aiLevel) {
    this.isAi = isAi;
    this.aiLevel = aiLevel;
    this.selectedSquare = null;
    this.currentTurn = 'S';
    this.isOver = false;

    // 将棋初期盤面
    this.board = [
      ['g_K','g_G','g_S','g_N','g_L','g_N','g_S','g_G','g_K'],
      [null,  'g_R', null,  null,  null,  null,  null,  'g_B', null],
      ['g_P','g_P','g_P','g_P','g_P','g_P','g_P','g_P','g_P'],
      Array(9).fill(null),
      Array(9).fill(null),
      Array(9).fill(null),
      ['s_P','s_P','s_P','s_P','s_P','s_P','s_P','s_P','s_P'],
      [null,  's_B', null,  null,  null,  null,  null,  's_R', null],
      ['s_K','s_G','s_S','s_N','s_L','s_N','s_S','s_G','s_K']
    ];

    this.render();
  }

  getPieceName(code) {
    if (!code) return '';
    const map = {
      's_K': '玉', 's_G': '金', 's_S': '銀', 's_N': '桂', 's_L': '香', 's_B': '角', 's_R': '飛', 's_P': '歩',
      'g_K': '王', 'g_G': '金', 'g_S': '銀', 'g_N': '桂', 'g_L': '香', 'g_B': '角', 'g_R': '飛', 'g_P': '歩'
    };
    return map[code] || '';
  }

  render() {
    this.container.innerHTML = `
      <div class="game-board-wrapper">
        <div class="game-status-bar">
          ${this.currentTurn === 'S' ? 'あなたのターン (先手 ☖)' : (this.isAi ? `AI Level ${this.aiLevel} のターン (後手 ☗)` : '相手のターン (後手 ☗)')}
        </div>
        <div class="shogi-grid">
          ${this.board.map((row, r) => row.map((cell, c) => {
            const isSelected = this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c;
            const isGote = cell && cell.startsWith('g_');
            return `
              <div class="shogi-cell ${isSelected ? 'selected' : ''}" data-r="${r}" data-c="${c}">
                ${cell ? `<div class="shogi-piece ${isGote ? 'gote' : 'sente'}">${this.getPieceName(cell)}</div>` : ''}
              </div>
            `;
          }).join('')).join('')}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.shogi-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        this.handleClick(r, c);
      });
    });
  }

  handleClick(r, c) {
    if (this.isOver || (this.isAi && this.currentTurn !== 'S')) return;

    const cell = this.board[r][c];

    if (this.selectedSquare) {
      if (this.selectedSquare.r === r && this.selectedSquare.c === c) {
        this.selectedSquare = null;
        this.render();
        return;
      }

      this.movePiece(this.selectedSquare.r, this.selectedSquare.c, r, c);
      this.selectedSquare = null;
    } else {
      if (cell && ((this.currentTurn === 'S' && cell.startsWith('s_')) || (this.currentTurn === 'G' && cell.startsWith('g_')))) {
        this.selectedSquare = { r, c };
        this.render();
      }
    }
  }

  movePiece(fr, fc, tr, tc) {
    const piece = this.board[fr][fc];
    const target = this.board[tr][tc];

    audioManager.playSE('place');
    this.board[tr][tc] = piece;
    this.board[fr][fc] = null;

    if (target === 'g_K' || target === 's_K') {
      this.isOver = true;
      this.render();
      const isWin = (this.currentTurn === 'S');
      audioManager.playSE(isWin ? 'win' : 'lose');
      setTimeout(() => this.onFinish(isWin ? 'win' : 'lose'), 500);
      return;
    }

    this.currentTurn = (this.currentTurn === 'S') ? 'G' : 'S';
    this.render();

    if (this.isAi && this.currentTurn === 'G' && !this.isOver) {
      setTimeout(() => {
        const moves = [];
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const p = this.board[r][c];
            if (p && p.startsWith('g_')) {
              for (let tr = 0; tr < 9; tr++) {
                for (let tc = 0; tc < 9; tc++) {
                  if (tr !== r || tc !== c) {
                    const dest = this.board[tr][tc];
                    if (!dest || dest.startsWith('s_')) {
                      moves.push({ fr: r, fc: c, tr, tc, captureValue: dest ? 10 : 0 });
                    }
                  }
                }
              }
            }
          }
        }

        const best = GameAIEngine.getBestMove('shogi', { legalMoves: moves }, this.aiLevel);
        if (best) {
          this.movePiece(best.fr, best.fc, best.tr, best.tc);
        }
      }, 600);
    }
  }
}

window.ShogiGame = ShogiGame;
