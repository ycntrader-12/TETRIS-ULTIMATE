/**
 * TETRIS ULTIMATE — Moteur de jeu moderne 2D Canvas & Système complet
 * Created by ycntrader-12
 */

// ══════════════════════════════════════════
//  CONSTANTES & SRS (SUPER ROTATION SYSTEM)
// ══════════════════════════════════════════

const BOARD_W = 10;
const BOARD_H = 20;
const CELL = 1.0;

// Couleurs des pièces (hex)
const PIECE_COLORS = {
  I: 0x00d4ff,
  O: 0xffe600,
  T: 0xcc00ff,
  S: 0x00ff88,
  Z: 0xff3030,
  L: 0xff8800,
  J: 0x3366ff
};

// Formes des pièces (matrices)
const PIECES = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: 'I' },
  O: { shape: [[1,1],[1,1]], color: 'O' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: 'T' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: 'S' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: 'Z' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: 'L' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: 'J' }
};

const PIECE_TYPES = Object.keys(PIECES);

// Table des Wall Kicks SRS pour JLSTZ
const SRS_JLSTZ = {
  '0->1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
  '1->0': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
  '1->2': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
  '2->1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
  '2->3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
  '3->2': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
  '3->0': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
  '0->3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]]
};

// Table des Wall Kicks SRS pour la pièce I
const SRS_I = {
  '0->1': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
  '1->0': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
  '1->2': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
  '2->1': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
  '2->3': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
  '3->2': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
  '3->0': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
  '0->3': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]]
};

// Scoring de base
const LINE_SCORES = [0, 100, 300, 500, 800];
const LINES_PER_LEVEL = 10;

function getLevelSpeed(level, isFreezeActive = false) {
  const base = Math.max(70, 1000 - (level - 1) * 65);
  return isFreezeActive ? base * 2 : base;
}

// ══════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════

function rotateCW(matrix) {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

function rotateCCW(matrix) {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[N - 1 - c][r] = matrix[r][c];
    }
  }
  return result;
}

function showNotification(text, cls) {
  const c = document.getElementById('notification-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `notification ${cls}`;
  el.textContent = text;
  c.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ══════════════════════════════════════════
//  GESTIONNAIRE DE PROGRESSION & ACHIEVEMENTS
// ══════════════════════════════════════════

class ProgressionManager {
  constructor() {
    this.xp = parseInt(localStorage.getItem('tetris3d_xp') || '0');
    this.level = Math.floor(this.xp / 1000) + 1;
    this.stats = JSON.parse(localStorage.getItem('tetris3d_stats') || JSON.stringify({
      gamesPlayed: 0,
      linesCleared: 0,
      totalScore: 0,
      tSpins: 0,
      maxCombo: 0,
      tetrises: 0,
      timePlayed: 0
    }));

    this.achievements = JSON.parse(localStorage.getItem('tetris3d_achievements') || JSON.stringify([
      { id: 'first_line', name: 'Premier Pas', desc: 'Effacer 1 ligne', unlocked: false, icon: '🐣' },
      { id: 'lines_10', name: 'Mégastructure', desc: 'Effacer 10 lignes', unlocked: false, icon: '🧱' },
      { id: 'lines_100', name: 'Légende Tetris', desc: 'Effacer 100 lignes', unlocked: false, icon: '👑' },
      { id: 'combo_3', name: 'Combo Master', desc: 'Réaliser un Combo x3', unlocked: false, icon: '🔥' },
      { id: 'tetris_clear', name: 'Tetris Master', desc: 'Effacer 4 lignes d\'un coup', unlocked: false, icon: '⚡' },
      { id: 'level_10', name: 'Speed Demon', desc: 'Atteindre le Niveau 10', unlocked: false, icon: '🚀' },
      { id: 'tspin_pro', name: 'T-Spin Pro', desc: 'Réaliser un T-Spin', unlocked: false, icon: '🎯' },
      { id: 'score_20k', name: 'High Scorer', desc: 'Atteindre 20,000 points', unlocked: false, icon: '🏆' },
      { id: 'powerup_use', name: 'Bonus Master', desc: 'Utiliser un Power-Up', unlocked: false, icon: '💣' },
      { id: 'survival_60', name: 'Survivant', desc: 'Tenir 60s en mode Survival', unlocked: false, icon: '🛡️' }
    ]));
  }

  addXP(amount) {
    this.xp += amount;
    this.level = Math.floor(this.xp / 1000) + 1;
    localStorage.setItem('tetris3d_xp', this.xp);
  }

  recordGame(lines, score, level, tSpins, maxCombo, tetrises) {
    this.stats.gamesPlayed++;
    this.stats.linesCleared += lines;
    this.stats.totalScore += score;
    this.stats.tSpins += tSpins;
    this.stats.tetrises += tetrises;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, maxCombo);
    localStorage.setItem('tetris3d_stats', JSON.stringify(this.stats));

    // Déblocage d'achievements
    if (lines >= 1) this.unlock('first_line');
    if (this.stats.linesCleared >= 10) this.unlock('lines_10');
    if (this.stats.linesCleared >= 100) this.unlock('lines_100');
    if (maxCombo >= 3) this.unlock('combo_3');
    if (tetrises >= 1) this.unlock('tetris_clear');
    if (level >= 10) this.unlock('level_10');
    if (tSpins >= 1) this.unlock('tspin_pro');
    if (score >= 20000) this.unlock('score_20k');
  }

  unlock(id) {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      localStorage.setItem('tetris3d_achievements', JSON.stringify(this.achievements));
      showNotification(`SUCCÈS DÉBLOQUÉ : ${ach.name} !`, 'notif-level');
      if (window._tetrisController && window._tetrisController.audio) {
        window._tetrisController.audio.playAchievement();
      }
    }
  }
}

// ══════════════════════════════════════════
//  TETRIS GAME ENGINE (AVANCÉ)
// ══════════════════════════════════════════

class TetrisGame {
  constructor() {
    this.board = [];
    this.currentPiece = null;
    this.nextQueue = [];
    this.heldPiece = null;
    this.holdUsed = false;
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('tetris3d_best') || '0');
    this.lines = 0;
    this.level = 1;
    this.startLevel = 1;
    this.gameOver = false;
    this.paused = false;
    this.totalLinesForLevel = 0;
    this.running = false;
    this.bag = [];

    // Combo & Back-to-Back & T-Spin
    this.combo = 0;
    this.maxCombo = 0;
    this.backToBack = false;
    this.lastWasRotation = false;
    this.tSpinType = null; // 'mini', 'full', or null
    this.totalTSpins = 0;
    this.totalTetrises = 0;

    // Power-Ups
    this.powerups = { bomb: 1, freeze: 1, clearline: 1, shield: 1 };
    this.isFreezeActive = false;
    this.isShieldActive = false;

