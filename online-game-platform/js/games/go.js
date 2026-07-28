/**
 * go.js - 囲碁実装 (9路/13路/19路盤 & 置石あり/なし)
 */

class GoGame {
  constructor(container, onFinish) {
    this.container = container;
    this.onFinish = onFinish;
    this.boardSize = 9; // 9, 13, 19
    this.handicap = 0; // 0: なし, 2: あり(2石)
    this.board = [];
    this.currentTurn = 'B'; // B: 黒, W: 白
    this.isOver = false;
    this.passCount = 0;
  }

  init(isAi, aiLevel, options = {}) {
    this.isAi = isAi;
    this.aiLevel = aiLevel;
    this.boardSize = options.boardSize || 9;
    this.handicap = options.handicap || 0;

    this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
    this.currentTurn = 'B';
    this.isOver = false;
    this.passCount = 0;

    // 置石初期設定 (星の位置)
    if (this.handicap > 0) {
      if (this.boardSize === 9) {
        this.board[2][6] = 'B';
        this.board[6][2] = 'B';
      } else if (this.boardSize === 13) {
        this.board[3][9] = 'B';
        this.board[9][3] = 'B';
      } else {
        this.board[3][15] = 'B';
        this.board[15][3] = 'B';
      }
      this.currentTurn = 'W'; // 置石ありの場合は白(AI/相手)から開始
    }

    this.render();
  }

  getValidMoves() {
    const moves = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c] === null) {
          moves.push({ r, c });
        }
      }
    }
    return moves;
  }

  evaluateGoMove(r, c, level) {
    // AI用の簡易位置評価
    let val = 10;
    const center = Math.floor(this.boardSize / 2);
    val -= (Math.abs(r - center) + Math.abs(c - center));
    return val;
  }

  render() {
    this.container.innerHTML = `
      <div class="game-board-wrapper">
        <div class="game-status-bar">
          囲碁 ${this.boardSize}路盤 (${this.handicap > 0 ? '置石2石' : '置石なし'})
          ｜ ${this.currentTurn === 'B' ? '⚫ 黒のターン' : '⚪ 白のターン'}
        </div>
        <div class="go-grid-container" style="grid-template-columns: repeat(${this.boardSize}, 1fr); grid-template-rows: repeat(${this.boardSize}, 1fr);">
          ${this.board.map((row, r) => row.map((cell, c) => `
            <div class="go-cell" data-r="${r}" data-c="${c}">
              <div class="go-grid-line"></div>
              ${cell === 'B' ? '<div class="stone black"></div>' : cell === 'W' ? '<div class="stone white"></div>' : ''}
            </div>
          `).join('')).join('')}
        </div>
        <div class="go-controls">
          <button id="go-pass-btn" class="btn btn-secondary">パス (${this.passCount}/2)</button>
          <button id="go-resign-btn" class="btn btn-danger">投了</button>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.go-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        this.makeMove(r, c);
      });
    });

    const passBtn = this.container.querySelector('#go-pass-btn');
    if (passBtn) {
      passBtn.addEventListener('click', () => this.handlePass());
    }

    const resignBtn = this.container.querySelector('#go-resign-btn');
    if (resignBtn) {
      resignBtn.addEventListener('click', () => this.handleResign());
    }
  }

  makeMove(r, c) {
    if (this.isOver || this.board[r][c] !== null || (this.isAi && this.currentTurn !== 'B')) return;

    audioManager.playSE('place');
    this.board[r][c] = this.currentTurn;
    this.passCount = 0;

    // 自殺手・石の取り処理（簡易ルール判定）
    this.captureOpponentStones(r, c, (this.currentTurn === 'B' ? 'W' : 'B'));

    this.currentTurn = (this.currentTurn === 'B') ? 'W' : 'B';
    this.render();

    if (this.isAi && this.currentTurn === 'W' && !this.isOver) {
      setTimeout(() => {
        const move = GameAIEngine.getBestMove('go', { validMoves: this.getValidMoves(), evaluateGoMove: this.evaluateGoMove.bind(this) }, this.aiLevel);
        if (move && !move.pass) {
          audioManager.playSE('place');
          this.board[move.r][move.c] = 'W';
          this.captureOpponentStones(move.r, move.c, 'B');
          this.passCount = 0;
          this.currentTurn = 'B';
          this.render();
        } else {
          this.handlePass();
        }
      }, 600);
    }
  }

  captureOpponentStones(r, c, opp) {
    // 呼吸点が0になった周りの敵石を除去する判定
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    dirs.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize && this.board[nr][nc] === opp) {
        if (!this.hasLiberty(nr, nc, opp, new Set())) {
          this.removeGroup(nr, nc, opp);
        }
      }
    });
  }

  hasLiberty(r, c, color, visited) {
    const key = `${r},${c}`;
    if (visited.has(key)) return false;
    visited.add(key);

    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
        if (this.board[nr][nc] === null) return true;
        if (this.board[nr][nc] === color) {
          if (this.hasLiberty(nr, nc, color, visited)) return true;
        }
      }
    }
    return false;
  }

  removeGroup(r, c, color) {
    const key = `${r},${c}`;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    this.board[r][c] = null;

    dirs.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize && this.board[nr][nc] === color) {
        this.removeGroup(nr, nc, color);
      }
    });
  }

  handlePass() {
    this.passCount++;
    audioManager.playSE('click');

    if (this.passCount >= 2) {
      this.finishGameByTerritory();
      return;
    }

    this.currentTurn = (this.currentTurn === 'B') ? 'W' : 'B';
    this.render();

    if (this.isAi && this.currentTurn === 'W' && !this.isOver) {
      setTimeout(() => this.handlePass(), 500);
    }
  }

  handleResign() {
    this.isOver = true;
    audioManager.playSE('lose');
    setTimeout(() => this.onFinish('lose'), 300);
  }

  finishGameByTerritory() {
    this.isOver = true;
    let bStones = 0, wStones = 0;
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c] === 'B') bStones++;
        if (this.board[r][c] === 'W') wStones++;
      }
    }

    const isWin = (bStones >= wStones);
    audioManager.playSE(isWin ? 'win' : 'lose');
    setTimeout(() => this.onFinish(isWin ? 'win' : 'lose'), 500);
  }
}

window.GoGame = GoGame;
