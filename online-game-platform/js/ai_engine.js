/**
 * ai_engine.js - 全ゲーム共通 レベル1〜20 段階的AI思考エンジン
 */

class GameAIEngine {
  /**
   * AIの着手を決定
   * @param {string} gameId - ゲームの種別
   * @param {object} gameState - 現在の盤面/手札状態
   * @param {number} level - AIレベル (1〜20)
   * @returns {any} 選ばれた手
   */
  static getBestMove(gameId, gameState, level = 1) {
    const errorRate = Math.max(0, 1.0 - (level / 20)); // レベル20でエラー率0%
    const isRandomMove = Math.random() < errorRate * 0.7;

    switch (gameId) {
      case 'tictactoe':
        return this.getTicTacToeMove(gameState, level, isRandomMove);
      case 'reversi':
        return this.getReversiMove(gameState, level, isRandomMove);
      case 'gomoku':
        return this.getGomokuMove(gameState, level, isRandomMove);
      case 'go':
        return this.getGoMove(gameState, level, isRandomMove);
      case 'chess':
        return this.getChessMove(gameState, level, isRandomMove);
      case 'shogi':
        return this.getShogiMove(gameState, level, isRandomMove);
      case 'cards_daifugo':
      case 'cards_sevens':
      case 'cards_speed':
      case 'cards_oldmaid':
      case 'cards_jijinuki':
        return this.getCardMove(gameId, gameState, level, isRandomMove);
      default:
        return null;
    }
  }

  // --- 〇✕ゲーム ---
  static getTicTacToeMove(gameState, level, isRandomMove) {
    const board = gameState.board; // array 9
    const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);

    if (emptyIndices.length === 0) return null;
    if (isRandomMove || level <= 3) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    // リーチチェック (AIが勝ち確定の手)
    for (const i of emptyIndices) {
      board[i] = 'O';
      if (this.checkTicTacToeWin(board, 'O')) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
    // 相手(X)のリーチ阻止
    for (const i of emptyIndices) {
      board[i] = 'X';
      if (this.checkTicTacToeWin(board, 'X')) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }

    // 中央(4)を取る
    if (emptyIndices.includes(4) && Math.random() > 0.2) return 4;
    // 四隅を取る
    const corners = [0, 2, 6, 8].filter(c => emptyIndices.includes(c));
    if (corners.length > 0 && Math.random() > 0.3) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  static checkTicTacToeWin(b, player) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    return lines.some(([x,y,z]) => b[x] === player && b[y] === player && b[z] === player);
  }

  // --- オセロ (リバーシ) ---
  static getReversiMove(gameState, level, isRandomMove) {
    const validMoves = gameState.validMoves; // [{r, c, flips}, ...]
    if (!validMoves || validMoves.length === 0) return null;

    if (isRandomMove || level <= 2) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // 角優先評価値マップ
    const weights = [
      [120, -20, 20,  5,  5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [ 20,  -5, 15,  3,  3, 15,  -5,  20],
      [  5,  -5,  3,  3,  3,  3,  -5,   5],
      [  5,  -5,  3,  3,  3,  3,  -5,   5],
      [ 20,  -5, 15,  3,  3, 15,  -5,  20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20,  5,  5, 20, -20, 120]
    ];

    let bestMove = validMoves[0];
    let maxScore = -Infinity;

    validMoves.forEach(m => {
      const score = weights[m.r][m.c] + (m.flips.length * (level / 5));
      if (score > maxScore) {
        maxScore = score;
        bestMove = m;
      }
    });

    return bestMove;
  }

  // --- 五目並べ ---
  static getGomokuMove(gameState, level, isRandomMove) {
    const validMoves = gameState.validMoves; // [{r, c}, ...]
    if (!validMoves || validMoves.length === 0) return null;

    if (isRandomMove || level <= 3) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // 中央付近および連鎖数の評価
    let best = validMoves[0];
    let bestScore = -1;

    validMoves.forEach(m => {
      let score = 0;
      // 中央重視
      const centerDist = Math.abs(m.r - 7) + Math.abs(m.c - 7);
      score += (15 - centerDist);

      // 隣接石チェック
      score += gameState.countAdjacentStones(m.r, m.c) * (level * 3);

      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    });

    return best;
  }

  // --- 囲碁 ---
  static getGoMove(gameState, level, isRandomMove) {
    const validMoves = gameState.validMoves; // [{r, c}, ...]
    if (!validMoves || validMoves.length === 0) return { pass: true };

    if (isRandomMove || level <= 3) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // 地取り評価（目・呼吸点のある場所）
    let bestMove = validMoves[0];
    let maxVal = -1;
    validMoves.forEach(m => {
      const val = gameState.evaluateGoMove(m.r, m.c, level);
      if (val > maxVal) {
        maxVal = val;
        bestMove = m;
      }
    });
    return bestMove;
  }

  // --- チェス ---
  static getChessMove(gameState, level, isRandomMove) {
    const legalMoves = gameState.legalMoves;
    if (!legalMoves || legalMoves.length === 0) return null;
    if (isRandomMove || level <= 3) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    // 駒取り優先評価
    let best = legalMoves[0];
    let maxVal = -999;
    legalMoves.forEach(m => {
      let val = m.captureValue || 0;
      val += (level * 0.5);
      if (val > maxVal) {
        maxVal = val;
        best = m;
      }
    });
    return best;
  }

  // --- 将棋 ---
  static getShogiMove(gameState, level, isRandomMove) {
    const legalMoves = gameState.legalMoves;
    if (!legalMoves || legalMoves.length === 0) return null;
    if (isRandomMove || level <= 3) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    let best = legalMoves[0];
    let maxVal = -999;
    legalMoves.forEach(m => {
      let val = m.captureValue || 0;
      if (m.isPromoted) val += 5;
      if (val > maxVal) {
        maxVal = val;
        best = m;
      }
    });
    return best;
  }

  // --- トランプ各種 ---
  static getCardMove(gameId, gameState, level, isRandomMove) {
    const playable = gameState.playableCards || [];
    if (playable.length === 0) return null;
    if (isRandomMove || level <= 3) {
      return playable[Math.floor(Math.random() * playable.length)];
    }
    // 出せる中で最強または最善のカード
    return playable[0];
  }
}

window.GameAIEngine = GameAIEngine;