    // Game Mode
    this.mode = 'classic'; // 'classic', 'timeattack', 'endless', 'survival', 'challenge'
    this.modeTimeLeft = 120; // Seconds for time attack
    this.modeSurvivalTime = 0;
  }

  init(startLevel = 1, mode = 'classic') {
    this.board = Array.from({ length: BOARD_H }, () => Array(BOARD_W).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = startLevel;
    this.startLevel = startLevel;
    this.totalLinesForLevel = 0;
    this.gameOver = false;
    this.paused = false;
    this.holdUsed = false;
    this.heldPiece = null;
    this.bag = [];
    this.running = true;
    this.lastClearResult = null;
    this.combo = 0;
    this.maxCombo = 0;
    this.backToBack = false;
    this.lastWasRotation = false;
    this.tSpinType = null;
    this.totalTSpins = 0;
    this.totalTetrises = 0;
    this.mode = mode;
    this.modeTimeLeft = mode === 'timeattack' ? 120 : 0;
    this.modeSurvivalTime = 0;

    this.isFreezeActive = false;
    this.isShieldActive = false;
    this.powerups = { bomb: 1, freeze: 1, clearline: 1, shield: 1 };

    // Initialiser la file d'attente à 3 pièces
    this.nextQueue = [this._newPiece(), this._newPiece(), this._newPiece()];
    this.spawnPiece();
  }

  _newPiece() {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    const type = this.bag.pop();
    const def = PIECES[type];
    return {
      type,
      shape: def.shape.map(r => [...r]),
      color: def.color,
      rotationState: 0,
      x: Math.floor(BOARD_W / 2) - Math.floor(def.shape[0].length / 2),
      y: 0
    };
  }

  spawnPiece() {
    this.currentPiece = this.nextQueue.shift();
    this.nextQueue.push(this._newPiece());
    this.currentPiece.x = Math.floor(BOARD_W / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
    this.currentPiece.y = 0;
    this.currentPiece.rotationState = 0;
    this.holdUsed = false;
    this.lastWasRotation = false;
    this.tSpinType = null;

    if (this._collides(this.currentPiece, 0, 0)) {
      if (this.isShieldActive) {
        this.isShieldActive = false;
        this.board = Array.from({ length: BOARD_H }, () => Array(BOARD_W).fill(0));
        showNotification('🛡️ BOUCLIER UTILISÉ ! PLANCHE NETTOYÉE !', 'notif-level');
      } else {
        this._triggerGameOver();
      }
    }
  }

  _collides(piece, dx, dy, shape) {
    const s = shape || piece.shape;
    const nx = piece.x + dx;
    const ny = piece.y + dy;
    for (let r = 0; r < s.length; r++) {
      for (let c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        const bx = nx + c;
        const by = ny + r;
        if (bx < 0 || bx >= BOARD_W || by >= BOARD_H) return true;
        if (by < 0) continue;
        if (this.board[by][bx]) return true;
      }
    }
    return false;
  }

  moveLeft() {
    if (!this.running || this.paused || this.gameOver) return false;
    if (!this._collides(this.currentPiece, -1, 0)) {
      this.currentPiece.x--;
      this.lastWasRotation = false;
      return true;
    }
    return false;
  }

  moveRight() {
    if (!this.running || this.paused || this.gameOver) return false;
    if (!this._collides(this.currentPiece, 1, 0)) {
      this.currentPiece.x++;
      this.lastWasRotation = false;
      return true;
    }
    return false;
  }

  moveDown() {
    if (!this.running || this.paused || this.gameOver) return false;
    if (!this._collides(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.lastWasRotation = false;
      return true;
    } else {
      this.lastClearResult = this._lock();
      return false;
    }
  }

  hardDrop() {
    if (!this.running || this.paused || this.gameOver) return;
    let dropped = 0;
    while (!this._collides(this.currentPiece, 0, dropped + 1)) dropped++;
    this.currentPiece.y += dropped;
    this.score += dropped * 2;
    this.lastClearResult = this._lock();
  }

  // SRS ROTATION AVEC WALL KICKS & DÉTECTION T-SPIN
  rotate(dir = 'CW') {
    if (!this.running || this.paused || this.gameOver) return false;
    const p = this.currentPiece;
    const oldState = p.rotationState;
    const newState = dir === 'CW' ? (oldState + 1) % 4 : (oldState + 3) % 4;
    const newShape = dir === 'CW' ? rotateCW(p.shape) : rotateCCW(p.shape);

    const kickTable = p.type === 'I' ? SRS_I : SRS_JLSTZ;
    const key = `${oldState}->${newState}`;
    const kicks = kickTable[key] || [[0,0]];

    for (const [kx, ky] of kicks) {
      if (!this._collides(p, kx, -ky, newShape)) { // note: y inverse Canvas
        p.shape = newShape;
        p.x += kx;
        p.y -= ky;
        p.rotationState = newState;
        this.lastWasRotation = true;

        // Détection T-Spin si c'est une pièce T
        if (p.type === 'T') {
          this._checkTSpin();
        }
        return true;
      }
    }
    return false;
  }

  _checkTSpin() {
    const p = this.currentPiece;
    const cx = p.x + 1;
    const cy = p.y + 1;
    const corners = [
      [cx - 1, cy - 1], [cx + 1, cy - 1],
      [cx - 1, cy + 1], [cx + 1, cy + 1]
    ];
    let occupied = 0;
    for (const [x, y] of corners) {
      if (x < 0 || x >= BOARD_W || y >= BOARD_H || (y >= 0 && this.board[y][x])) {
        occupied++;
      }
    }
    if (occupied >= 3) {
      this.tSpinType = occupied === 4 ? 'full' : 'mini';
    } else {
      this.tSpinType = null;
    }
  }

  hold() {
    if (!this.running || this.paused || this.gameOver) return false;
    if (this.holdUsed) return false;
    this.holdUsed = true;
    if (!this.heldPiece) {
      this.heldPiece = {
        type: this.currentPiece.type,
        shape: PIECES[this.currentPiece.type].shape.map(r => [...r]),
        color: this.currentPiece.color
      };
      this.spawnPiece();
    } else {
      const tmp = {
        type: this.heldPiece.type,
        shape: PIECES[this.heldPiece.type].shape.map(r => [...r]),
        color: this.heldPiece.color,
        x: 0, y: 0
      };
      this.heldPiece = {
        type: this.currentPiece.type,
        shape: PIECES[this.currentPiece.type].shape.map(r => [...r]),
        color: this.currentPiece.color
      };
      this.currentPiece = tmp;
      this.currentPiece.x = Math.floor(BOARD_W / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
      this.currentPiece.y = 0;
    }
    return true;
  }

  // ACTIVATION DES POWER-UPS
  usePowerUp(type) {
    if (!this.running || this.paused || this.gameOver) return false;
    if (!this.powerups[type] || this.powerups[type] <= 0) return false;

    this.powerups[type]--;

    if (type === 'bomb') {
      const startR = Math.max(0, BOARD_H - 4);
      for (let r = startR; r < BOARD_H; r++) {
        for (let c = 3; c < 7; c++) this.board[r][c] = 0;
      }
      showNotification('💣 BOMBE EXPLOSÉE !', 'notif-single');
    } else if (type === 'freeze') {
      this.isFreezeActive = true;
      setTimeout(() => { this.isFreezeActive = false; }, 10000);
      showNotification('🧊 TEMPS RALENTI (10s) !', 'notif-double');
    } else if (type === 'clearline') {
      for (let r = BOARD_H - 1; r >= 0; r--) {
        if (this.board[r].some(c => c !== 0)) {
          this.board.splice(r, 1);
          this.board.unshift(Array(BOARD_W).fill(0));
          break;
        }
      }
      showNotification('⚡ LIGNE SUPPRIMÉE !', 'notif-single');
    } else if (type === 'shield') {
      this.isShieldActive = true;
      showNotification('🛡️ BOUCLIER ACTIVÉ !', 'notif-level');
    }

    if (window._tetrisController && window._tetrisController.audio) {
      window._tetrisController.audio.playPowerUp();
    }
    return true;
  }

  _lock() {
    const p = this.currentPiece;
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        const by = p.y + r;
        const bx = p.x + c;
        if (by < 0) continue;
        this.board[by][bx] = p.color;
      }
    }

    const cleared = this._clearLines();
    this.spawnPiece();
    return cleared;
  }

  _clearLines() {
    const full = [];
    for (let r = 0; r < BOARD_H; r++) {
      if (this.board[r].every(c => c !== 0)) full.push(r);
    }

    const linesCleared = full.length;
    const isTSpin = this.lastWasRotation && this.tSpinType !== null;

    if (isTSpin) this.totalTSpins++;
    if (linesCleared === 4) this.totalTetrises++;

    if (linesCleared === 0) {
      this.combo = 0;
      return { linesCleared: 0, levelUp: false, linesRows: [], isTSpin, isBackToBack: false };
    }

    // Calcul Combo & Back to Back
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const isDifficult = isTSpin || linesCleared === 4;
    const isB2B = isDifficult && this.backToBack;
    this.backToBack = isDifficult;

    this.board = this.board.filter((_, r) => !full.includes(r));
    while (this.board.length < BOARD_H) {
      this.board.unshift(Array(BOARD_W).fill(0));
    }

    // Score avancé
    let pts = LINE_SCORES[linesCleared] * this.level;
    if (isTSpin) pts += 400 * (linesCleared + 1) * this.level;
    if (isB2B) pts = Math.floor(pts * 1.5);
    if (this.combo > 1) pts += 50 * (this.combo - 1) * this.level;

    this.score += pts;
    this.lines += linesCleared;
    this.totalLinesForLevel += linesCleared;

    // Gain d'XP
    if (window._progressionManager) {
      window._progressionManager.addXP(pts / 10 + linesCleared * 20);
    }

    // Montée de niveau
    let levelUp = false;
    if (this.mode === 'classic' || this.mode === 'endless') {
      if (this.totalLinesForLevel >= LINES_PER_LEVEL) {
        this.totalLinesForLevel -= LINES_PER_LEVEL;
        this.level++;
        if (this.mode !== 'endless' && this.level > 15) this.level = 15;
        levelUp = true;
      }
    }

    return {
      linesCleared,
      levelUp,
      linesRows: full,
      isTSpin,
      tSpinType: this.tSpinType,
      isBackToBack: isB2B,
      combo: this.combo
    };
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let drop = 0;
    while (!this._collides(this.currentPiece, 0, drop + 1)) drop++;
    return this.currentPiece.y + drop;
  }

  _triggerGameOver() {
    this.gameOver = true;
    this.running = false;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('tetris3d_best', this.bestScore);
    }
    if (window._progressionManager) {
      window._progressionManager.recordGame(
        this.lines, this.score, this.level,
        this.totalTSpins, this.maxCombo, this.totalTetrises
      );
    }
  }
}

