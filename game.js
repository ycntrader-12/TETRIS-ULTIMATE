/**
 * TETRIS ULTIMATE — Moteur de jeu 2D Canvas
 * by ycntrader-12
 */

// ══════════════════════════════════════════
//  CONSTANTES TETRIS
// ══════════════════════════════════════════

const BOARD_W = 10;
const BOARD_H = 20;
const CELL = 1.0; // taille d'un bloc 3D

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
  I: { shape: [[1,1,1,1]], color: 'I' },
  O: { shape: [[1,1],[1,1]], color: 'O' },
  T: { shape: [[0,1,0],[1,1,1]], color: 'T' },
  S: { shape: [[0,1,1],[1,1,0]], color: 'S' },
  Z: { shape: [[1,1,0],[0,1,1]], color: 'Z' },
  L: { shape: [[1,0],[1,0],[1,1]], color: 'L' },
  J: { shape: [[0,1],[0,1],[1,1]], color: 'J' }
};

const PIECE_TYPES = Object.keys(PIECES);

// Points par lignes effacées
const LINE_SCORES = [0, 100, 300, 500, 800];
// Lignes nécessaires pour monter de niveau
const LINES_PER_LEVEL = 10;

// Vitesse de chute (ms) par niveau
function getLevelSpeed(level) {
  return Math.max(80, 1000 - (level - 1) * 70);
}

// ══════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════

function rotateCW(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = [];
  for (let c = 0; c < cols; c++) {
    result.push([]);
    for (let r = rows - 1; r >= 0; r--) {
      result[c].push(matrix[r][c]);
    }
  }
  return result;
}

function deepCopy(board) {
  return board.map(row => [...row]);
}

