/**
 * ============================================================================
 * NEXUS TIC TAC TOE — MODERN JAVASCRIPT GAME ENGINE
 * Features:
 *  - 3 Modes: Two Players (local), Vs Computer (Easy/Medium/Hard AI), Infinite Mode
 *  - Dynamic Web Audio API Sound Synthesizer (Zero external assets)
 *  - Pure Canvas Confetti Explosion System
 *  - State Persistence in LocalStorage (Scores, Themes, History, Settings)
 *  - Responsive Keyboard & Accessibility Controls
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONSTANTS & WINNING PATTERNS
     ========================================================================== */
  const WINNING_COMBOS = [
    [0, 1, 2], // Row 1
    [3, 4, 5], // Row 2
    [6, 7, 8], // Row 3
    [0, 3, 6], // Col 1
    [1, 4, 7], // Col 2
    [2, 5, 8], // Col 3
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
  ];

  // Coordinates for winning strike line on 300x300 SVG canvas
  const WIN_LINE_COORDS = {
    '0,1,2': { x1: 20, y1: 50, x2: 280, y2: 50 },
    '3,4,5': { x1: 20, y1: 150, x2: 280, y2: 150 },
    '6,7,8': { x1: 20, y1: 250, x2: 280, y2: 250 },
    '0,3,6': { x1: 50, y1: 20, x2: 50, y2: 280 },
    '1,4,7': { x1: 150, y1: 20, x2: 150, y2: 280 },
    '2,5,8': { x1: 250, y1: 20, x2: 250, y2: 280 },
    '0,4,8': { x1: 30, y1: 30, x2: 270, y2: 270 },
    '2,4,6': { x1: 270, y1: 30, x2: 30, y2: 270 }
  };

  /* ==========================================================================
     2. GAME STATE
     ========================================================================== */
  const state = {
    // Game Configuration
    mode: 'pvp',               // 'pvp' | 'ai' | 'infinite'
    infiniteOpponent: 'pvp',   // 'pvp' | 'ai'
    aiDifficulty: 'medium',    // 'easy' | 'medium' | 'hard'
    timerEnabled: false,       // 10s turn timer toggle
    turnDuration: 10,
    
    // Players Setup
    p1: { name: 'Player 1', mark: 'X' },
    p2: { name: 'Player 2', mark: 'O', isAI: false },
    firstTurn: 'p1',           // 'p1' | 'p2' | 'random'
    
    // Match Board State
    board: Array(9).fill(null),
    currentTurn: 'X',          // 'X' | 'O'
    isGameOver: false,
    isThinking: false,         // Computer AI thinking delay lock
    movesCount: 0,
    moveHistory: [],           // For undo functionality
    
    // Infinite Mode Mark Queues
    marksQueue: {
      X: [],                   // Array of cell indices for X (max 3)
      O: []                    // Array of cell indices for O (max 3)
    },

    // Scores
    scores: {
      p1: 0,
      p2: 0,
      draws: 0
    },

    // Audio & UI
    isMuted: false,
    theme: 'aurora',
    modeTheme: 'dark',
    matchHistory: [],

    // Timer Runtime
    timerInterval: null,
    timeRemaining: 10
  };

  /* ==========================================================================
     3. DOM ELEMENTS
     ========================================================================== */
  const dom = {
    // Views
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    headerLogo: document.getElementById('header-logo'),
    
    // Header Controls
    themeSelect: document.getElementById('theme-select'),
    modeToggleBtn: document.getElementById('mode-toggle-btn'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    historyModalBtn: document.getElementById('history-modal-btn'),

    // Start Screen Inputs
    modeCards: document.querySelectorAll('.mode-card'),
    infiniteOpponentBox: document.getElementById('infinite-opponent-box'),
    aiDifficultyBox: document.getElementById('ai-difficulty-box'),
    p1NameInput: document.getElementById('p1-name-input'),
    p2NameInput: document.getElementById('p2-name-input'),
    p2NameLabel: document.getElementById('p2-name-label'),
    p2BadgeText: document.getElementById('p2-badge-text'),
    humanMarkRow: document.getElementById('human-mark-row'),
    firstTurnP2Text: document.getElementById('first-turn-p2-text'),
    timerToggleCheck: document.getElementById('timer-toggle-check'),
    startGameBtn: document.getElementById('start-game-btn'),

    // In-Game Top Bar & Meta
    backToMenuBtn: document.getElementById('back-to-menu-btn'),
    quickRestartBtn: document.getElementById('quick-restart-btn'),
    activeModeLabel: document.getElementById('active-mode-label'),
    activeSubLabel: document.getElementById('active-sub-label'),

    // Scoreboard
    p1ScoreCard: document.getElementById('p1-score-card'),
    p2ScoreCard: document.getElementById('p2-score-card'),
    p1DisplayName: document.getElementById('p1-display-name'),
    p2DisplayName: document.getElementById('p2-display-name'),
    p1ScoreValue: document.getElementById('p1-score-value'),
    p2ScoreValue: document.getElementById('p2-score-value'),
    tiesScoreValue: document.getElementById('ties-score-value'),
    p1MarksIndicator: document.getElementById('p1-marks-indicator'),
    p2MarksIndicator: document.getElementById('p2-marks-indicator'),

    // Timer
    turnTimerContainer: document.getElementById('turn-timer-container'),
    timerRingBar: document.getElementById('timer-ring-bar'),
    timerText: document.getElementById('timer-text'),

    // Status Banner
    turnIndicatorPill: document.getElementById('turn-indicator-pill'),
    turnPulseDot: document.getElementById('turn-pulse-dot'),
    turnStatusText: document.getElementById('turn-status-text'),
    infiniteWarningPill: document.getElementById('infinite-warning-pill'),

    // Board & Cells
    boardContainer: document.getElementById('board-container'),
    grid: document.getElementById('grid'),
    cells: document.querySelectorAll('.cell'),
    winStrikeOverlay: document.getElementById('win-strike-overlay'),
    winStrikeLine: document.getElementById('win-strike-line'),

    // Game Actions
    undoBtn: document.getElementById('undo-btn'),
    resetRoundBtn: document.getElementById('reset-round-btn'),
    resetScoresBtn: document.getElementById('reset-scores-btn'),

    // Modals
    gameOverModal: document.getElementById('game-over-modal'),
    modalResultIcon: document.getElementById('modal-result-icon'),
    modalResultTitle: document.getElementById('modal-result-title'),
    modalResultSub: document.getElementById('modal-result-sub'),
    modalStatMode: document.getElementById('modal-stat-mode'),
    modalStatMoves: document.getElementById('modal-stat-moves'),
    modalStatScore: document.getElementById('modal-stat-score'),
    modalPlayAgainBtn: document.getElementById('modal-play-again-btn'),
    modalMainMenuBtn: document.getElementById('modal-main-menu-btn'),

    // History Modal
    historyModal: document.getElementById('history-modal'),
    historyList: document.getElementById('history-list'),
    closeHistoryBtn: document.getElementById('close-history-btn'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),

    // Screen reader
    srAnnouncements: document.getElementById('sr-announcements')
  };

  /* ==========================================================================
     4. WEB AUDIO API SYNTHESIZER
     (Completely self-contained, no external audio files needed)
     ========================================================================== */
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.initialized = true;
      } catch (e) {
        console.warn('Web Audio API not supported on this device.');
      }
    }

    ensureContext() {
      if (!this.initialized) this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick() {
      if (state.isMuted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    }

    playMove(mark) {
      if (state.isMuted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      if (mark === 'X') {
        // High bright chime
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      } else {
        // Warm mellow chime
        osc.frequency.setValueAtTime(440.00, now); // A4
        osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.08); // C#5
      }

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    }

    playVanish() {
      if (state.isMuted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    }

    playWin() {
      if (state.isMuted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = now + index * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.22, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });
    }

    playDraw() {
      if (state.isMuted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const notes = [392.00, 329.63, 293.66]; // G4, E4, D4
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = now + index * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.25);
      });
    }

    playTimerTick() {
      if (state.isMuted) return;
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    }
  }

  const sound = new SoundManager();

  /* ==========================================================================
     5. PURE CANVAS CONFETTI CELEBRATION SYSTEM
     ========================================================================== */
  class ConfettiEngine {
    constructor() {
      this.canvas = document.getElementById('confetti-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animId = null;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    spawn(count = 100) {
      if (!this.canvas || !this.ctx) return;
      this.resize();

      const themeColors = {
        aurora: ['#a855f7', '#ec4899', '#06b6d4', '#f43f5e', '#38bdf8', '#facc15'],
        sunset: ['#f97316', '#f43f5e', '#fbbf24', '#e11d48', '#fb923c', '#ffffff'],
        ocean:  ['#0ea5e9', '#10b981', '#38bdf8', '#34d399', '#06b6d4', '#a7f3d0']
      };
      const colors = themeColors[state.theme] || themeColors.aurora;

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: window.innerWidth * (0.2 + Math.random() * 0.6),
          y: window.innerHeight * 0.35,
          vx: (Math.random() - 0.5) * 16,
          vy: -Math.random() * 14 - 4,
          gravity: 0.35 + Math.random() * 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          shape: Math.random() > 0.4 ? 'rect' : 'circle'
        });
      }

      if (!this.animId) {
        this.animate();
      }
    }

    animate() {
      if (this.particles.length === 0) {
        this.animId = null;
        if (this.ctx && this.canvas) {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        return;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.007;

        if (p.opacity <= 0 || p.y > this.canvas.height + 20) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = Math.max(0, p.opacity);
        this.ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
      }

      this.animId = requestAnimationFrame(() => this.animate());
    }

    stop() {
      this.particles = [];
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  const confetti = new ConfettiEngine();

  /* ==========================================================================
     6. LOCALSTORAGE & PERSISTENCE
     ========================================================================== */
  function loadPersistedData() {
    try {
      const savedTheme = localStorage.getItem('nexus_xo_theme');
      if (savedTheme) {
        state.theme = savedTheme;
        dom.themeSelect.value = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
      }

      const savedMode = localStorage.getItem('nexus_xo_mode');
      if (savedMode) {
        state.modeTheme = savedMode;
        document.documentElement.setAttribute('data-mode', savedMode);
      }

      const savedMute = localStorage.getItem('nexus_xo_muted');
      if (savedMute !== null) {
        state.isMuted = (savedMute === 'true');
        updateSoundButtonUI();
      }

      const savedScores = localStorage.getItem('nexus_xo_scores');
      if (savedScores) {
        const parsed = JSON.parse(savedScores);
        state.scores.p1 = parsed.p1 || 0;
        state.scores.p2 = parsed.p2 || 0;
        state.scores.draws = parsed.draws || 0;
        updateScoreboardDisplay();
      }

      const savedHistory = localStorage.getItem('nexus_xo_history');
      if (savedHistory) {
        state.matchHistory = JSON.parse(savedHistory);
        renderMatchHistory();
      }
    } catch (e) {
      console.warn('LocalStorage error while reading:', e);
    }
  }

  function saveScores() {
    try {
      localStorage.setItem('nexus_xo_scores', JSON.stringify(state.scores));
    } catch (e) {
      console.warn('LocalStorage error while saving scores:', e);
    }
  }

  function saveMatchHistory(matchRecord) {
    try {
      state.matchHistory.unshift(matchRecord);
      if (state.matchHistory.length > 10) {
        state.matchHistory = state.matchHistory.slice(0, 10);
      }
      localStorage.setItem('nexus_xo_history', JSON.stringify(state.matchHistory));
      renderMatchHistory();
    } catch (e) {
      console.warn('LocalStorage error while saving history:', e);
    }
  }

  /* ==========================================================================
     7. SVG MARK GENERATION
     (Draw in animations, smooth strokes, glowing effects)
     ========================================================================== */
  function getXMarkSvg() {
    return `
      <div class="mark-wrapper" aria-hidden="true">
        <svg viewBox="0 0 48 48" class="x-svg">
          <line class="x-mark-path" x1="11" y1="11" x2="37" y2="37" stroke="url(#x-gradient)" stroke-width="5.5" stroke-linecap="round"/>
          <line class="x-mark-path" x1="37" y1="11" x2="11" y2="37" stroke="url(#x-gradient)" stroke-width="5.5" stroke-linecap="round"/>
        </svg>
      </div>
    `;
  }

  function getOMarkSvg() {
    return `
      <div class="mark-wrapper" aria-hidden="true">
        <svg viewBox="0 0 48 48" class="o-svg">
          <circle class="o-mark-path" cx="24" cy="24" r="14.5" stroke="url(#o-gradient)" stroke-width="5" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
    `;
  }

  /* ==========================================================================
     8. TURN TIMER ENGINE
     ========================================================================== */
  function startTurnTimer() {
    stopTurnTimer();
    if (!state.timerEnabled || state.isGameOver) {
      dom.turnTimerContainer.style.display = 'none';
      return;
    }

    dom.turnTimerContainer.style.display = 'flex';
    state.timeRemaining = state.turnDuration;
    updateTimerVisual(state.timeRemaining);

    state.timerInterval = setInterval(() => {
      // Do not count down during AI thinking delay
      if (state.isThinking || state.isGameOver) return;

      state.timeRemaining--;
      updateTimerVisual(state.timeRemaining);

      if (state.timeRemaining <= 3 && state.timeRemaining > 0) {
        sound.playTimerTick();
      }

      if (state.timeRemaining <= 0) {
        stopTurnTimer();
        handleTimerTimeout();
      }
    }, 1000);
  }

  function stopTurnTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function updateTimerVisual(seconds) {
    dom.timerText.textContent = seconds;
    const circumference = 2 * Math.PI * 16; // r=16 -> ~100.53
    const fraction = seconds / state.turnDuration;
    const offset = circumference * (1 - fraction);
    dom.timerRingBar.style.strokeDasharray = circumference;
    dom.timerRingBar.style.strokeDashoffset = offset;

    if (seconds <= 3) {
      dom.timerRingBar.style.stroke = '#ef4444'; // Red alert
    } else if (seconds <= 5) {
      dom.timerRingBar.style.stroke = '#f59e0b'; // Amber warning
    } else {
      dom.timerRingBar.style.stroke = 'var(--color-primary)';
    }
  }

  function handleTimerTimeout() {
    if (state.isGameOver || state.isThinking) return;

    // Announce timeout
    announce(`${getCurrentPlayerObj().name} ran out of time! Random move chosen.`);

    // Choose random available move for current player
    const emptyIndices = getAvailableMoves(state.board);
    if (emptyIndices.length > 0) {
      const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      handleCellSelection(randomIndex, true);
    }
  }

  /* ==========================================================================
     9. AI LOGIC (Easy, Medium, Hard Unbeatable Minimax)
     ========================================================================== */
  function getAvailableMoves(board) {
    const moves = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        moves.push(i);
      }
    }
    return moves;
  }

  function checkWinnerOnBoard(board) {
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
      const [a, b, c] = WINNING_COMBOS[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], combo: [a, b, c] };
      }
    }
    if (!board.includes(null)) {
      return { winner: 'draw', combo: null };
    }
    return null;
  }

  // Minimax Algorithm for Standard Tic Tac Toe
  function minimax(board, depth, isMaximizing, aiMark, humanMark, alpha = -Infinity, beta = Infinity) {
    const result = checkWinnerOnBoard(board);
    if (result) {
      if (result.winner === aiMark) return 10 - depth;
      if (result.winner === humanMark) return depth - 10;
      if (result.winner === 'draw') return 0;
    }

    const available = getAvailableMoves(board);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of available) {
        board[move] = aiMark;
        const evaluation = minimax(board, depth + 1, false, aiMark, humanMark, alpha, beta);
        board[move] = null;
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of available) {
        board[move] = humanMark;
        const evaluation = minimax(board, depth + 1, true, aiMark, humanMark, alpha, beta);
        board[move] = null;
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minEval;
    }
  }

  // Get best move for standard AI
  function getStandardAiMove(difficulty, aiMark) {
    const humanMark = (aiMark === 'X') ? 'O' : 'X';
    const available = getAvailableMoves(state.board);

    if (available.length === 0) return null;

    // --- LEVEL 1: EASY (Pure Random) ---
    if (difficulty === 'easy') {
      return available[Math.floor(Math.random() * available.length)];
    }

    // --- LEVEL 2: MEDIUM (Win or Block, else mix) ---
    if (difficulty === 'medium') {
      // 1. Can AI win immediately?
      for (const move of available) {
        state.board[move] = aiMark;
        const winCheck = checkWinnerOnBoard(state.board);
        state.board[move] = null;
        if (winCheck && winCheck.winner === aiMark) return move;
      }
      // 2. Can opponent win next? Block them!
      for (const move of available) {
        state.board[move] = humanMark;
        const blockCheck = checkWinnerOnBoard(state.board);
        state.board[move] = null;
        if (blockCheck && blockCheck.winner === humanMark) return move;
      }
      // 3. Take center if open with 70% probability
      if (available.includes(4) && Math.random() < 0.7) {
        return 4;
      }
      // 4. 50% minimax optimal, 50% random
      if (Math.random() < 0.5) {
        return available[Math.floor(Math.random() * available.length)];
      }
    }

    // --- LEVEL 3: HARD / UNBEATABLE MINIMAX ---
    let bestScore = -Infinity;
    let bestMoves = [];

    // If board is empty, pick center or corner for instant response
    if (available.length === 9) {
      const openers = [0, 2, 4, 6, 8];
      return openers[Math.floor(Math.random() * openers.length)];
    }

    for (const move of available) {
      state.board[move] = aiMark;
      const score = minimax(state.board, 0, false, aiMark, humanMark);
      state.board[move] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  // AI for Infinite Mode (accounting for the 3-mark sliding queue)
  function getInfiniteAiMove(difficulty, aiMark) {
    const humanMark = (aiMark === 'X') ? 'O' : 'X';
    const available = getAvailableMoves(state.board);

    if (available.length === 0) return null;

    if (difficulty === 'easy') {
      return available[Math.floor(Math.random() * available.length)];
    }

    // Simulate Infinite Mode Placement:
    // When ai places mark, if it already has 3 marks, the oldest is cleared first!
    function simulateInfiniteMove(board, queue, mark, cell) {
      const nextBoard = [...board];
      const nextQueue = [...queue];

      if (nextQueue.length === 3) {
        const oldest = nextQueue.shift();
        nextBoard[oldest] = null;
      }
      nextBoard[cell] = mark;
      nextQueue.push(cell);

      return { board: nextBoard, queue: nextQueue };
    }

    // 1. Check if AI can win on this placement
    for (const move of available) {
      const sim = simulateInfiniteMove(state.board, state.marksQueue[aiMark], aiMark, move);
      const winCheck = checkWinnerOnBoard(sim.board);
      if (winCheck && winCheck.winner === aiMark) {
        return move;
      }
    }

    // 2. Check if Human could win on their next turn; block them!
    const humanAvail = getAvailableMoves(state.board);
    for (const move of humanAvail) {
      const sim = simulateInfiniteMove(state.board, state.marksQueue[humanMark], humanMark, move);
      const humanWin = checkWinnerOnBoard(sim.board);
      if (humanWin && humanWin.winner === humanMark) {
        return move;
      }
    }

    // 3. Take center cell if available
    if (available.includes(4)) {
      return 4;
    }

    // 4. Medium random choice or fallback
    if (difficulty === 'medium' && Math.random() < 0.4) {
      return available[Math.floor(Math.random() * available.length)];
    }

    // 5. Score moves by corners and two-in-a-row setups
    let bestScore = -1;
    let bestMove = available[0];

    for (const move of available) {
      const sim = simulateInfiniteMove(state.board, state.marksQueue[aiMark], aiMark, move);
      let score = 0;

      // Count potential lines
      for (const [a, b, c] of WINNING_COMBOS) {
        const line = [sim.board[a], sim.board[b], sim.board[c]];
        const aiCount = line.filter(v => v === aiMark).length;
        const humanCount = line.filter(v => v === humanMark).length;
        if (aiCount === 2 && humanCount === 0) score += 3;
        if (aiCount === 1 && humanCount === 0) score += 1;
      }

      if ([0, 2, 6, 8].includes(move)) score += 1; // Corner preference

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /* ==========================================================================
     10. CORE GAMEPLAY MECHANICS & MOVE HANDLING
     ========================================================================== */
  function getCurrentPlayerObj() {
    return (state.currentTurn === state.p1.mark) ? state.p1 : state.p2;
  }

  function handleCellSelection(index, isAutoPlayed = false) {
    if (state.isGameOver || state.isThinking) return;
    if (state.board[index] !== null) return; // Cell already occupied

    // If it's vs AI mode and it's AI's turn, block human clicks
    const currentP = getCurrentPlayerObj();
    if (currentP.isAI && !isAutoPlayed) return;

    sound.init(); // Warm audio context on player click
    sound.playClick();

    commitMove(index);
  }

  function commitMove(index) {
    const mark = state.currentTurn;
    const isInfinite = (state.mode === 'infinite');

    // Save snapshot for Undo
    saveMoveSnapshot();

    // In Infinite Mode, handle 3-marks restriction
    if (isInfinite) {
      const playerQueue = state.marksQueue[mark];
      if (playerQueue.length === 3) {
        // Pop the oldest mark
        const oldestIndex = playerQueue.shift();
        const oldestCell = dom.cells[oldestIndex];

        // Animate vanishing of oldest mark
        oldestCell.classList.add('mark-vanishing');
        sound.playVanish();

        setTimeout(() => {
          oldestCell.classList.remove('mark-vanishing', 'mark-expiring', 'filled');
          oldestCell.innerHTML = '';
          oldestCell.setAttribute('aria-label', `Row ${Math.floor(oldestIndex / 3) + 1}, Column ${(oldestIndex % 3) + 1}, Empty`);
          state.board[oldestIndex] = null;
        }, 300);
      }
      playerQueue.push(index);
    }

    // Place new mark
    state.board[index] = mark;
    state.movesCount++;
    const targetCell = dom.cells[index];
    targetCell.classList.add('filled');
    targetCell.innerHTML = (mark === 'X') ? getXMarkSvg() : getOMarkSvg();
    targetCell.setAttribute('aria-label', `Row ${Math.floor(index / 3) + 1}, Column ${(index % 3) + 1}, Marked ${mark}`);

    sound.playMove(mark);

    // Update screen reader announcement
    announce(`${getCurrentPlayerObj().name} placed ${mark} at row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}`);

    // Check for Game Over (Win or Draw)
    const result = checkGameStatus();
    if (result) {
      stopTurnTimer();
      handleGameOver(result);
      return;
    }

    // Advance to next turn
    switchTurn();
  }

  function switchTurn() {
    state.currentTurn = (state.currentTurn === 'X') ? 'O' : 'X';
    updateTurnIndicator();
    updateInfiniteWarnings();
    updateUndoButtonState();
    startTurnTimer();

    // Check if next turn belongs to Computer AI
    const nextPlayer = getCurrentPlayerObj();
    if (nextPlayer.isAI && !state.isGameOver) {
      triggerAiTurn();
    }
  }

  function triggerAiTurn() {
    state.isThinking = true;
    dom.turnStatusText.textContent = `${state.p2.name} is thinking...`;
    dom.boardContainer.classList.add('ai-thinking');

    // Human-like natural thinking delay: 450ms to 750ms
    const delay = Math.floor(Math.random() * 300) + 450;

    setTimeout(() => {
      if (state.isGameOver) {
        state.isThinking = false;
        return;
      }

      let move = null;
      if (state.mode === 'infinite') {
        move = getInfiniteAiMove(state.aiDifficulty, state.p2.mark);
      } else {
        move = getStandardAiMove(state.aiDifficulty, state.p2.mark);
      }

      state.isThinking = false;
      dom.boardContainer.classList.remove('ai-thinking');

      if (move !== null && state.board[move] === null) {
        commitMove(move);
      }
    }, delay);
  }

  function checkGameStatus() {
    // 1. Check for winning combo
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
      const [a, b, c] = WINNING_COMBOS[i];
      if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
        return {
          type: 'win',
          winnerMark: state.board[a],
          combo: [a, b, c]
        };
      }
    }

    // 2. Check for draw (only in standard/ai mode, infinite mode never draws)
    if (state.mode !== 'infinite' && !state.board.includes(null)) {
      return {
        type: 'draw',
        winnerMark: null,
        combo: null
      };
    }

    return null; // Game continues
  }

  function handleGameOver(result) {
    state.isGameOver = true;
    updateUndoButtonState();

    if (result.type === 'win') {
      const winner = (result.winnerMark === state.p1.mark) ? state.p1 : state.p2;
      const isP1 = (result.winnerMark === state.p1.mark);

      if (isP1) {
        state.scores.p1++;
      } else {
        state.scores.p2++;
      }
      saveScores();
      updateScoreboardDisplay();

      // Highlight winning cells
      result.combo.forEach(idx => {
        dom.cells[idx].classList.add('win-cell');
      });

      // Draw winning animated line
      drawWinningStrike(result.combo);

      // Sound & Confetti
      sound.playWin();
      confetti.spawn(120);

      // Save match history
      const historyItem = {
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: getFormattedModeName(),
        winner: winner.name,
        result: `${winner.name} Won (${winner.mark})`,
        score: `${state.scores.p1} - ${state.scores.p2}`
      };
      saveMatchHistory(historyItem);

      // Show Result Modal after brief pause for animation
      setTimeout(() => {
        openResultModal({
          icon: '🏆',
          title: `${winner.name} Wins!`,
          subtitle: `Victory achieved in ${state.movesCount} moves!`,
          moves: state.movesCount,
          mode: getFormattedModeName(),
          score: `${state.scores.p1} - ${state.scores.p2}`
        });
      }, 1000);

      announce(`${winner.name} has won the game!`);

    } else if (result.type === 'draw') {
      state.scores.draws++;
      saveScores();
      updateScoreboardDisplay();

      // Board shakes gently on draw
      dom.boardContainer.classList.add('shake');
      setTimeout(() => dom.boardContainer.classList.remove('shake'), 700);

      sound.playDraw();

      const historyItem = {
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: getFormattedModeName(),
        winner: 'Draw',
        result: "It's a Stalemate",
        score: `${state.scores.p1} - ${state.scores.p2}`
      };
      saveMatchHistory(historyItem);

      setTimeout(() => {
        openResultModal({
          icon: '🤝',
          title: "It's a Draw!",
          subtitle: "A balanced duel — neither gave an inch.",
          moves: state.movesCount,
          mode: getFormattedModeName(),
          score: `${state.scores.p1} - ${state.scores.p2}`
        });
      }, 800);

      announce("The game resulted in a draw.");
    }
  }

  function drawWinningStrike(combo) {
    const key = combo.join(',');
    const coords = WIN_LINE_COORDS[key];
    if (!coords) return;

    dom.winStrikeLine.setAttribute('x1', coords.x1);
    dom.winStrikeLine.setAttribute('y1', coords.y1);
    dom.winStrikeLine.setAttribute('x2', coords.x2);
    dom.winStrikeLine.setAttribute('y2', coords.y2);

    dom.winStrikeOverlay.classList.add('active');

    // Trigger stroke dashoffset transition
    requestAnimationFrame(() => {
      dom.winStrikeLine.style.strokeDashoffset = '0';
    });
  }

  function clearWinningStrike() {
    dom.winStrikeOverlay.classList.remove('active');
    dom.winStrikeLine.style.strokeDashoffset = '450';
  }

  /* ==========================================================================
     11. INFINITE MODE WARNINGS & MARK HIGHLIGHTING
     ========================================================================== */
  function updateInfiniteWarnings() {
    // Clear all existing expiring marks
    dom.cells.forEach(cell => cell.classList.remove('mark-expiring'));

    if (state.mode !== 'infinite' || state.isGameOver) {
      dom.infiniteWarningPill.style.display = 'none';
      dom.p1MarksIndicator.style.display = 'none';
      dom.p2MarksIndicator.style.display = 'none';
      return;
    }

    // Show indicators for marks count (dots 1, 2, 3)
    dom.p1MarksIndicator.style.display = 'flex';
    dom.p2MarksIndicator.style.display = 'flex';
    updateMarkDots(dom.p1MarksIndicator, state.marksQueue[state.p1.mark].length);
    updateMarkDots(dom.p2MarksIndicator, state.marksQueue[state.p2.mark].length);

    // If current player already has 3 marks, warn them and highlight their oldest mark
    const curMark = state.currentTurn;
    const curQueue = state.marksQueue[curMark];

    if (curQueue.length === 3) {
      const oldestIndex = curQueue[0];
      const oldestCell = dom.cells[oldestIndex];
      if (oldestCell) {
        oldestCell.classList.add('mark-expiring');
      }
      dom.infiniteWarningPill.style.display = 'inline-block';
      dom.infiniteWarningPill.textContent = `⚠️ Your oldest mark (highlighted) will vanish next!`;
    } else {
      dom.infiniteWarningPill.style.display = 'none';
    }
  }

  function updateMarkDots(container, count) {
    const dots = container.querySelectorAll('.mark-dot');
    dots.forEach((dot, idx) => {
      if (idx < count) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  /* ==========================================================================
     12. UNDO MOVE ENGINE
     ========================================================================== */
  function saveMoveSnapshot() {
    const snapshot = {
      board: [...state.board],
      currentTurn: state.currentTurn,
      movesCount: state.movesCount,
      marksQueue: {
        X: [...state.marksQueue.X],
        O: [...state.marksQueue.O]
      }
    };
    state.moveHistory.push(snapshot);
    updateUndoButtonState();
  }

  function undoMove() {
    if (state.moveHistory.length === 0 || state.isThinking) return;

    sound.init();
    sound.playClick();

    // Determine how many moves to roll back
    // If playing vs AI and game is not over, roll back 2 moves (AI + Player)
    // If game is over or playing PvP, roll back 1 move
    let stepsToRevert = 1;
    const isVsAi = (state.mode === 'ai' || (state.mode === 'infinite' && state.infiniteOpponent === 'ai'));

    if (isVsAi && !state.isGameOver && state.moveHistory.length >= 2) {
      stepsToRevert = 2;
    }

    let targetSnapshot = null;
    while (stepsToRevert > 0 && state.moveHistory.length > 0) {
      targetSnapshot = state.moveHistory.pop();
      stepsToRevert--;
    }

    if (!targetSnapshot) return;

    // Restore state from snapshot
    state.board = [...targetSnapshot.board];
    state.currentTurn = targetSnapshot.currentTurn;
    state.movesCount = targetSnapshot.movesCount;
    state.marksQueue = {
      X: [...targetSnapshot.marksQueue.X],
      O: [...targetSnapshot.marksQueue.O]
    };
    state.isGameOver = false;

    // Redraw board DOM
    clearWinningStrike();
    confetti.stop();
    closeAllModals();

    dom.cells.forEach((cell, idx) => {
      cell.classList.remove('win-cell', 'mark-expiring', 'mark-vanishing', 'filled');
      const mark = state.board[idx];
      if (mark === 'X') {
        cell.innerHTML = getXMarkSvg();
        cell.classList.add('filled');
        cell.setAttribute('aria-label', `Row ${Math.floor(idx / 3) + 1}, Column ${(idx % 3) + 1}, Marked X`);
      } else if (mark === 'O') {
        cell.innerHTML = getOMarkSvg();
        cell.classList.add('filled');
        cell.setAttribute('aria-label', `Row ${Math.floor(idx / 3) + 1}, Column ${(idx % 3) + 1}, Marked O`);
      } else {
        cell.innerHTML = '';
        cell.setAttribute('aria-label', `Row ${Math.floor(idx / 3) + 1}, Column ${(idx % 3) + 1}, Empty`);
      }
    });

    updateTurnIndicator();
    updateInfiniteWarnings();
    updateUndoButtonState();
    startTurnTimer();

    announce("Last move undone.");
  }

  function updateUndoButtonState() {
    dom.undoBtn.disabled = (state.moveHistory.length === 0 || state.isThinking);
  }

  /* ==========================================================================
     13. GAME INITIALIZATION & RESET
     ========================================================================== */
  function startNewRound() {
    stopTurnTimer();
    confetti.stop();
    clearWinningStrike();
    closeAllModals();

    state.board = Array(9).fill(null);
    state.marksQueue = { X: [], O: [] };
    state.movesCount = 0;
    state.isGameOver = false;
    state.isThinking = false;
    state.moveHistory = [];

    // Clear board cells
    dom.cells.forEach((cell, idx) => {
      cell.classList.remove('win-cell', 'mark-expiring', 'mark-vanishing', 'filled');
      cell.innerHTML = '';
      cell.setAttribute('aria-label', `Row ${Math.floor(idx / 3) + 1}, Column ${(idx % 3) + 1}, Empty`);
    });

    // Determine First Turn
    if (state.firstTurn === 'p1') {
      state.currentTurn = state.p1.mark;
    } else if (state.firstTurn === 'p2') {
      state.currentTurn = state.p2.mark;
    } else {
      state.currentTurn = (Math.random() < 0.5) ? state.p1.mark : state.p2.mark;
    }

    updateTurnIndicator();
    updateInfiniteWarnings();
    updateUndoButtonState();
    startTurnTimer();

    // If starting turn belongs to AI, trigger it
    const curP = getCurrentPlayerObj();
    if (curP.isAI) {
      triggerAiTurn();
    }

    announce(`New round started! ${curP.name}'s turn (${state.currentTurn}).`);
  }

  function applySetupAndStartGame() {
    sound.init();
    sound.playClick();

    // Read selected mode
    const selectedModeInput = document.querySelector('input[name="gameMode"]:checked');
    state.mode = selectedModeInput ? selectedModeInput.value : 'pvp';

    // Read Infinite Mode opponent
    const selectedInfOpp = document.querySelector('input[name="infiniteOpponent"]:checked');
    state.infiniteOpponent = selectedInfOpp ? selectedInfOpp.value : 'pvp';

    // Read AI Difficulty
    const selectedDiff = document.querySelector('input[name="aiDifficulty"]:checked');
    state.aiDifficulty = selectedDiff ? selectedDiff.value : 'medium';

    // Read Timer Toggle
    state.timerEnabled = dom.timerToggleCheck.checked;

    // Read Player Mark
    const selectedMark = document.querySelector('input[name="playerMark"]:checked');
    const p1Mark = selectedMark ? selectedMark.value : 'X';
    const p2Mark = (p1Mark === 'X') ? 'O' : 'X';

    // Read First Turn
    const selectedFirst = document.querySelector('input[name="firstTurn"]:checked');
    state.firstTurn = selectedFirst ? selectedFirst.value : 'p1';

    // Setup Player 1
    state.p1.name = dom.p1NameInput.value.trim() || 'Player 1';
    state.p1.mark = p1Mark;

    // Setup Player 2 / AI
    const isAiMode = (state.mode === 'ai' || (state.mode === 'infinite' && state.infiniteOpponent === 'ai'));
    state.p2.isAI = isAiMode;
    state.p2.mark = p2Mark;

    if (isAiMode) {
      const diffTitle = state.aiDifficulty.charAt(0).toUpperCase() + state.aiDifficulty.slice(1);
      state.p2.name = `AI (${diffTitle})`;
    } else {
      state.p2.name = dom.p2NameInput.value.trim() || 'Player 2';
    }

    // Update in-game labels
    dom.p1DisplayName.textContent = state.p1.name;
    dom.p2DisplayName.textContent = state.p2.name;

    // Update mode badge
    dom.activeModeLabel.textContent = getFormattedModeName();
    dom.activeSubLabel.textContent = getFormattedSubName();

    // Transition view
    dom.startScreen.classList.remove('active');
    dom.gameScreen.classList.add('active');

    // Start Round
    startNewRound();
  }

  function getFormattedModeName() {
    if (state.mode === 'pvp') return 'Two Players';
    if (state.mode === 'ai') return 'Vs Computer';
    if (state.mode === 'infinite') return 'Infinite Mode';
    return 'Tic Tac Toe';
  }

  function getFormattedSubName() {
    if (state.mode === 'ai' || (state.mode === 'infinite' && state.infiniteOpponent === 'ai')) {
      return `Difficulty: ${state.aiDifficulty.charAt(0).toUpperCase() + state.aiDifficulty.slice(1)}`;
    }
    if (state.mode === 'infinite') return 'Pass & Play';
    return 'Standard 1v1';
  }

  function resetAllScores() {
    sound.init();
    sound.playClick();

    state.scores.p1 = 0;
    state.scores.p2 = 0;
    state.scores.draws = 0;
    saveScores();
    updateScoreboardDisplay();
    announce("Scores have been reset to zero.");
  }

  function updateScoreboardDisplay() {
    dom.p1ScoreValue.textContent = state.scores.p1;
    dom.p2ScoreValue.textContent = state.scores.p2;
    dom.tiesScoreValue.textContent = state.scores.draws;
  }

  function updateTurnIndicator() {
    const isP1 = (state.currentTurn === state.p1.mark);
    const activePlayer = isP1 ? state.p1 : state.p2;

    dom.turnStatusText.textContent = `${activePlayer.name}'s Turn (${state.currentTurn})`;

    if (isP1) {
      dom.p1ScoreCard.classList.add('active-turn');
      dom.p2ScoreCard.classList.remove('active-turn');
      dom.turnPulseDot.style.background = 'var(--color-x)';
      dom.turnPulseDot.style.boxShadow = '0 0 10px var(--color-x-glow)';
    } else {
      dom.p2ScoreCard.classList.add('active-turn');
      dom.p1ScoreCard.classList.remove('active-turn');
      dom.turnPulseDot.style.background = 'var(--color-o)';
      dom.turnPulseDot.style.boxShadow = '0 0 10px var(--color-o-glow)';
    }
  }

  /* ==========================================================================
     14. MODAL MANAGEMENT
     ========================================================================== */
  function openResultModal({ icon, title, subtitle, moves, mode, score }) {
    dom.modalResultIcon.textContent = icon;
    dom.modalResultTitle.textContent = title;
    dom.modalResultSub.textContent = subtitle;
    dom.modalStatMode.textContent = mode;
    dom.modalStatMoves.textContent = moves;
    dom.modalStatScore.textContent = score;

    dom.gameOverModal.classList.add('open');
    dom.gameOverModal.setAttribute('aria-hidden', 'false');
  }

  function openHistoryModal() {
    sound.init();
    sound.playClick();
    renderMatchHistory();
    dom.historyModal.classList.add('open');
    dom.historyModal.setAttribute('aria-hidden', 'false');
  }

  function closeAllModals() {
    dom.gameOverModal.classList.remove('open');
    dom.gameOverModal.setAttribute('aria-hidden', 'true');
    dom.historyModal.classList.remove('open');
    dom.historyModal.setAttribute('aria-hidden', 'true');
  }

  function renderMatchHistory() {
    if (!dom.historyList) return;

    if (state.matchHistory.length === 0) {
      dom.historyList.innerHTML = `<div class="history-empty">No matches played yet. Start a battle to record history!</div>`;
      return;
    }

    dom.historyList.innerHTML = state.matchHistory.map(item => `
      <div class="history-item">
        <div class="history-item-left">
          <span class="history-winner">${escapeHtml(item.result)}</span>
          <span class="history-meta">${escapeHtml(item.mode)} &bull; ${escapeHtml(item.date)}</span>
        </div>
        <div class="history-score">${escapeHtml(item.score)}</div>
      </div>
    `).join('');
  }

  function clearMatchHistory() {
    sound.init();
    sound.playClick();
    state.matchHistory = [];
    localStorage.removeItem('nexus_xo_history');
    renderMatchHistory();
    announce("Match history cleared.");
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match]));
  }

  function announce(text) {
    if (dom.srAnnouncements) {
      dom.srAnnouncements.textContent = text;
    }
  }

  /* ==========================================================================
     15. THEME & AUDIO TOGGLES
     ========================================================================== */
  function switchTheme(newTheme) {
    sound.init();
    sound.playClick();
    state.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('nexus_xo_theme', newTheme);
    } catch (e) {
      console.warn(e);
    }
  }

  function toggleLightDarkMode() {
    sound.init();
    sound.playClick();
    const currentMode = document.documentElement.getAttribute('data-mode') || 'dark';
    const nextMode = (currentMode === 'dark') ? 'light' : 'dark';
    state.modeTheme = nextMode;
    document.documentElement.setAttribute('data-mode', nextMode);
    try {
      localStorage.setItem('nexus_xo_mode', nextMode);
    } catch (e) {
      console.warn(e);
    }
  }

  function toggleSoundMute() {
    sound.init();
    state.isMuted = !state.isMuted;
    updateSoundButtonUI();
    try {
      localStorage.setItem('nexus_xo_muted', state.isMuted.toString());
    } catch (e) {
      console.warn(e);
    }
    if (!state.isMuted) {
      sound.playClick();
    }
  }

  function updateSoundButtonUI() {
    const onIcon = dom.soundToggleBtn.querySelector('.sound-on');
    const offIcon = dom.soundToggleBtn.querySelector('.sound-off');
    if (state.isMuted) {
      if (onIcon) onIcon.style.display = 'none';
      if (offIcon) offIcon.style.display = 'inline-flex';
      dom.soundToggleBtn.setAttribute('title', 'Unmute Sound (M)');
    } else {
      if (onIcon) onIcon.style.display = 'inline-flex';
      if (offIcon) offIcon.style.display = 'none';
      dom.soundToggleBtn.setAttribute('title', 'Mute Sound (M)');
    }
  }

  /* ==========================================================================
     16. EVENT LISTENERS & WIRING
     ========================================================================== */
  function setupEventListeners() {
    // Cell clicks
    dom.cells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        const index = parseInt(cell.getAttribute('data-index'), 10);
        handleCellSelection(index);
      });
    });

    // Start Button
    dom.startGameBtn.addEventListener('click', applySetupAndStartGame);

    // Return to Main Menu
    dom.backToMenuBtn.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      stopTurnTimer();
      confetti.stop();
      dom.gameScreen.classList.remove('active');
      dom.startScreen.classList.add('active');
    });

    dom.headerLogo.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      stopTurnTimer();
      confetti.stop();
      closeAllModals();
      dom.gameScreen.classList.remove('active');
      dom.startScreen.classList.add('active');
    });

    // In-game controls
    dom.quickRestartBtn.addEventListener('click', startNewRound);
    dom.resetRoundBtn.addEventListener('click', startNewRound);
    dom.undoBtn.addEventListener('click', undoMove);
    dom.resetScoresBtn.addEventListener('click', resetAllScores);

    // Modal buttons
    dom.modalPlayAgainBtn.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      closeAllModals();
      startNewRound();
    });

    dom.modalMainMenuBtn.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      closeAllModals();
      dom.gameScreen.classList.remove('active');
      dom.startScreen.classList.add('active');
    });

    // History Modal buttons
    dom.historyModalBtn.addEventListener('click', openHistoryModal);
    dom.closeHistoryBtn.addEventListener('click', closeAllModals);
    dom.clearHistoryBtn.addEventListener('click', clearMatchHistory);

    // Header toggles
    dom.themeSelect.addEventListener('change', (e) => switchTheme(e.target.value));
    dom.modeToggleBtn.addEventListener('click', toggleLightDarkMode);
    dom.soundToggleBtn.addEventListener('click', toggleSoundMute);

    // Start Screen Mode card selections
    dom.modeCards.forEach(card => {
      card.addEventListener('click', () => {
        dom.modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        const modeVal = card.getAttribute('data-mode');
        updateModeSetupVisibility(modeVal);
      });
    });

    // Infinite Opponent toggle
    const infOppRadios = document.querySelectorAll('input[name="infiniteOpponent"]');
    infOppRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const val = e.target.value;
        const labels = radio.closest('.segmented-control').querySelectorAll('.segment-btn');
        labels.forEach(l => l.classList.remove('active'));
        radio.closest('.segment-btn').classList.add('active');

        if (val === 'ai') {
          dom.aiDifficultyBox.classList.remove('hidden');
          dom.p2NameLabel.textContent = 'Computer Opponent';
          dom.p2NameInput.value = 'AI';
          dom.p2NameInput.disabled = true;
          dom.p2BadgeText.textContent = 'AI';
        } else {
          dom.aiDifficultyBox.classList.add('hidden');
          dom.p2NameLabel.textContent = 'Player 2 Name';
          dom.p2NameInput.value = 'Player 2';
          dom.p2NameInput.disabled = false;
          dom.p2BadgeText.textContent = 'P2';
        }
      });
    });

    // AI Difficulty buttons
    const diffRadios = document.querySelectorAll('input[name="aiDifficulty"]');
    diffRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const labels = radio.closest('.segmented-control').querySelectorAll('.segment-btn');
        labels.forEach(l => l.classList.remove('active'));
        radio.closest('.segment-btn').classList.add('active');
      });
    });

    // Human Mark buttons
    const markRadios = document.querySelectorAll('input[name="playerMark"]');
    markRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const labels = radio.closest('.segmented-control').querySelectorAll('.segment-btn');
        labels.forEach(l => l.classList.remove('active'));
        radio.closest('.segment-btn').classList.add('active');
      });
    });

    // First Turn buttons
    const firstTurnRadios = document.querySelectorAll('input[name="firstTurn"]');
    firstTurnRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const labels = radio.closest('.segmented-control').querySelectorAll('.segment-btn');
        labels.forEach(l => l.classList.remove('active'));
        radio.closest('.segment-btn').classList.add('active');
      });
    });

    // Close modal on click outside
    window.addEventListener('click', (e) => {
      if (e.target === dom.gameOverModal || e.target === dom.historyModal) {
        closeAllModals();
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', handleKeyboardShortcuts);
  }

  function updateModeSetupVisibility(modeVal) {
    if (modeVal === 'pvp') {
      dom.infiniteOpponentBox.classList.add('hidden');
      dom.aiDifficultyBox.classList.add('hidden');
      dom.humanMarkRow.classList.remove('hidden');
      dom.p2NameLabel.textContent = 'Player 2 Name';
      dom.p2NameInput.value = 'Player 2';
      dom.p2NameInput.disabled = false;
      dom.p2BadgeText.textContent = 'P2';
      dom.firstTurnP2Text.textContent = 'Player 2 (O)';
    } else if (modeVal === 'ai') {
      dom.infiniteOpponentBox.classList.add('hidden');
      dom.aiDifficultyBox.classList.remove('hidden');
      dom.humanMarkRow.classList.remove('hidden');
      dom.p2NameLabel.textContent = 'Computer Opponent';
      dom.p2NameInput.value = 'AI';
      dom.p2NameInput.disabled = true;
      dom.p2BadgeText.textContent = 'AI';
      dom.firstTurnP2Text.textContent = 'Computer (O)';
    } else if (modeVal === 'infinite') {
      dom.infiniteOpponentBox.classList.remove('hidden');
      dom.humanMarkRow.classList.remove('hidden');

      const infAiActive = document.querySelector('input[name="infiniteOpponent"][value="ai"]:checked');
      if (infAiActive) {
        dom.aiDifficultyBox.classList.remove('hidden');
        dom.p2NameLabel.textContent = 'Computer Opponent';
        dom.p2NameInput.value = 'AI';
        dom.p2NameInput.disabled = true;
        dom.p2BadgeText.textContent = 'AI';
        dom.firstTurnP2Text.textContent = 'Computer (O)';
      } else {
        dom.aiDifficultyBox.classList.add('hidden');
        dom.p2NameLabel.textContent = 'Player 2 Name';
        dom.p2NameInput.value = 'Player 2';
        dom.p2NameInput.disabled = false;
        dom.p2BadgeText.textContent = 'P2';
        dom.firstTurnP2Text.textContent = 'Player 2 (O)';
      }
    }
  }

  function handleKeyboardShortcuts(e) {
    // If user is typing in an input field, do not trigger shortcuts
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    const key = e.key;

    // Escape closes modals
    if (key === 'Escape') {
      closeAllModals();
      return;
    }

    // Only allow game shortcuts if Game Screen is currently active
    if (!dom.gameScreen.classList.contains('active')) {
      return;
    }

    // Number keys 1-9 for placing marks
    // Top row 1-9 standard reading order: 1=0, 2=1, ..., 9=8
    if (key >= '1' && key <= '9') {
      const cellIndex = parseInt(key, 10) - 1;
      handleCellSelection(cellIndex);
      return;
    }

    // Traditional Numpad mapping (7=top-left, 9=top-right, 1=bot-left, 3=bot-right)
    const numpadMap = {
      'Numpad7': 0, 'Numpad8': 1, 'Numpad9': 2,
      'Numpad4': 3, 'Numpad5': 4, 'Numpad6': 5,
      'Numpad1': 6, 'Numpad2': 7, 'Numpad3': 8
    };
    if (numpadMap[e.code] !== undefined) {
      handleCellSelection(numpadMap[e.code]);
      return;
    }

    // 'R' or 'r': Restart round
    if (key === 'r' || key === 'R') {
      startNewRound();
      return;
    }

    // 'U' or 'u': Undo move
    if (key === 'u' || key === 'U') {
      undoMove();
      return;
    }

    // 'M' or 'm': Toggle Mute
    if (key === 'm' || key === 'M') {
      toggleSoundMute();
      return;
    }
  }

  /* ==========================================================================
     17. INITIALIZATION ON PAGE LOAD
     ========================================================================== */
  function init() {
    loadPersistedData();
    updateSoundButtonUI();
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