// ══════════════════════════════════════════
//  RENDERER 2D CANVAS — THÈMES & EFFETS
// ══════════════════════════════════════════

class TetrisRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = null;
    this.cellSize = 0;
    this.ox = 0; this.oy = 0;
    this.particles = [];
    this.options = { ghost: true, grid: true, shake: true, particles: 'high', theme: 'cyberpunk' };
    this._board = null;
    this._piece = null;
    this._ghostY = null;
    this._nextQueue = [];
  }

  init() {
    this.ctx = this.canvas.getContext('2d');
    this._computeLayout();
    window.addEventListener('resize', () => this._onResize());
  }

  setOptions(opts) {
    this.options = { ...this.options, ...opts };
    document.body.className = `theme-${this.options.theme}`;
  }

  _computeLayout() {
    const w = this.canvas.width || this.canvas.clientWidth || 400;
    const h = this.canvas.height || this.canvas.clientHeight || 700;
    const cellW = Math.floor(w / BOARD_W);
    const cellH = Math.floor(h / BOARD_H);
    this.cellSize = Math.min(cellW, cellH);
    this.ox = Math.floor((w - this.cellSize * BOARD_W) / 2);
    this.oy = Math.floor((h - this.cellSize * BOARD_H) / 2);
  }

  _onResize() {
    const c = this.canvas.parentElement;
    if (!c) return;
    this.canvas.width = c.clientWidth;
    this.canvas.height = c.clientHeight;
    this._computeLayout();
    this._render();
  }

  updateBoard(board) { this._board = board; if (this.ctx) this._render(); }
  updatePiece(piece, ghostY, nextQueue) {
    this._piece = piece; this._ghostY = ghostY; this._nextQueue = nextQueue || [];
    if (this.ctx) this._render();
  }

  spawnParticles(rows) {
    if (this.options.particles === 'low') return;
    const colors = Object.values(PIECE_COLORS);
    for (let i = 0; i < 35; i++) {
      const row = rows[Math.floor(Math.random() * rows.length)];
      const col = Math.random() * BOARD_W;
      const col6 = colors[Math.floor(Math.random() * colors.length)].toString(16).padStart(6, '0');
      this.particles.push({
        x: this.ox + col * this.cellSize + this.cellSize / 2,
        y: this.oy + row * this.cellSize + this.cellSize / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        color: '#' + col6,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 5
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _drawBlock(x, y, cs, colorKey, alpha = 1.0, ghost = false) {
    const ctx = this.ctx;
    const hex = '#' + PIECE_COLORS[colorKey].toString(16).padStart(6, '0');
    const pad = 1;
    const sz = cs - pad * 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (ghost) {
      ctx.strokeStyle = hex; ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(x + pad + 0.5, y + pad + 0.5, sz - 1, sz - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = hex + '20';
      ctx.fillRect(x + pad, y + pad, sz, sz);
    } else {
      ctx.shadowColor = hex; ctx.shadowBlur = 12;
      const grad = ctx.createLinearGradient(x + pad, y + pad, x + pad + sz, y + pad + sz);
      grad.addColorStop(0, hex);
      grad.addColorStop(1, this._darken(hex, 0.5));
      ctx.fillStyle = grad;
      ctx.fillRect(x + pad, y + pad, sz, sz);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + pad, y + pad, sz, sz * 0.35);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + pad + 0.5, y + pad + 0.5, sz - 1, sz - 1);
    }
    ctx.restore();
  }

  _darken(hex, f) {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * f);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * f);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * f);
    return `rgb(${r},${g},${b})`;
  }

  _render() {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const ox = this.ox, oy = this.oy;
    const bw = cs * BOARD_W, bh = cs * BOARD_H;
    const W = this.canvas.width, H = this.canvas.height;

    ctx.fillStyle = '#07071a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0e0e2e'; ctx.fillRect(ox, oy, bw, bh);

    // Grille
    if (this.options.grid) {
      ctx.strokeStyle = 'rgba(80, 55, 160, 0.4)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= BOARD_W; x++) {
        ctx.beginPath(); ctx.moveTo(ox + x * cs, oy); ctx.lineTo(ox + x * cs, oy + bh); ctx.stroke();
      }
      for (let y = 0; y <= BOARD_H; y++) {
        ctx.beginPath(); ctx.moveTo(ox, oy + y * cs); ctx.lineTo(ox + bw, oy + y * cs); ctx.stroke();
      }
    }

    // Blocs posés
    if (this._board) {
      for (let r = 0; r < BOARD_H; r++) {
        for (let c = 0; c < BOARD_W; c++) {
          if (this._board[r][c]) {
            this._drawBlock(ox + c * cs, oy + r * cs, cs, this._board[r][c]);
          }
        }
      }
    }

    // Fantôme
    if (this.options.ghost && this._piece && this._ghostY !== null && this._ghostY !== this._piece.y) {
      const p = this._piece;
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c]) {
            this._drawBlock(ox + (p.x + c) * cs, oy + (this._ghostY + r) * cs, cs, p.color, 0.5, true);
          }
        }
      }
    }

    // Pièce active
    if (this._piece) {
      const p = this._piece;
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c]) {
            this._drawBlock(ox + (p.x + c) * cs, oy + (p.y + r) * cs, cs, p.color);
          }
        }
      }
    }

    // Bordure
    ctx.shadowColor = '#7c4fff'; ctx.shadowBlur = 14;
    ctx.strokeStyle = '#7c4fff'; ctx.lineWidth = 2.5;
    ctx.strokeRect(ox, oy, bw, bh); ctx.shadowBlur = 0;

    // Particules
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;
  }

  animate(dt) {
    this.updateParticles();
    this._render();
  }
}

// ══════════════════════════════════════════
//  CINÉMATIQUE INTRO 3D
// ══════════════════════════════════════════

class IntroCinematic {
  constructor(controller) {
    this.controller = controller;
    this.canvas = document.getElementById('intro-canvas');
    this.ctx = null;
    this.screenEl = document.getElementById('intro-screen');
    this.titleGroup = document.getElementById('intro-title-group');
    this.skipBtn = document.getElementById('skip-intro-btn');
    this.running = false;
    this.animId = null;
    this.startTime = 0;
    this.duration = 7.5;
    this.fallingBlocks = [];
    this.particles = [];
    this._setupEvents();
  }