function showNotification(text, cls) {
  const c = document.getElementById('notification-container');
  const el = document.createElement('div');
  el.className = `notification ${cls}`;
  el.textContent = text;
  c.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

// ══════════════════════════════════════════
//  TETRIS GAME ENGINE
// ══════════════════════════════════════════

class TetrisGame {
  constructor() {
    // Board: 0 = vide, sinon string de couleur
    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.heldPiece = null;
    this.holdUsed = false;
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('tetris3d_best') || '0');
    this.lines = 0;
    this.level = 1;
    this.startLevel = 1;
    this.gameOver = false;
    this.paused = false;
    this.dropTimer = null;
    this.totalLinesForLevel = 0;
    this.running = false;
    this.bag = [];
    this.combo = 0;   // Compteur de combos (effacements consécutifs)
  }

  init(startLevel = 1) {
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

    this.nextPiece = this._newPiece();
    this.spawnPiece();
  }

  _newPiece() {
    // 7-bag randomizer
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
      x: Math.floor(BOARD_W / 2) - Math.floor(def.shape[0].length / 2),
      y: 0
    };
  }

  spawnPiece() {
    this.currentPiece = this.nextPiece;
    this.currentPiece.x = Math.floor(BOARD_W / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
    this.currentPiece.y = 0;
    this.nextPiece = this._newPiece();
    this.holdUsed = false;

    if (this._collides(this.currentPiece, 0, 0)) {
      this._triggerGameOver();
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
      return true;
    }
    return false;
  }

  moveRight() {
    if (!this.running || this.paused || this.gameOver) return false;
    if (!this._collides(this.currentPiece, 1, 0)) {
      this.currentPiece.x++;
      return true;
    }
    return false;
  }

  moveDown() {
    if (!this.running || this.paused || this.gameOver) return false;
    if (!this._collides(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
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

  rotate() {
    if (!this.running || this.paused || this.gameOver) return false;
    const newShape = rotateCW(this.currentPiece.shape);
    // Wall kicks
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this._collides(this.currentPiece, kick, 0, newShape)) {
        this.currentPiece.shape = newShape;
        this.currentPiece.x += kick;
        return true;
      }
    }
    return false;
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
        shape: this.heldPiece.shape.map(r => [...r]),
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
    // let (pas const) car on enrichit l'objet retourné
    const cleared = this._clearLines();

    // ── Combo tracker ──
    if (cleared.linesCleared > 0) {
      this.combo++;
      cleared.combo = this.combo;
    } else {
      this.combo = 0;
      cleared.combo = 0;
      // Hauteur de pile pour l'avertissement vocal "Bad"
      let stackHeight = 0;
      for (let r = 0; r < BOARD_H; r++) {
        if (this.board[r].some(c => c !== 0)) { stackHeight = BOARD_H - r; break; }
      }
      cleared.stackHeight = stackHeight;
    }

    this.spawnPiece();
    return cleared;
  }

  _clearLines() {
    const full = [];
    for (let r = 0; r < BOARD_H; r++) {
      if (this.board[r].every(c => c !== 0)) full.push(r);
    }
    // Toujours retourner un objet (plus jamais le nombre 0)
    if (full.length === 0) return { linesCleared: 0, levelUp: false, linesRows: [] };

    // ✅ FIX: Filtrer les lignes pleines en une seule passe pour éviter
    // la corruption d'indices lors de splices multiples
    this.board = this.board.filter((_, r) => !full.includes(r));
    while (this.board.length < BOARD_H) {
      this.board.unshift(Array(BOARD_W).fill(0));
    }

    const pts = LINE_SCORES[full.length] * this.level;
    this.score += pts;
    this.lines += full.length;
    this.totalLinesForLevel += full.length;

    // Vérification montée de niveau
    const linesNeeded = LINES_PER_LEVEL;
    if (this.totalLinesForLevel >= linesNeeded) {
      this.totalLinesForLevel -= linesNeeded;
      this.level++;
      if (this.level > 15) this.level = 15;
      return { linesCleared: full.length, levelUp: true, linesRows: full };
    }

    return { linesCleared: full.length, levelUp: false, linesRows: full };
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
  }
}

// ══════════════════════════════════════════
//  RENDERER 2D CANVAS — Champ bien défini
// ══════════════════════════════════════════

class TetrisRenderer {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = null;
    this.time    = 0;
    this.cellSize = 0;
    this.ox = 0; // offset X du plateau
    this.oy = 0; // offset Y du plateau
    this.particles = [];

    // Champs fictifs pour compatibilité avec le contrôleur
    this.blockMeshes  = [];
    this.pieceMeshes  = [];
    this.ghostMeshes  = [];
    this.lights       = {};
    this.boardGroup   = null;
    this.materials    = {};
    this.renderer     = { render: () => {} };
    this.scene        = {};
    this.camera       = {};

    // État courant (mis à jour par updateBoard / updatePiece)
    this._board  = null;
    this._piece  = null;
    this._ghostY = null;
  }

  // Aucun matériau Three.js nécessaire
  _buildMaterials() {}
  lockedMaterial()  { return null; }

  // ── INITIALISATION ──
  init() {
    this.ctx = this.canvas.getContext('2d');
    this._computeLayout();
    window.addEventListener('resize', () => this._onResize());
  }

  _computeLayout() {
    const w = this.canvas.width  || this.canvas.clientWidth  || 400;
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
    this.canvas.width  = c.clientWidth;
    this.canvas.height = c.clientHeight;
    this._computeLayout();
    this._render();
  }

  // ── MISE À JOUR — redessine immédiatement après chaque changement ──
  updateBoard(board) {
    this._board = board;
    this.blockMeshes = [];
    if (this.ctx) this._render(); // redessinage immédiat
  }

  updatePiece(piece, ghostY) {
    this._piece  = piece;
    this._ghostY = ghostY;
    this.pieceMeshes = [];
    this.ghostMeshes = [];
    if (this.ctx) this._render(); // redessinage immédiat
  }

  // ── PARTICULES ──
  spawnParticles(rows) {
    const colors = Object.values(PIECE_COLORS);
    for (let i = 0; i < 30; i++) {
      const row = rows[Math.floor(Math.random() * rows.length)];
      const col = Math.random() * BOARD_W;
      const col6 = colors[Math.floor(Math.random() * colors.length)]
        .toString(16).padStart(6, '0');
      this.particles.push({
        x:     this.ox + col * this.cellSize + this.cellSize / 2,
        y:     this.oy + row * this.cellSize + this.cellSize / 2,
        vx:    (Math.random() - 0.5) * 5,
        vy:    (Math.random() - 0.5) * 5 - 2,
        color: '#' + col6,
        life:  1.0,
        decay: 0.025 + Math.random() * 0.025,
        size:  2 + Math.random() * 4
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += 0.18;  // gravité
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  // ── DESSIN D'UN BLOC ──
  _drawBlock(x, y, cs, colorKey, alpha = 1.0, ghost = false) {
    const ctx = this.ctx;
    const hex = '#' + PIECE_COLORS[colorKey].toString(16).padStart(6, '0');
    const pad = 1;
    const sz  = cs - pad * 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (ghost) {
      // Fantôme : contour + remplissage très transparent
      ctx.strokeStyle = hex;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(x + pad + 0.5, y + pad + 0.5, sz - 1, sz - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = hex + '28';
      ctx.fillRect(x + pad, y + pad, sz, sz);
    } else {
      // Lueur (glow)
      ctx.shadowColor = hex;
      ctx.shadowBlur  = 14;

      // Dégradé du bloc
      const grad = ctx.createLinearGradient(x + pad, y + pad, x + pad + sz, y + pad + sz);
      grad.addColorStop(0, hex);
      grad.addColorStop(1, this._darken(hex, 0.55));
      ctx.fillStyle = grad;
      ctx.fillRect(x + pad, y + pad, sz, sz);

      // Reflet haut-gauche (effet 3D subtil)
      ctx.shadowBlur = 0;
      const hl = ctx.createLinearGradient(x + pad, y + pad, x + pad, y + pad + sz * 0.45);
      hl.addColorStop(0, 'rgba(255,255,255,0.30)');
      hl.addColorStop(1, 'rgba(255,255,255,0.00)');
      ctx.fillStyle = hl;
      ctx.fillRect(x + pad, y + pad, sz, sz * 0.45);

      const hl2 = ctx.createLinearGradient(x + pad, y + pad, x + pad + sz * 0.35, y + pad);
      hl2.addColorStop(0, 'rgba(255,255,255,0.15)');
      hl2.addColorStop(1, 'rgba(255,255,255,0.00)');
      ctx.fillStyle = hl2;
      ctx.fillRect(x + pad, y + pad, sz * 0.35, sz);

      // Bord fin blanc
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + pad + 0.5, y + pad + 0.5, sz - 1, sz - 1);
    }

    ctx.restore();
  }

  // Assombrit un hex couleur par facteur [0..1]
  _darken(hex, f) {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * f);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * f);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * f);
    return `rgb(${r},${g},${b})`;
  }

  // ── RENDU PRINCIPAL ──
  _render() {
    const ctx = this.ctx;
    const cs  = this.cellSize;
    const ox  = this.ox;
    const oy  = this.oy;
    const bw  = cs * BOARD_W;
    const bh  = cs * BOARD_H;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    // 1. Fond global
    ctx.fillStyle = '#07071a';
    ctx.fillRect(0, 0, W, H);

    // 2. Fond du plateau (bleu nuit clair)
    ctx.fillStyle = '#0e0e2e';
    ctx.fillRect(ox, oy, bw, bh);

    // 3. Grille claire
    ctx.strokeStyle = 'rgba(80, 55, 160, 0.45)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    for (let x = 0; x <= BOARD_W; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * cs, oy);
      ctx.lineTo(ox + x * cs, oy + bh);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_H; y++) {
      ctx.beginPath();
      ctx.moveTo(ox,      oy + y * cs);
      ctx.lineTo(ox + bw, oy + y * cs);
      ctx.stroke();
    }

    // 4. Blocs posés
    if (this._board) {
      for (let r = 0; r < BOARD_H; r++) {
        for (let c = 0; c < BOARD_W; c++) {
          const color = this._board[r][c];
          if (!color) continue;
          this._drawBlock(ox + c * cs, oy + r * cs, cs, color, 1.0, false);
        }
      }
    }

    // 5. Pièce fantôme
    if (this._piece && this._ghostY !== null && this._ghostY !== this._piece.y) {
      const p = this._piece;
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (!p.shape[r][c]) continue;
          this._drawBlock(
            ox + (p.x + c) * cs,
            oy + (this._ghostY + r) * cs,
            cs, p.color, 0.6, true
          );
        }
      }
    }

    // 6. Pièce active
    if (this._piece) {
      const p = this._piece;
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (!p.shape[r][c]) continue;
          this._drawBlock(
            ox + (p.x + c) * cs,
            oy + (p.y + r) * cs,
            cs, p.color, 1.0, false
          );
        }
      }
    }

    // 7. Bordure du plateau (lueur violette)
    ctx.shadowColor = 'rgba(124, 79, 255, 0.9)';
    ctx.shadowBlur  = 16;
    ctx.strokeStyle = '#7c4fff';
    ctx.lineWidth   = 2.5;
    ctx.strokeRect(ox, oy, bw, bh);
    ctx.shadowBlur  = 0;

    // Coin-coins lumineux (renfort visuel du cadre)
    const csize = 12;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur  = 10;
    const corners = [
      [ox, oy],
      [ox + bw, oy],
      [ox, oy + bh],
      [ox + bw, oy + bh]
    ];
    corners.forEach(([cx, cy]) => {
      const dx = cx === ox ? 1 : -1;
      const dy = cy === oy ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * csize);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * csize, cy);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // 8. Particules
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  // ── BOUCLE D'ANIMATION ──
  animate(dt) {
    this.time += dt;
    this.updateParticles();
    this._render();
  }
}

