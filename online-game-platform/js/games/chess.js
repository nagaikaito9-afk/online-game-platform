/**
 * chess.js - チェス実装
 */

class ChessGame {
  constructor(container, onFinish) {
    this.container = container;
    this.onFinish = onFinish;
    this.selectedSquare = null;
    this.currentTurn = 'w'; // w: White (Player), b: Black (AI/Opponent)
    this.isOver = false;
  }

  init(isAi, aiLevel) {
    this.isAi = isAi;
    this.aiLevel = aiLevel;
    this.selectedSquare = null;
    this.currentTurn = 'w';
    this.isOver = false;

    // 初期盤面設定
    this.board = [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];

    this.render();
  }

  getPieceSymbol(p) {
    const symbols = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    return symbols[p] || '';
  }

  render() {
    this.container.innerHTML = `
      <div class="game-board-wrapper">
        <div class="game-status-bar">
          ${this.currentTurn === 'w' ? 'あなたのターン (白 ♔)' : (this.isAi ? `AI Level ${this.aiLevel} のターン (黒 ♚)` : '相手のターン (黒 ♚)')}
        </div>
        <div class="chess-grid">
          ${this.board.map((row, r) => row.map((piece, c) => {
            const isSelected = this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c;
            const isDark = (r + c) % 2 === 1;
            return `
              <div class="chess-cell ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''}" data-r="${r}" data-c="${c}">
                <span class="chess-piece ${piece && piece === piece.toUpperCase() ? 'white-piece' : 'black-piece'}">
                  ${this.getPieceSymbol(piece)}
                </span>
              </div>
            `;
          }).join('')).join('')}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.chess-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        this.handleSquareClick(r, c);
      });
    });
  }

  handleSquareClick(r, c) {
    if (this.isOver || (this.isAi && this.currentTurn !== 'w')) return;

    const piece = this.board[r][c];

    if (this.selectedSquare) {
      if (this.selectedSquare.r === r && this.selectedSquare.c === c) {
        this.selectedSquare = null;
        this.render();
        return;
      }

      // 駒の移動を実行
      this.movePiece(this.selectedSquare.r, this.selectedSquare.c, r, c);
      this.selectedSquare = null;
    } else {
      if (piece && ((this.currentTurn === 'w' && piece === piece.toUpperCase()) || (this.currentTurn === 'b' && piece === piece.toLowerCase()))) {
        this.selectedSquare = { r, c };
        this.render();
      }
    }
  }

  movePiece(fr, fc, tr, tc) {
    const piece = this.board[fr][fc];
    const targetPiece = this.board[tr][tc];

    audioManager.playSE('place');
    this.board[tr][tc] = piece;
    this.board[fr][fc] = null;

    // キングが取られた場合勝利
    if (targetPiece === 'k' || targetPiece === 'K') {
      this.isOver = true;
      this.render();
      const isWin = (this.currentTurn === 'w');
      audioManager.playSE(isWin ? 'win' : 'lose');
      setTimeout(() => this.onFinish(isWin ? 'win' : 'lose'), 500);
      return;
    }

    this.currentTurn = (this.currentTurn === 'w') ? 'b' : 'w';
    this.render();

    if (this.isAi && this.currentTurn === 'b' && !this.isOver) {
      setTimeout(() => {
        const moves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = this.board[r][c];
            if (p && p === p.toLowerCase()) {
              // 簡易移動可能なマス収集
              for (let tr = 0; tr < 8; tr++) {
                for (let tc = 0; tc < 8; tc++) {
                  if (tr !== r || tc !== c) {
                    const dest = this.board[tr][tc];
                    if (!dest || dest === dest.toUpperCase()) {
                      moves.push({ fr: r, fc: c, tr, tc, captureValue: dest ? 10 : 0 });
                    }
                  }
                }
              }
            }
          }
        }

        const bestMove = GameAIEngine.getBestMove('chess', { legalMoves: moves }, this.aiLevel);
        if (bestMove) {
          this.movePiece(bestMove.fr, bestMove.fc, bestMove.tr, bestMove.tc);
        }
      }, 600);
    }
  }
}

window.ChessGame = ChessGame;