  _setupEvents() {
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', (e) => { e.stopPropagation(); this.stop(); });
    }
    this.screenEl.addEventListener('click', () => this.stop());
    window.addEventListener('keydown', (e) => {
      if (this.running && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) this.stop();
    });
  }

  async play() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.running = true;
    this.screenEl.classList.remove('hidden');
    if (this.titleGroup) this.titleGroup.classList.add('hidden');

    this._onResize();
    this.fallingBlocks = [];
    this.particles = [];
    this._prepareBuildingSequence();

    if (this.controller && this.controller.audio) {
      if (!this.controller.audio.ctx) await this.controller.audio.init();
      this.controller.audio.startIntroMusic();
    }

    this.startTime = performance.now();
    this._loop(this.startTime);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.controller && this.controller.audio) this.controller.audio.stopIntroMusic();
    this.screenEl.classList.add('hidden');
    if (this.controller) {
      this.controller.ui.startScreen.classList.remove('hidden');
      this.controller.renderLeaderboards();
    }
  }

  _onResize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _prepareBuildingSequence() {
    const colors = Object.keys(PIECE_COLORS);
    const W = 8, H = 10;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const colorKey = colors[(r + c) % colors.length];
        this.fallingBlocks.push({
          targetR: r, targetC: c, color: colorKey,
          delay: 1.0 + (H - 1 - r) * 0.25 + (c % 2) * 0.05,
          landed: false, currentY: -100, speed: 1300
        });
      }
    }
  }

  _loop(timestamp) {
    if (!this.running) return;
    const elapsed = (timestamp - this.startTime) / 1000;
    this._render(elapsed);
    if (elapsed >= this.duration) { setTimeout(() => this.stop(), 800); return; }
    this.animId = requestAnimationFrame((ts) => this._loop(ts));
  }

  _render(t) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04040e'; ctx.fillRect(0, 0, W, H);

    const horizon = H * 0.82;
    const bw = 8, bh = 10;
    const blockSz = Math.min(Math.floor(W / 18), Math.floor((H * 0.55) / bh));
    const startX = Math.floor((W - bw * blockSz) / 2);
    const startY = horizon - bh * blockSz;

    this.fallingBlocks.forEach((b) => {
      const targetY = startY + b.targetR * blockSz;
      const targetX = startX + b.targetC * blockSz;

      if (t >= b.delay && !b.landed) {
        if (b.currentY === -100) {
          b.currentY = -50;
          if (this.controller && this.controller.audio && b.targetC === 0) {
            this.controller.audio.playIntroImpact();
          }
        }
        b.currentY += b.speed * 0.016;
        if (b.currentY >= targetY) {
          b.currentY = targetY; b.landed = true;
          if (this.controller && this.controller.audio && b.targetC % 3 === 0) {
            this.controller.audio.playGlassBreak();
          }
        }
        const hex = '#' + PIECE_COLORS[b.color].toString(16).padStart(6, '0');
        ctx.fillStyle = hex + '88'; ctx.fillRect(targetX + 2, b.currentY - 20, blockSz - 4, 20);
        ctx.fillStyle = hex; ctx.fillRect(targetX + 1, b.currentY + 1, blockSz - 2, blockSz - 2);
      } else if (b.landed) {
        const hex = '#' + PIECE_COLORS[b.color].toString(16).padStart(6, '0');
        ctx.fillStyle = hex; ctx.fillRect(targetX + 1, targetY + 1, blockSz - 2, blockSz - 2);
      }
    });

    if (t >= 5.5 && this.titleGroup && this.titleGroup.classList.contains('hidden')) {
      this.titleGroup.classList.remove('hidden');
      if (this.controller && this.controller.audio) this.controller.audio.playIntroClimax();
    }
  }
}

// ══════════════════════════════════════════
//  DICTIONNAIRE TRADUCTION MULTILINGUE (i18n)
// ══════════════════════════════════════════