// ══════════════════════════════════════════
//  CINÉMATIQUE INTRO ANIME — CONSTRUCTION BÂTIMENT TETRIS
// ══════════════════════════════════════════

class IntroCinematic {
  constructor(controller) {
    this.controller = controller;
    this.canvas     = document.getElementById('intro-canvas');
    this.ctx        = null;
    this.screenEl   = document.getElementById('intro-screen');
    this.titleGroup = document.getElementById('intro-title-group');
    this.skipBtn    = document.getElementById('skip-intro-btn');
    this.running    = false;
    this.animId     = null;
    this.startTime  = 0;
    this.duration   = 7.5; // durée en secondes

    // Structure du bâtiment Tetris en construction
    this.building = [];
    this.fallingBlocks = [];
    this.particles = [];
    this.laserY = 0;
    this.shockwaves = [];

    this._setupEvents();
  }

  _setupEvents() {
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stop();
      });
    }
    this.screenEl.addEventListener('click', () => this.stop());
    window.addEventListener('keydown', (e) => {
      if (this.running && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
        this.stop();
      }
    });
  }

  async play() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.running = true;
    this.screenEl.classList.remove('hidden');
    if (this.titleGroup) this.titleGroup.classList.add('hidden');

    this._onResize();
    this.building = [];
    this.fallingBlocks = [];
    this.particles = [];
    this.shockwaves = [];
    this._prepareBuildingSequence();

    // Activer l'audio & Démarrer la musique de construction d'intro
    if (this.controller && this.controller.audio) {
      if (!this.controller.audio.ctx) {
        await this.controller.audio.init();
      }
      this.controller.audio.startIntroMusic();
    }

    this.startTime = performance.now();
    this._loop(this.startTime);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.controller && this.controller.audio) {
      this.controller.audio.stopIntroMusic();
    }
    this.screenEl.classList.add('hidden');
    if (this.controller) {
      this.controller.ui.startScreen.classList.remove('hidden');
      this.controller.renderLeaderboards();
    }
  }

  _onResize() {
    if (!this.canvas) return;
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _prepareBuildingSequence() {
    // Générer la séquence des 10 étages du bâtiment Tetris
    const colors = Object.keys(PIECE_COLORS);
    const W = 8; // 8 colonnes pour la tour
    const H = 10; // 10 étages

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const colorKey = colors[(r + c) % colors.length];
        const delay = 1.2 + (H - 1 - r) * 0.28 + (c % 2) * 0.05;
        this.fallingBlocks.push({
          targetR: r,
          targetC: c,
          color: colorKey,
          delay: delay,
          landed: false,
          currentY: -100 - Math.random() * 300,
          speed: 1200 + Math.random() * 400
        });
      }
    }
  }

  _loop(timestamp) {
    if (!this.running) return;
    const elapsed = (timestamp - this.startTime) / 1000;
    this._render(elapsed);

    if (elapsed >= this.duration) {
      setTimeout(() => this.stop(), 800);
      return;
    }

    this.animId = requestAnimationFrame((ts) => this._loop(ts));
  }

  _render(t) {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 1. Fond Cyberpunk Obscur
    ctx.fillStyle = '#04040e';
    ctx.fillRect(0, 0, W, H);

    // 2. Grille Laser Réactive (Phase 0 -> 7.5s)
    const gridCols = 20;
    const cellW = W / gridCols;
    ctx.strokeStyle = 'rgba(108, 63, 255, 0.15)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += cellW) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += cellW) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Perspective de sol Cyberpunk
    const horizon = H * 0.82;
    ctx.fillStyle = 'rgba(7, 7, 30, 0.9)';
    ctx.fillRect(0, horizon, W, H - horizon);
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(W, horizon); ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Construction du Bâtiment Tetris (Center)
    const bw = 8;
    const bh = 10;
    const blockSz = Math.min(Math.floor(W / 18), Math.floor((H * 0.55) / bh));
    const startX = Math.floor((W - bw * blockSz) / 2);
    const startY = horizon - bh * blockSz;

    // Dessiner le contour hologramme du bâtiment
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(startX, startY, bw * blockSz, bh * blockSz);
    ctx.setLineDash([]);

    // Mise à jour des blocs qui tombent et construisent le bâtiment
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
          b.currentY = targetY;
          b.landed = true;

          // Déclencher le son de choc & bris de verre
          if (this.controller && this.controller.audio && b.targetC % 3 === 0) {
            this.controller.audio.playGlassBreak();
          }

          // Éclats de verre et étincelles à l'impact
          const hex = '#' + PIECE_COLORS[b.color].toString(16).padStart(6, '0');
          for (let k = 0; k < 7; k++) {
            this.particles.push({
              x: targetX + blockSz / 2, y: targetY + blockSz / 2,
              vx: (Math.random() - 0.5) * 10,
              vy: -Math.random() * 8 - 2,
              color: k % 2 === 0 ? '#ffffff' : hex,
              size: Math.random() * 4 + 2,
              rot: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.4,
              life: 1.0, decay: 0.03 + Math.random() * 0.02
            });
          }
        }

        // Dessiner le bloc qui tombe avec traînée de lumière
        const drawY = Math.min(b.currentY, targetY);
        const hex = '#' + PIECE_COLORS[b.color].toString(16).padStart(6, '0');
        ctx.fillStyle = hex + '88';
        ctx.fillRect(targetX + 2, drawY - 20, blockSz - 4, 20); // Traînée
        this._drawIntroBlock(ctx, targetX, drawY, blockSz, b.color);
      } else if (b.landed) {
        // Bloc posé dans le bâtiment
        this._drawIntroBlock(ctx, targetX, targetY, blockSz, b.color);
      }
    });

    // 4. Balayage Laser Scanner (Phase 4.5s -> 6.0s)
    if (t >= 4.2 && t <= 6.2) {
      const scanProgress = (t - 4.2) / 2.0;
      const scanY = horizon - scanProgress * (bh * blockSz);
      ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 20;
      ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(startX - 20, scanY); ctx.lineTo(startX + bw * blockSz + 20, scanY); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 5. Particules d'éclats de verre
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; // Gravité
      if (p.rot !== undefined) p.rot += p.vRot;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.rot !== undefined) ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      const sz = p.size || 3;
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz, 0);
      ctx.lineTo(0, sz);
      ctx.lineTo(-sz, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;

    // 6. Révélation du Titre Électrique (Phase 5.8s +)
    if (t >= 5.8) {
      if (this.titleGroup && this.titleGroup.classList.contains('hidden')) {
        this.titleGroup.classList.remove('hidden');
        if (this.controller && this.controller.audio) {
          this.controller.audio.playIntroClimax();
        }
      }

      // Dessiner des Arcs Électriques / Éclairs autour du Titre
      const titleCenterX = W / 2;
      const titleCenterY = H * 0.48;

      for (let k = 0; k < 4; k++) {
        const angle = Math.random() * Math.PI * 2;
        const len = 120 + Math.random() * 200;
        const x2 = titleCenterX + Math.cos(angle) * len;
        const y2 = titleCenterY + Math.sin(angle) * len;
        const colors = ['#00d4ff', '#9d00ff', '#ffffff', '#ffe600'];
        this._drawElectricLightning(ctx, titleCenterX, titleCenterY, x2, y2, colors[k % colors.length]);
      }
    }
  }

  _drawElectricLightning(ctx, x1, y1, x2, y2, color = '#00d4ff') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 20;
    ctx.lineWidth   = 2.5;

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    const steps = 7;
    for (let i = 1; i <= steps; i++) {
      const targetX = x1 + (x2 - x1) * (i / steps);
      const targetY = y1 + (y2 - y1) * (i / steps);
      const jitterX = (Math.random() - 0.5) * 40;
      const jitterY = (Math.random() - 0.5) * 40;

      const nx = i === steps ? x2 : targetX + jitterX;
      const ny = i === steps ? y2 : targetY + jitterY;
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();
    ctx.restore();
  }

  _drawIntroBlock(ctx, x, y, sz, colorKey) {
    const hex = '#' + PIECE_COLORS[colorKey].toString(16).padStart(6, '0');
    const pad = 1;
    ctx.save();
    ctx.shadowColor = hex;
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = hex;
    ctx.fillRect(x + pad, y + pad, sz - pad * 2, sz - pad * 2);
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + pad, y + pad, sz - pad * 2, (sz - pad * 2) * 0.35);
    ctx.restore();
  }
}