const TRANSLATIONS = {
  fr: {
    skip_intro: "PASSER L'INTRO ⏭",
    start_btn: "▶ JOUER",
    scores_btn: "🏆 SCORES",
    achievements_btn: "🎖️ SUCCÈS",
    stats_btn: "📊 STATS",
    options_btn: "⚙️ OPTIONS",
    replay_intro: "🎬 INTRO",
    created_by: "CRÉÉ PAR",
    game_mode: "MODE DE JEU :",
    initial_level: "Niveau initial :",
    gameover_title: "GAME OVER",
    final_score: "SCORE",
    final_level: "NIVEAU",
    final_lines: "LIGNES",
    enter_initials: "ENTRER VOS INITIALES (3 LETTRES)",
    save_btn: "ENREGISTRER",
    restart_btn: "↺ REJOUER",
    menu_btn: "⌂ MENU",
    back_btn: "← RETOUR",
    pause_title: "PAUSE",
    resume_btn: "▶ REPRENDRE",
    score_label: "SCORE",
    best_label: "MEILLEUR",
    lines_label: "LIGNES",
    level_label: "NIVEAU",
    hold_label: "RÉSERVE (HOLD / C)",
    next_label: "SUIVANTS",
    timer_label: "TEMPS RESTANT",
    audio_label: "🎵 AUDIO & MUSIQUE",
    track_label: "PISTE ACTUELLE",
    next_track_btn: "⏭ CHANGER DE PISTE",
    volume_label: "VOLUME",
    music_label: "Musique",
    voice_label: "Voix",
    speed_label: "VITESSE",
    quit_btn: "⏹ QUITTER",
    opt_title: "⚙️ OPTIONS AVANCÉES",
    opt_music_title: "🎵 Musique & Rotation Auto (30s)",
    opt_automusic: "Changement Auto de Musique :",
    opt_interval: "Intervalle de Rotation :",
    opt_lang_title: "🌐 Langue / Language",
    opt_lang_label: "Langue de l'interface :",
    opt_fx_title: "🎮 Visuel & Effets de Jeu",
    opt_ghost: "Fantôme de Pièce (Ghost Piece) :",
    opt_grid: "Grille du Plateau :",
    opt_shake: "Secousse d'écran (Screen Shake) :",
    opt_particles: "Effets de Particules :",
    opt_high: "Élevé",
    opt_low: "Faible",
    opt_theme_title: "🎨 Thème Visuel",
    opt_theme_label: "Style de Thème :",
    opt_save: "✔ SAUVEGARDER & APPLIQUER",
    ach_title: "🎖️ ACCOMPLISSEMENTS & SUCCÈS",
    stats_title: "📊 STATISTIQUES DU JOUEUR",
    scores_title: "🏆 TOP MEILLEURS SCORES"
  },
  en: {
    skip_intro: "SKIP INTRO ⏭",
    start_btn: "▶ PLAY",
    scores_btn: "🏆 SCORES",
    achievements_btn: "🎖️ ACHIEVEMENTS",
    stats_btn: "📊 STATS",
    options_btn: "⚙️ SETTINGS",
    replay_intro: "🎬 INTRO",
    created_by: "CREATED BY",
    game_mode: "GAME MODE:",
    initial_level: "Starting Level:",
    gameover_title: "GAME OVER",
    final_score: "SCORE",
    final_level: "LEVEL",
    final_lines: "LINES",
    enter_initials: "ENTER INITIALS (3 LETTERS)",
    save_btn: "SAVE",
    restart_btn: "↺ REPLAY",
    menu_btn: "⌂ MENU",
    back_btn: "← BACK",
    pause_title: "PAUSE",
    resume_btn: "▶ RESUME",
    score_label: "SCORE",
    best_label: "BEST",
    lines_label: "LINES",
    level_label: "LEVEL",
    hold_label: "HOLD (C)",
    next_label: "NEXT",
    timer_label: "TIME LEFT",
    audio_label: "🎵 AUDIO & MUSIC",
    track_label: "CURRENT TRACK",
    next_track_btn: "⏭ NEXT TRACK",
    volume_label: "VOLUME",
    music_label: "Music",
    voice_label: "Voice",
    speed_label: "SPEED",
    quit_btn: "⏹ QUIT",
    opt_title: "⚙️ ADVANCED SETTINGS",
    opt_music_title: "🎵 Music & Auto-Switch (30s)",
    opt_automusic: "Auto Music Switch:",
    opt_interval: "Switch Interval:",
    opt_lang_title: "🌐 Language",
    opt_lang_label: "Interface Language:",
    opt_fx_title: "🎮 Visual & Game FX",
    opt_ghost: "Ghost Piece:",
    opt_grid: "Board Grid:",
    opt_shake: "Screen Shake:",
    opt_particles: "Particle FX:",
    opt_high: "High",
    opt_low: "Low",
    opt_theme_title: "🎨 Visual Theme",
    opt_theme_label: "Theme Style:",
    opt_save: "✔ SAVE & APPLY",
    ach_title: "🎖️ ACHIEVEMENTS",
    stats_title: "📊 PLAYER STATISTICS",
    scores_title: "🏆 TOP HIGH SCORES"
  },
  ar: {
    skip_intro: "تخطي المقدمة ⏭",
    start_btn: "▶ ابدأ اللعب",
    scores_btn: "🏆 النقاط",
    achievements_btn: "🎖️ الإنجازات",
    stats_btn: "📊 الإحصائيات",
    options_btn: "⚙️ الإعدادات",
    replay_intro: "🎬 المقدمة",
    created_by: "تطوير",
    game_mode: "نمط اللعبة:",
    initial_level: "المستوى الأولي:",
    gameover_title: "انتهت اللعبة",
    final_score: "النتيجة",
    final_level: "المستوى",
    final_lines: "الصفوف",
    enter_initials: "أدخل أحرفك (3 أحرف)",
    save_btn: "حفظ",
    restart_btn: "↺ إعادة اللعب",
    menu_btn: "⌂ القائمة",
    back_btn: "← العودة",
    pause_title: "إيقاف مؤقت",
    resume_btn: "▶ استئناف",
    score_label: "النتيجة",
    best_label: "الأفضل",
    lines_label: "الصفوف",
    level_label: "المستوى",
    hold_label: "احتفاظ (C)",
    next_label: "التالي",
    timer_label: "الوقت المتبقي",
    audio_label: "🎵 الصوت والموسيقى",
    track_label: "المقطوعة الحالية",
    next_track_btn: "⏭ المقطوعة التالية",
    volume_label: "مستوى الصوت",
    music_label: "الموسيقى",
    voice_label: "الصوت",
    speed_label: "السرعة",
    quit_btn: "⏹ خروج",
    opt_title: "⚙️ خيارات متقدمة",
    opt_music_title: "🎵 الموسيقى والتبديل التلقائي (30ث)",
    opt_automusic: "تبديل الموسيقى تلقائياً:",
    opt_interval: "معدل التبديل:",
    opt_lang_title: "🌐 اللغة / Language",
    opt_lang_label: "لغة الواجهة:",
    opt_fx_title: "🎮 المؤثرات البصرية",
    opt_ghost: "القطعة الظلية:",
    opt_grid: "شبكة اللوحة:",
    opt_shake: "اهتزاز الشاشة:",
    opt_particles: "مؤثرات الجسيمات:",
    opt_high: "عالي",
    opt_low: "منخفض",
    opt_theme_title: "🎨 المظهر البصري",
    opt_theme_label: "نمط المظهر:",
    opt_save: "✔ حفظ وتطبيق",
    ach_title: "🎖️ الإنجازات",
    stats_title: "📊 إحصائيات اللاعب",
    scores_title: "🏆 أفضل النقاط"
  },
  es: {
    skip_intro: "SALTAR INTRO ⏭",
    start_btn: "▶ JUGAR",
    scores_btn: "🏆 SCORES",
    achievements_btn: "🎖️ LOGROS",
    stats_btn: "📊 ESTADÍSTICAS",
    options_btn: "⚙️ OPCIONES",
    replay_intro: "🎬 INTRO",
    created_by: "CREADO POR",
    game_mode: "MODO DE JUEGO:",
    initial_level: "Nivel Inicial:",
    gameover_title: "GAME OVER",
    final_score: "PUNTUACIÓN",
    final_level: "NIVEL",
    final_lines: "LÍNEAS",
    enter_initials: "INICIALES (3 LETRAS)",
    save_btn: "GUARDAR",
    restart_btn: "↺ REJUGAR",
    menu_btn: "⌂ MENÚ",
    back_btn: "← VOLVER",
    pause_title: "PAUSA",
    resume_btn: "▶ REANUDAR",
    score_label: "PUNTUACIÓN",
    best_label: "MEJOR",
    lines_label: "LÍNEAS",
    level_label: "NIVEL",
    hold_label: "RESERVA (C)",
    next_label: "SIGUIENTES",
    timer_label: "TIEMPO RESTANTE",
    audio_label: "🎵 AUDIO Y MÚSICA",
    track_label: "PISTA ACTUAL",
    next_track_btn: "⏭ CAMBIAR PISTA",
    volume_label: "VOLUMEN",
    music_label: "Música",
    voice_label: "Voz",
    speed_label: "VELOCIDAD",
    quit_btn: "⏹ SALIR",
    opt_title: "⚙️ OPCIONES AVANZADAS",
    opt_music_title: "🎵 Música y Auto-Cambio (30s)",
    opt_automusic: "Cambio Auto de Música:",
    opt_interval: "Intervalo de Cambio:",
    opt_lang_title: "🌐 Idioma / Language",
    opt_lang_label: "Idioma de la Interfaz:",
    opt_fx_title: "🎮 Efectos Visuales",
    opt_ghost: "Pieza Fantasma:",
    opt_grid: "Rejilla del Tablero:",
    opt_shake: "Vibración de Pantalla:",
    opt_particles: "Efectos de Partículas:",
    opt_high: "Alto",
    opt_low: "Bajo",
    opt_theme_title: "🎨 Tema Visual",
    opt_theme_label: "Estilo de Tema:",
    opt_save: "✔ GUARDAR Y APLICAR",
    ach_title: "🎖️ LOGROS",
    stats_title: "📊 ESTADÍSTICAS",
    scores_title: "🏆 TOP MEJORES SCORES"
  }
};

// ══════════════════════════════════════════
//  MINI CANVAS (NEXT & HOLD)
// ══════════════════════════════════════════

function drawMiniPiece(canvas, pieceInfo) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, w, h);
  if (!pieceInfo) return;

  const shape = pieceInfo.shape || PIECES[pieceInfo.type].shape;
  const color = pieceInfo.color;
  const hex = '#' + PIECE_COLORS[color].toString(16).padStart(6, '0');

  const cols = shape[0].length, rows = shape.length;
  const cellSize = Math.min(Math.floor((w - 16) / cols), Math.floor((h - 16) / rows));
  const offsetX = Math.floor((w - cols * cellSize) / 2);
  const offsetY = Math.floor((h - rows * cellSize) / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c]) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        ctx.fillStyle = hex; ctx.shadowColor = hex; ctx.shadowBlur = 10;
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4); ctx.shadowBlur = 0;
      }
    }
  }
}

// ══════════════════════════════════════════
//  CONTRÔLEUR PRINCIPAL (CONTROLLER)
// ══════════════════════════════════════════