// ══════════════════════════════════════════
//  MINI CANVAS (NEXT & HOLD)
// ══════════════════════════════════════════

function drawMiniPiece(canvas, pieceInfo) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, w, h);

  if (!pieceInfo) return;

  const shape = pieceInfo.shape || PIECES[pieceInfo.type].shape;
  const color = pieceInfo.color;
  const hex = '#' + PIECE_COLORS[color].toString(16).padStart(6, '0');

  const cols = shape[0].length;
  const rows = shape.length;
  const cellSize = Math.min(
    Math.floor((w - 16) / cols),
    Math.floor((h - 16) / rows)
  );
  const offsetX = Math.floor((w - cols * cellSize) / 2);
  const offsetY = Math.floor((h - rows * cellSize) / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!shape[r][c]) continue;
      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;
      ctx.fillStyle = hex;
      ctx.shadowColor = hex;
      ctx.shadowBlur = 12;
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      ctx.shadowBlur = 0;
      // Reflet
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + 2, y + 2, cellSize - 4, 4);
    }
  }
}

// ══════════════════════════════════════════
//  CONTRÔLEUR PRINCIPAL
// ══════════════════════════════════════════

class TetrisController {
  constructor() {
    this.game = new TetrisGame();
    this.renderer = null;
    this.audio = new TetrisAudio();
    this.voice = new TetrisVoice();  // ← Moteur vocal
    this.intro = null;
    this.dropTimer = null;
    this.prevTime = 0;
    this.animId = null;
    this.dirtyBoard = false;
    this.startLevel = 1;

    // UI
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
    };