class TetrisController {
  constructor() {
    this.game = new TetrisGame();
    this.renderer = null;
    this.audio = new TetrisAudio();
    this.voice = new TetrisVoice();
    this.progression = new ProgressionManager();
    window._progressionManager = this.progression;

    this.dropTimer = null;
    this.modeTimer = null;
    this.animId = null;
    this.prevTime = 0;
    this.startLevel = 1;
    this.selectedMode = 'classic';

    // Options utilisateur
    this.options = JSON.parse(localStorage.getItem('tetris3d_options') || JSON.stringify({
      autoMusic: true,
      autoMusicInterval: 30,
      ghost: true,
      grid: true,
      shake: true,
      particles: 'high',
      theme: 'cyberpunk',
      lang: 'fr'
    }));

    // UI elements
    this.ui = {
      scoreDisplay: document.getElementById('score-display'),
      bestDisplay: document.getElementById('best-display'),
      linesDisplay: document.getElementById('lines-display'),
      levelDisplay: document.getElementById('level-display'),
      levelBar: document.getElementById('level-bar'),
      speedDots: document.getElementById('speed-dots'),
      nextCanvas: document.getElementById('next-canvas'),
      holdCanvas: document.getElementById('hold-canvas'),
      startScreen: document.getElementById('start-screen'),
      gameOverScreen: document.getElementById('gameover-screen'),
      gameWrapper: document.getElementById('game-wrapper'),
      finalScore: document.getElementById('final-score'),
      finalLevel: document.getElementById('final-level'),
      finalLines: document.getElementById('final-lines'),
      pauseOverlay: document.getElementById('pause-overlay'),
      musicBtn: document.getElementById('music-btn'),
      trackBtn: document.getElementById('track-btn'),
      trackNameBadge: document.getElementById('track-name-badge'),
      volumeSlider: document.getElementById('volume-slider'),
      volumeValueText: document.getElementById('volume-value-text'),
      voiceBtn: document.getElementById('voice-btn'),
      initialsInput: document.getElementById('initials-input'),
      saveScoreBtn: document.getElementById('save-score-btn'),
      initialsBox: document.getElementById('initials-box'),
      modeTimerCard: document.getElementById('mode-timer-card'),
      modeTimerDisplay: document.getElementById('mode-timer-display')
    };

    this.intro = new IntroCinematic(this);
    this._bindEvents();
    this._bindOptionsEvents();
    this._bindTouchControls();
    this._buildSpeedDots();
    this.renderLeaderboards();
    this.applyOptions();

    if (this.ui.bestDisplay) this.ui.bestDisplay.textContent = this.game.bestScore.toLocaleString();
  }

  async initRenderer() {
    const canvas = document.getElementById('tetris-canvas');
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    this.renderer = new TetrisRenderer(canvas);
    this.renderer.init();
    this.renderer.setOptions(this.options);
  }

  applyOptions() {
    if (this.renderer) this.renderer.setOptions(this.options);
    document.body.className = `theme-${this.options.theme}`;
    if (this.options.lang === 'ar') {
      document.body.classList.add('rtl-mode');
    } else {
      document.body.classList.remove('rtl-mode');
    }
    this.audio.setAutoMusicInterval(this.options.autoMusic ? this.options.autoMusicInterval : 0);
    this.updateLanguageUI();
  }

  updateLanguageUI() {
    const lang = this.options.lang || 'fr';
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.fr;

    // Set active value in select
    const langSelect = document.getElementById('opt-lang');
    if (langSelect) langSelect.value = lang;

    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
  }