    this.intro = new IntroCinematic(this);
    this._bindEvents();
    this._buildSpeedDots();
    this.renderLeaderboards();
    this.ui.bestDisplay.textContent = this.game.bestScore.toLocaleString();
  }

  async initRenderer() {
    const canvas = document.getElementById('tetris-canvas');
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    this.renderer = new TetrisRenderer(canvas);
    this.renderer.init();
  }

  _buildSpeedDots() {
    const c = this.ui.speedDots;
    c.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const d = document.createElement('div');
      d.className = 'speed-dot';
      d.id = `sdot-${i}`;
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
    // Clavier
    document.addEventListener('keydown', (e) => this._onKey(e));

    // Boutons écran démarrage
    document.getElementById('start-btn').addEventListener('click', () => this._startGame());

    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.startLevel = parseInt(btn.dataset.level);
      });
    });

    // Revoir la cinématique d'intro
    const replayIntroBtn = document.getElementById('replay-intro-btn');
    if (replayIntroBtn) {
      replayIntroBtn.addEventListener('click', () => {
        this.ui.startScreen.classList.add('hidden');
        if (this.intro) this.intro.play();
      });
    }

    // Game over
    document.getElementById('restart-btn').addEventListener('click', () => this._restartGame());
    document.getElementById('menu-btn').addEventListener('click', () => this._showMenu());

    // Pause
    document.getElementById('pause-btn').addEventListener('click', () => this._togglePause());
    document.getElementById('resume-btn').addEventListener('click', () => this._togglePause());

    // Quitter
    document.getElementById('quit-btn').addEventListener('click', () => this._triggerGameOver());

    // Musique & Pistes
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

    // Voix
    if (this.ui.voiceBtn) {
      this.ui.voiceBtn.addEventListener('click', () => {
        const enabled = this.voice.toggle();
        this.ui.voiceBtn.classList.toggle('muted', !enabled);
        this.ui.voiceBtn.classList.toggle('active', enabled);
        this.ui.voiceBtn.title = enabled ? 'Voix ON' : 'Voix OFF';
      });
    }

    // Enregistrement des initiales (3 lettres)
    if (this.ui.saveScoreBtn) {
      this.ui.saveScoreBtn.addEventListener('click', () => this._handleSaveInitials());
    }
    if (this.ui.initialsInput) {
      this.ui.initialsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._handleSaveInitials();
      });
      this.ui.initialsInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
      });
    }

    // Bascule des vues Menu / Classement
    const showStartScores = document.getElementById('show-start-scores-btn');
    const backToStart     = document.getElementById('back-to-start-btn');
    const showGoScores    = document.getElementById('show-gameover-scores-btn');
    const backToGo        = document.getElementById('back-to-gameover-btn');

    if (showStartScores) {
      showStartScores.addEventListener('click', () => {
        document.getElementById('start-main-view').classList.add('hidden');
        document.getElementById('start-scores-view').classList.remove('hidden');
        this.renderLeaderboards();
      });
    }
    if (backToStart) {
      backToStart.addEventListener('click', () => {
        document.getElementById('start-scores-view').classList.add('hidden');
        document.getElementById('start-main-view').classList.remove('hidden');
      });
    }

    if (showGoScores) {
      showGoScores.addEventListener('click', () => {
        document.getElementById('gameover-main-view').classList.add('hidden');
        document.getElementById('gameover-scores-view').classList.remove('hidden');
        this.renderLeaderboards();
      });
    }
    if (backToGo) {
      backToGo.addEventListener('click', () => {
        document.getElementById('gameover-scores-view').classList.add('hidden');
        document.getElementById('gameover-main-view').classList.remove('hidden');
      });
    }
  }

  _onKey(e) {
    if (!this.game.running || this.game.gameOver) return;

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        if (this.game.moveLeft()) this.audio.playMove();
        this._renderPiece();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (this.game.moveRight()) this.audio.playMove();
        this._renderPiece();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this._softDrop();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.game.rotate()) this.audio.playRotate();
        this._renderPiece();
        break;
      case 'Space':
        e.preventDefault();
        this.audio.playDrop();
        this.game.hardDrop();
        this._onPieceLocked();
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        e.preventDefault();
        if (this.game.hold()) {
          this.audio.playHold();
          drawMiniPiece(this.ui.holdCanvas, this.game.heldPiece);
          this._renderPiece();
        }
        break;
      case 'KeyP':
        this._togglePause();
        break;
      case 'KeyM':
        const muted = this.audio.toggleMute();
        this.ui.musicBtn.classList.toggle('muted', muted);
        this.ui.musicBtn.textContent = muted ? '🔇' : '🎵';
        break;
    }
  }

  async _startGame() {
    if (this.intro && this.intro.running) {
      this.intro.stop();
    }
    // Initialiser audio
    if (!this.audio.ctx) {
      await this.audio.init();
    }

    // Afficher le jeu EN PREMIER pour que le canvas ait ses dimensions
    this.ui.startScreen.classList.add('hidden');
    this.ui.gameOverScreen.classList.add('hidden');
    this.ui.gameWrapper.classList.remove('hidden');

    // Initialiser renderer APRES que le canvas soit visible et dimensionné
    if (!this.renderer) {
      await this.initRenderer();
    }

    // Démarrer le jeu
    this.game.init(this.startLevel);
    this.audio.setLevel(this.game.level);
    this.audio.start();

    this._updateUI();
    this._renderBoard();
    this._renderPiece();
    drawMiniPiece(this.ui.nextCanvas, this.game.nextPiece);
    drawMiniPiece(this.ui.holdCanvas, null);

    // Boucle de jeu
    this._startDropLoop();
    this._startRenderLoop();
  }

  _restartGame() {
    this._stopLoops();
    this.ui.gameOverScreen.classList.add('hidden');
    this.ui.gameWrapper.classList.remove('hidden');

    this.game.init(this.startLevel);
    this.audio.setLevel(this.game.level);
    this.audio.start();

    this._updateUI();
    this._renderBoard();
    this._renderPiece();
    drawMiniPiece(this.ui.nextCanvas, this.game.nextPiece);
    drawMiniPiece(this.ui.holdCanvas, null);
    this._startDropLoop();
    // ✅ FIX: Relancer la boucle de rendu Three.js (manquante lors du restart)
    this._startRenderLoop();
  }

  _showMenu() {
    this._stopLoops();
    this.audio.stop();
    // Réinitialiser les vues
    const startMain = document.getElementById('start-main-view');
    const startScores = document.getElementById('start-scores-view');
    if (startMain) startMain.classList.remove('hidden');
    if (startScores) startScores.classList.add('hidden');

    this.renderLeaderboards();
    this.ui.gameOverScreen.classList.add('hidden');
    this.ui.gameWrapper.classList.add('hidden');
    this.ui.startScreen.classList.remove('hidden');
  }

  _triggerGameOver() {
    if (this._gameOverShown) return;
    this._gameOverShown = true;

    if (!this.game.gameOver) {
      this.game._triggerGameOver();
    }

    this._stopLoops();
    this.audio.stop();
    this.audio.playGameOver();
    this.voice.onGameOver();

    setTimeout(() => {
      this.ui.gameWrapper.classList.add('hidden');
      this.ui.finalScore.textContent = this.game.score.toLocaleString();
      this.ui.finalLevel.textContent = this.game.level;
      this.ui.finalLines.textContent = this.game.lines;

      // Reset vues Game Over
      const goMain = document.getElementById('gameover-main-view');
      const goScores = document.getElementById('gameover-scores-view');
      if (goMain) goMain.classList.remove('hidden');
      if (goScores) goScores.classList.add('hidden');

      if (this.ui.initialsBox) {
        this.ui.initialsBox.style.display = this.game.score > 0 ? 'flex' : 'none';
        if (this.ui.initialsInput) {
          const lastSaved = localStorage.getItem('tetris3d_last_initials') || 'YCN';
          this.ui.initialsInput.value = lastSaved;
        }
      }

      this.renderLeaderboards();
      this.ui.gameOverScreen.classList.remove('hidden');
      this._gameOverShown = false;
    }, 600);
  }

  // ── GESTION DU CLASSEMENT (LEADERBOARD) ──
  getLeaderboard() {
    try {
      const data = localStorage.getItem('tetris3d_leaderboard');
      if (data) return JSON.parse(data);
    } catch (e) {}
    // Par défaut
    return [
      { name: 'YCN', score: 25000, level: 12 },
      { name: 'PRO', score: 18000, level: 9 },
      { name: 'TET', score: 12000, level: 7 },
      { name: 'TOP', score: 8000,  level: 5 },
      { name: 'BOB', score: 4000,  level: 3 }
    ];
  }

  saveScore(name, score, level) {
    let list = this.getLeaderboard();
    list.push({ name: name || 'YCN', score: score || 0, level: level || 1, date: Date.now() });
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10); // Garder les 10 meilleurs
    localStorage.setItem('tetris3d_leaderboard', JSON.stringify(list));
    localStorage.setItem('tetris3d_last_initials', name);
    return list;
  }

  _handleSaveInitials() {
    let name = (this.ui.initialsInput ? this.ui.initialsInput.value.trim() : 'YCN').toUpperCase();
    if (!name || name.length < 1) name = 'YCN';

    this.saveScore(name, this.game.score, this.game.level);
    if (this.ui.initialsBox) this.ui.initialsBox.style.display = 'none';
    this.renderLeaderboards();
    showNotification(`SCORE DE ${name} ENREGISTRÉ !`, 'notif-single');
  }

  renderLeaderboards() {
    const list = this.getLeaderboard();
    const renderList = (elementId, maxCount = 5) => {
      const container = document.getElementById(elementId);
      if (!container) return;
      container.innerHTML = '';
      const items = list.slice(0, maxCount);
      items.forEach((item, idx) => {
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

  _togglePause() {
    if (this.game.gameOver || !this.game.running) return;
    this.game.paused = !this.game.paused;
    if (this.game.paused) {
      clearTimeout(this.dropTimer);
      this.ui.pauseOverlay.classList.remove('hidden');
      document.getElementById('pause-btn').textContent = '▶ REPRENDRE';
    } else {
      this.ui.pauseOverlay.classList.add('hidden');
      document.getElementById('pause-btn').textContent = '⏸ PAUSE';
      this._startDropLoop();
    }
  }

  _startDropLoop() {
    clearTimeout(this.dropTimer);
    const speed = getLevelSpeed(this.game.level);
    this.dropTimer = setTimeout(() => this._dropTick(), speed);
  }

  _dropTick() {
    if (this.game.paused || this.game.gameOver || !this.game.running) return;
    const moved = this.game.moveDown();
    if (!moved) {
      this._onPieceLocked();
    } else {
      this._renderPiece();
    }
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
    if (this.game.gameOver) {
      this._triggerGameOver();
      return;
    }

    // Lire le résultat stocké par _lock() → _clearLines()
    const result = this.game.lastClearResult;
    this.game.lastClearResult = null;

    const linesCleared = result ? result.linesCleared : 0;
    const leveledUp    = result ? result.levelUp      : false;
    const combo        = result ? result.combo        : 0;
    const stackHeight  = result ? (result.stackHeight || 0) : 0;

    if (linesCleared > 0) {
      // ── Notification visuelle (Darija) ──
      const notifMap = ['', 'NADI !', 'JOOJ NADIN !', 'TLATA WA3RIN !', 'TETRIS A SAT !'];
      const clsMap   = ['', 'notif-single', 'notif-double', 'notif-triple', 'notif-tetris'];
      showNotification(notifMap[Math.min(linesCleared, 4)] || 'TETRIS A SAT !',
                       clsMap[Math.min(linesCleared, 4)]   || 'notif-tetris');

      // ── Notification combo (Darija) ──
      if (combo >= 2) {
        const comboLabels = ['', '', 'ZID KML x2 !', 'WA3R BZZAF x3 !', 'KHAARIQ x4 !',
                             'KAT7RAQ x5 !', 'MA KAYNSH LI YQABLFK !'];
        const comboLabel = comboLabels[Math.min(combo, 6)] || `COMBO x${combo} !`;
        const comboCls   = combo >= 4 ? 'notif-tetris' : combo === 3 ? 'notif-triple' : 'notif-double';
        setTimeout(() => showNotification(comboLabel, comboCls), 350);
      }

      this.audio.playLineClear(linesCleared);
      // Particules sur les lignes effacées (signature 2D : un seul argument)
      this.renderer.spawnParticles([Math.floor(BOARD_H / 2)]);

      // ── Voix ──
      this.voice.onClear(linesCleared, combo);

    } else {
      // Aucune ligne — avertissement si pile haute
      this.voice.onBad(stackHeight);
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
    drawMiniPiece(this.ui.nextCanvas, this.game.nextPiece);
    drawMiniPiece(this.ui.holdCanvas, this.game.heldPiece);
  }

  _renderBoard() {
    if (this.renderer) this.renderer.updateBoard(this.game.board);
  }

  _renderPiece() {
    if (this.renderer && this.game.currentPiece) {
      const ghostY = this.game.getGhostY();
      this.renderer.updatePiece(this.game.currentPiece, ghostY);
    }
  }

  _updateUI() {
    this._updateScore();
    this.ui.linesDisplay.textContent = this.game.lines.toLocaleString();
    this.ui.levelDisplay.textContent = this.game.level;

    // Barre de niveau
    const pct = (this.game.totalLinesForLevel / LINES_PER_LEVEL) * 100;
    this.ui.levelBar.style.width = `${pct}%`;

    this._updateSpeedDots(this.game.level);
  }

  _updateScore() {
    const scoreEl = this.ui.scoreDisplay;
    scoreEl.textContent = this.game.score.toLocaleString();
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-pop');

    const best = Math.max(this.game.bestScore, this.game.score);
    this.ui.bestDisplay.textContent = best.toLocaleString();
  }

  _startRenderLoop() {
    const loop = (ts) => {
      // ✅ FIX: S'arrêter seulement si le jeu n'est pas en cours ET pas en game over
      // (game over doit afficher les particules finales avant de stopper)
      if (!this.game.running && !this.game.gameOver) {
        this.animId = null;
        return;
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
    clearTimeout(this.dropTimer);
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

// ── DÉMARRAGE ──
window.addEventListener('DOMContentLoaded', () => {
  const ctrl = new TetrisController();
  window._tetrisController = ctrl;

  // Lancer la cinématique d'intro au premier chargement
  if (ctrl.intro) {
    ctrl.intro.play();
  }
});