  _buildSpeedDots() {
    const c = this.ui.speedDots; if (!c) return;
    c.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const d = document.createElement('div');
      d.className = 'speed-dot'; d.id = `sdot-${i}`;
      c.appendChild(d);
    }
  }

  _updateSpeedDots(level) {
    for (let i = 0; i < 15; i++) {
      const d = document.getElementById(`sdot-${i}`);
      if (d) d.classList.toggle('active', i < level);
    }
  }

  _bindEvents() {
    document.addEventListener('keydown', (e) => this._onKey(e));

    // Bouton Jouer
    document.getElementById('start-btn').addEventListener('click', () => this._startGame());

    // Sélection de niveau
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.startLevel = parseInt(btn.dataset.level);
      });
    });

    // Sélection de mode de jeu
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMode = btn.dataset.mode;
        const descEl = document.getElementById('mode-description-text');
        const descs = {
          classic: 'Mode Classic : Progression standard et montée de niveau toutes les 10 lignes.',
          timeattack: 'Mode Time Attack : 2 minutes pour cumuler un maximum de points !',
          endless: 'Mode Endless : Difficulté infinie progressive sans limite de niveau.',
          survival: 'Mode Survival : Vitesse extrême qui accélère continuellement.',
          challenge: 'Mode Challenge : Réaliser des T-Spins, combos et 30,000 points.'
        };
        if (descEl) descEl.textContent = descs[this.selectedMode] || '';
      });
    });

    // Modaux
    this._setupModal('show-options-btn', 'advanced-options-modal', 'close-options-btn');
    const inGameOptBtn = document.getElementById('in-game-options-btn');
    if (inGameOptBtn) {
      inGameOptBtn.addEventListener('click', () => {
        document.getElementById('advanced-options-modal').classList.remove('hidden');
      });
    }

    this._setupModal('show-achievements-btn', 'achievements-modal', 'close-achievements-btn', () => this.renderAchievements());
    this._setupModal('show-stats-btn', 'stats-modal', 'close-stats-btn', () => this.renderStats());

    // Power-ups
    document.querySelectorAll('.powerup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pu = btn.dataset.powerup;
        this.game.usePowerUp(pu);
        this._renderBoard();
      });
    });

    // Intro & Game Over
    const replayIntroBtn = document.getElementById('replay-intro-btn');
    if (replayIntroBtn) replayIntroBtn.addEventListener('click', () => {
      this.ui.startScreen.classList.add('hidden');
      if (this.intro) this.intro.play();
    });

    document.getElementById('restart-btn').addEventListener('click', () => this._restartGame());
    document.getElementById('menu-btn').addEventListener('click', () => this._showMenu());
    document.getElementById('pause-btn').addEventListener('click', () => this._togglePause());
    document.getElementById('resume-btn').addEventListener('click', () => this._togglePause());
    document.getElementById('quit-btn').addEventListener('click', () => this._triggerGameOver());

    // Audio
    if (this.ui.musicBtn) {
      this.ui.musicBtn.addEventListener('click', () => {
        const muted = this.audio.toggleMute();
        this.ui.musicBtn.classList.toggle('muted', muted);
        this.ui.musicBtn.classList.toggle('active', !muted);
      });
    }

    if (this.ui.trackBtn) {
      this.ui.trackBtn.addEventListener('click', () => {
        const track = this.audio.nextTrack();
        if (this.ui.trackNameBadge) this.ui.trackNameBadge.textContent = track.name;
        showNotification(`PISTE : ${track.name}`, 'notif-level');
      });
    }

    if (this.ui.volumeSlider) {
      this.ui.volumeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        this.audio.setVolume(val);
        if (this.ui.volumeValueText) this.ui.volumeValueText.textContent = `${val}%`;
      });
    }

    if (this.ui.voiceBtn) {
      this.ui.voiceBtn.addEventListener('click', () => {
        const enabled = this.voice.toggle();
        this.ui.voiceBtn.classList.toggle('muted', !enabled);
        this.ui.voiceBtn.classList.toggle('active', enabled);
      });
    }

    if (this.ui.saveScoreBtn) this.ui.saveScoreBtn.addEventListener('click', () => this._handleSaveInitials());
  }

  _setupModal(openBtnId, modalId, closeBtnId, onOpen) {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);
    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        if (onOpen) onOpen();
      });
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
  }

  _bindOptionsEvents() {
    const saveBtn = document.getElementById('save-options-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.options.autoMusic = document.getElementById('opt-automusic').checked;
        this.options.autoMusicInterval = parseInt(document.getElementById('opt-music-interval').value);
        this.options.ghost = document.getElementById('opt-ghost').checked;
        this.options.grid = document.getElementById('opt-grid').checked;
        this.options.shake = document.getElementById('opt-shake').checked;
        this.options.particles = document.getElementById('opt-particles').value;
        this.options.theme = document.getElementById('opt-theme').value;
        this.options.lang = document.getElementById('opt-lang').value;

        localStorage.setItem('tetris3d_options', JSON.stringify(this.options));
        this.applyOptions();
        document.getElementById('advanced-options-modal').classList.add('hidden');
        showNotification('OPTIONS SAUVEGARDÉES !', 'notif-level');
      });
    }
  }

  _bindTouchControls() {
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); });
      el.addEventListener('click', (e) => { e.preventDefault(); fn(); });
    };

    bind('touch-left', () => { if (this.game.moveLeft()) { this.audio.playMove(); this._renderPiece(); } });
    bind('touch-right', () => { if (this.game.moveRight()) { this.audio.playMove(); this._renderPiece(); } });
    bind('touch-down', () => { this._softDrop(); });
    bind('touch-rotate', () => { if (this.game.rotate('CW')) { this.audio.playRotate(); this._renderPiece(); } });
    bind('touch-drop', () => { this.audio.playDrop(); this.game.hardDrop(); this._onPieceLocked(); });
    bind('touch-hold', () => {
      if (this.game.hold()) {
        this.audio.playHold();
        drawMiniPiece(this.ui.holdCanvas, this.game.heldPiece);
        this._renderPiece();
      }
    });
  }

  _onKey(e) {
    if (!this.game.running || this.game.gameOver) return;

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        if (this.game.moveLeft()) this.audio.playMove();
        this._renderPiece(); break;
      case 'ArrowRight':
        e.preventDefault();
        if (this.game.moveRight()) this.audio.playMove();
        this._renderPiece(); break;
      case 'ArrowDown':
        e.preventDefault(); this._softDrop(); break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.game.rotate('CW')) this.audio.playRotate();
        this._renderPiece(); break;
      case 'Space':
        e.preventDefault();
        this.audio.playDrop();
        this.game.hardDrop();
        if (this.options.shake) this._triggerScreenShake();
        this._onPieceLocked(); break;
      case 'KeyC': case 'ShiftLeft': case 'ShiftRight':
        e.preventDefault();
        if (this.game.hold()) {
          this.audio.playHold();
          drawMiniPiece(this.ui.holdCanvas, this.game.heldPiece);
          this._renderPiece();
        } break;
      case 'KeyP': this._togglePause(); break;
      case 'KeyM':
        const muted = this.audio.toggleMute();
        this.ui.musicBtn.classList.toggle('muted', muted);
        break;
      case 'Digit1': this.game.usePowerUp('bomb'); this._renderBoard(); break;
      case 'Digit2': this.game.usePowerUp('freeze'); this._renderBoard(); break;
      case 'Digit3': this.game.usePowerUp('clearline'); this._renderBoard(); break;
      case 'Digit4': this.game.usePowerUp('shield'); this._renderBoard(); break;
    }
  }

  _triggerScreenShake() {
    const w = this.ui.gameWrapper;
    if (!w) return;
    w.classList.remove('shake-screen');
    void w.offsetWidth;
    w.classList.add('shake-screen');
  }

  async _startGame() {
    if (this.intro && this.intro.running) this.intro.stop();
    if (!this.audio.ctx) await this.audio.init();

    this.ui.startScreen.classList.add('hidden');
    this.ui.gameOverScreen.classList.add('hidden');
    this.ui.gameWrapper.classList.remove('hidden');

    if (!this.renderer) await this.initRenderer();

    this.game.init(this.startLevel, this.selectedMode);
    this.audio.setLevel(this.game.level);
    this.audio.start();

    // Démarrer auto-switch musique 30s
    if (this.options.autoMusic) {
      this.audio.startAutoMusicSwitch((track) => {
        if (this.ui.trackNameBadge) this.ui.trackNameBadge.textContent = track.name;
        showNotification(`🎵 MUSIQUE (30s) : ${track.name}`, 'notif-double');
      });
    }

    // Gestion du timer du mode Time Attack
    if (this.selectedMode === 'timeattack') {
      if (this.ui.modeTimerCard) this.ui.modeTimerCard.classList.remove('hidden');
      this._startModeTimer();
    } else {
      if (this.ui.modeTimerCard) this.ui.modeTimerCard.classList.add('hidden');
    }

    this._updateUI();
    this._renderBoard();
    this._renderPiece();
    drawMiniPiece(this.ui.nextCanvas, this.game.nextQueue[0]);
    this._renderMultiNext();
    drawMiniPiece(this.ui.holdCanvas, null);

    this._startDropLoop();
    this._startRenderLoop();
  }

  _startModeTimer() {
    if (this.modeTimer) clearInterval(this.modeTimer);
    this.modeTimer = setInterval(() => {
      if (!this.game.running || this.game.paused || this.game.gameOver) return;
      this.game.modeTimeLeft--;
      const m = Math.floor(this.game.modeTimeLeft / 60);
      const s = this.game.modeTimeLeft % 60;
      if (this.ui.modeTimerDisplay) {
        this.ui.modeTimerDisplay.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      }
      if (this.game.modeTimeLeft <= 0) {
        clearInterval(this.modeTimer);
        showNotification('⏱ TIME ATTACK TERMINÉ !', 'notif-tetris');
        this._triggerGameOver();
      }
    }, 1000);
  }

  _restartGame() {
    this._stopLoops();
    this.ui.gameOverScreen.classList.add('hidden');
    this.ui.gameWrapper.classList.remove('hidden');

    this.game.init(this.startLevel, this.selectedMode);
    this.audio.setLevel(this.game.level);
    this.audio.start();

    if (this.options.autoMusic) {
      this.audio.startAutoMusicSwitch((track) => {
        if (this.ui.trackNameBadge) this.ui.trackNameBadge.textContent = track.name;
        showNotification(`🎵 MUSIQUE : ${track.name}`, 'notif-double');
      });
    }

    this._updateUI();
    this._renderBoard();
    this._renderPiece();
    drawMiniPiece(this.ui.nextCanvas, this.game.nextQueue[0]);
    this._renderMultiNext();
    drawMiniPiece(this.ui.holdCanvas, null);
    this._startDropLoop();
    this._startRenderLoop();
  }

  _showMenu() {
    this._stopLoops();
    this.audio.stop();
    this.audio.stopAutoMusicSwitch();
    this.renderLeaderboards();
    this.ui.gameOverScreen.classList.add('hidden');
    this.ui.gameWrapper.classList.add('hidden');
    this.ui.startScreen.classList.remove('hidden');
  }

  _triggerGameOver() {
    if (this._gameOverShown) return;
    this._gameOverShown = true;
    if (!this.game.gameOver) this.game._triggerGameOver();

    this._stopLoops();
    this.audio.stop();
    this.audio.stopAutoMusicSwitch();
    this.audio.playGameOver();
    this.voice.onGameOver();

    setTimeout(() => {
      this.game.running = false;
      this._stopLoops();
      this.ui.gameWrapper.classList.add('hidden');
      this.ui.finalScore.textContent = this.game.score.toLocaleString();
      this.ui.finalLevel.textContent = this.game.level;
      this.ui.finalLines.textContent = this.game.lines;

      if (this.ui.initialsBox) {
        this.ui.initialsBox.style.display = this.game.score > 0 ? 'flex' : 'none';
        if (this.ui.initialsInput) {
          this.ui.initialsInput.value = localStorage.getItem('tetris3d_last_initials') || 'YCN';
        }
      }
      this.renderLeaderboards();
      this.ui.gameOverScreen.classList.remove('hidden');
      this._gameOverShown = false;
    }, 600);
  }

  _togglePause() {
    if (this.game.gameOver || !this.game.running) return;
    this.game.paused = !this.game.paused;
    if (this.game.paused) {
      clearTimeout(this.dropTimer);
      this.ui.pauseOverlay.classList.remove('hidden');
    } else {
      this.ui.pauseOverlay.classList.add('hidden');
      this._startDropLoop();
    }
  }

  _startDropLoop() {
    clearTimeout(this.dropTimer);
    const speed = getLevelSpeed(this.game.level, this.game.isFreezeActive);
    this.dropTimer = setTimeout(() => this._dropTick(), speed);
  }

  _dropTick() {
    if (this.game.paused || this.game.gameOver || !this.game.running) return;
    const moved = this.game.moveDown();
    if (!moved) this._onPieceLocked();
    else this._renderPiece();
    this._startDropLoop();
  }

  _softDrop() {
    if (this.game.paused) return;
    clearTimeout(this.dropTimer);
    const moved = this.game.moveDown();
    if (!moved) {
      this._onPieceLocked();
      this._startDropLoop();
    } else {
      this._renderPiece();
      this.game.score += 1;
      this._updateScore();
      this._startDropLoop();
    }
  }

  _onPieceLocked() {
    if (this.game.gameOver) { this._triggerGameOver(); return; }

    const result = this.game.lastClearResult;
    this.game.lastClearResult = null;

    const linesCleared = result ? result.linesCleared : 0;
    const leveledUp = result ? result.levelUp : false;
    const combo = result ? result.combo : 0;
    const isTSpin = result ? result.isTSpin : false;
    const isB2B = result ? result.isBackToBack : false;

    if (isTSpin) {
      this.audio.playTSpin();
      showNotification('🎯 T-SPIN !', 'notif-tspin');
      this.voice.speakText('T-Spin Waa3r !');
    }

    if (isB2B) {
      this.audio.playBackToBack();
      setTimeout(() => showNotification('⚡ BACK-TO-BACK !', 'notif-b2b'), 300);
    }

    if (linesCleared > 0) {
      if (this.options.shake) this._triggerScreenShake();
      const notifMap = ['', 'NADI !', 'JOOJ NADIN !', 'TLATA WA3RIN !', 'TETRIS A SAT !'];
      const clsMap = ['', 'notif-single', 'notif-double', 'notif-triple', 'notif-tetris'];
      showNotification(notifMap[Math.min(linesCleared, 4)] || 'TETRIS !', clsMap[Math.min(linesCleared, 4)]);

      if (combo >= 2) {
        setTimeout(() => showNotification(`COMBO x${combo} !`, 'notif-double'), 350);
      }
      this.audio.playLineClear(linesCleared);
      this.renderer.spawnParticles([Math.floor(BOARD_H / 2)]);
      this.voice.onClear(linesCleared, combo);
    }

    if (leveledUp) {
      this.audio.playLevelUp();
      this.audio.setLevel(this.game.level);
      showNotification(`NIVEAU ${this.game.level} !`, 'notif-level');
      this.voice.onLevelUp(this.game.level);
    }

    this._updateUI();
    this._renderBoard();
    this._renderPiece();
    drawMiniPiece(this.ui.nextCanvas, this.game.nextQueue[0]);
    this._renderMultiNext();
    drawMiniPiece(this.ui.holdCanvas, this.game.heldPiece);
  }

  _renderMultiNext() {
    const c = document.getElementById('multi-next-container');
    if (!c) return;
    c.innerHTML = '';
    for (let i = 1; i < this.game.nextQueue.length; i++) {
      const cvs = document.createElement('canvas');
      cvs.width = 60; cvs.height = 60;
      c.appendChild(cvs);
      drawMiniPiece(cvs, this.game.nextQueue[i]);
    }
  }

  _renderBoard() { if (this.renderer) this.renderer.updateBoard(this.game.board); }
  _renderPiece() {
    if (this.renderer && this.game.currentPiece) {
      this.renderer.updatePiece(this.game.currentPiece, this.game.getGhostY(), this.game.nextQueue);
    }
  }

  _updateUI() {
    this._updateScore();
    if (this.ui.linesDisplay) this.ui.linesDisplay.textContent = this.game.lines.toLocaleString();
    if (this.ui.levelDisplay) this.ui.levelDisplay.textContent = this.game.level;

    const pct = (this.game.totalLinesForLevel / LINES_PER_LEVEL) * 100;
    if (this.ui.levelBar) this.ui.levelBar.style.width = `${pct}%`;
    this._updateSpeedDots(this.game.level);
  }

  _updateScore() {
    const scoreEl = this.ui.scoreDisplay;
    if (scoreEl) {
      scoreEl.textContent = this.game.score.toLocaleString();
      scoreEl.classList.remove('score-pop'); void scoreEl.offsetWidth; scoreEl.classList.add('score-pop');
    }
    const best = Math.max(this.game.bestScore, this.game.score);
    if (this.ui.bestDisplay) this.ui.bestDisplay.textContent = best.toLocaleString();
  }

  renderLeaderboards() {
    const list = this.getLeaderboard();
    const renderList = (elementId, maxCount = 5) => {
      const container = document.getElementById(elementId);
      if (!container) return;
      container.innerHTML = '';
      list.slice(0, maxCount).forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = `leaderboard-row rank-${idx + 1}`;
        row.innerHTML = `
          <span class="lb-rank">#${idx + 1}</span>
          <span class="lb-name">${item.name}</span>
          <span class="lb-score">${item.score.toLocaleString()} PTS</span>
          <span class="lb-level">LVL ${item.level}</span>
        `;
        container.appendChild(row);
      });
    };
    renderList('start-leaderboard-list', 5);
    renderList('gameover-leaderboard-list', 5);
  }

  renderAchievements() {
    const container = document.getElementById('achievements-list-container');
    if (!container) return;
    container.innerHTML = '';
    this.progression.achievements.forEach(ach => {
      const card = document.createElement('div');
      card.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <h4>${ach.name}</h4>
          <p>${ach.desc}</p>
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderStats() {
    const container = document.getElementById('stats-content-container');
    if (!container) return;
    const s = this.progression.stats;
    container.innerHTML = `
      <div class="stat-box"><div class="s-val">${s.gamesPlayed}</div><div class="s-lbl">Parties Jouées</div></div>
      <div class="stat-box"><div class="s-val">${s.linesCleared}</div><div class="s-lbl">Lignes Effacées</div></div>
      <div class="stat-box"><div class="s-val">${s.totalScore.toLocaleString()}</div><div class="s-lbl">Score Cumulé</div></div>
      <div class="stat-box"><div class="s-val">${s.tSpins}</div><div class="s-lbl">T-Spins Réalisés</div></div>
      <div class="stat-box"><div class="s-val">${s.tetrises}</div><div class="s-lbl">Tetrises (4 Lignes)</div></div>
      <div class="stat-box"><div class="s-val">x${s.maxCombo}</div><div class="s-lbl">Combo Maximum</div></div>
    `;
  }

  getLeaderboard() {
    try {
      const data = localStorage.getItem('tetris3d_leaderboard');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      { name: 'YCN', score: 25000, level: 12 },
      { name: 'PRO', score: 18000, level: 9 },
      { name: 'TET', score: 12000, level: 7 }
    ];
  }

  saveScore(name, score, level) {
    let list = this.getLeaderboard();
    list.push({ name: name || 'YCN', score: score || 0, level: level || 1, date: Date.now() });
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);
    localStorage.setItem('tetris3d_leaderboard', JSON.stringify(list));
    localStorage.setItem('tetris3d_last_initials', name);
    return list;
  }

  _handleSaveInitials() {
    let name = (this.ui.initialsInput ? this.ui.initialsInput.value.trim() : 'YCN').toUpperCase();
    if (!name) name = 'YCN';
    this.saveScore(name, this.game.score, this.game.level);
    if (this.ui.initialsBox) this.ui.initialsBox.style.display = 'none';
    this.renderLeaderboards();
    showNotification(`SCORE ENREGISTRÉ POUR ${name} !`, 'notif-single');
  }

  _startRenderLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    const loop = (ts) => {
      if (!this.game.running && !this.game.gameOver) {
        this.animId = null; return;
      }
      const dt = Math.min((ts - this.prevTime) / 1000, 0.1);
      this.prevTime = ts;
      if (this.renderer) this.renderer.animate(dt);
      this.animId = requestAnimationFrame(loop);
    };
    this.prevTime = performance.now();
    this.animId = requestAnimationFrame(loop);
  }

  _stopLoops() {
    if (this.dropTimer) { clearTimeout(this.dropTimer); this.dropTimer = null; }
    if (this.modeTimer) { clearInterval(this.modeTimer); this.modeTimer = null; }
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
  }
}

// ══════════════════════════════════════════
//  DÉMARRAGE AUTOMATIQUE DU JEU
// ══════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  const ctrl = new TetrisController();
  window._tetrisController = ctrl;
  if (ctrl.intro) ctrl.intro.play();
});
