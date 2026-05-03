import './style.css';
import { Player, Boss, Powerup } from './entities.js';
import { StarField, spawnExplosion } from './particles.js';
import { WaveManager } from './waves.js';
import { playExplosion, playHit, playPowerup, playBossHit } from './audio.js';
import { qualifiesForLeaderboard, saveToLeaderboard, renderLeaderboard } from './leaderboard.js';

// ---- DOM refs ----
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score-display');
const livesEl = document.getElementById('lives-display');
const waveEl = document.getElementById('wave-display');
const levelEl = document.getElementById('level-display');
const titleScreen = document.getElementById('title-screen');
const nameScreen = document.getElementById('name-screen');
const nameInput = document.getElementById('player-name-input');
const nameSubmitBtn = document.getElementById('name-submit-btn');
const gameoverScreen = document.getElementById('gameover-screen');
const victoryScreen = document.getElementById('victory-screen');
const pauseScreen = document.getElementById('pause-screen');
const finalScoreEl = document.getElementById('final-score');
const finalLevelEl = document.getElementById('final-level');
const victoryScoreEl = document.getElementById('victory-score');
const levelUpBanner = document.getElementById('levelup-banner');
const levelUpText = document.getElementById('levelup-text');
const gameoverLeaderboard = document.getElementById('gameover-leaderboard');
const victoryLeaderboard = document.getElementById('victory-leaderboard');
const titleLeaderboard = document.getElementById('title-leaderboard');
const nameLeaderboard = document.getElementById('name-leaderboard');
const touchControls = document.getElementById('touch-controls');

// ---- Game state ----
let W, H;
let state = 'title'; // title, name, playing, paused, gameover, victory
let score = 0, lives = 3;
let playerName = '';
let player, enemies, bullets, particles, powerups, boss;
let starField;
let waveManager;
let keys = {};
let lastTime = 0;
let screenShake = 0;
let levelUpTimer = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  if (starField) starField.resize(W, H);
}
window.addEventListener('resize', resize);
resize();

starField = new StarField(W, H, 150);

// ---- Input ----
window.addEventListener('keydown', e => {
  keys[e.code] = true;

  if (e.code === 'Enter') {
    if (state === 'title') {
      showNameScreen();
    } else if (state === 'name') {
      submitName();
    } else if (state === 'gameover' || state === 'victory') {
      showNameScreen();
    }
  }

  if (e.code === 'KeyP') togglePause();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

titleScreen.addEventListener('click', () => { if (state === 'title') showNameScreen(); });
gameoverScreen.addEventListener('click', () => { if (state === 'gameover') showNameScreen(); });
victoryScreen.addEventListener('click', () => { if (state === 'victory') showNameScreen(); });
nameSubmitBtn.addEventListener('click', submitName);

// ---- Touch Controls ----
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  touchControls.style.display = 'flex';
}

function bindTouchKey(btnId, keyCode) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const press = (e) => { e.preventDefault(); keys[keyCode] = true; };
  const release = (e) => { e.preventDefault(); keys[keyCode] = false; };
  
  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('mousedown', press);
  btn.addEventListener('touchend', release, { passive: false });
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
}

bindTouchKey('btn-up', 'ArrowUp');
bindTouchKey('btn-down', 'ArrowDown');
bindTouchKey('btn-left', 'ArrowLeft');
bindTouchKey('btn-right', 'ArrowRight');
bindTouchKey('btn-fire', 'Space');

const btnPause = document.getElementById('btn-pause');
if (btnPause) {
  btnPause.addEventListener('touchstart', (e) => {
    e.preventDefault();
    togglePause();
  }, { passive: false });
  btnPause.addEventListener('mousedown', (e) => {
    e.preventDefault();
    togglePause();
  });
}

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    pauseScreen.style.display = '';
  } else if (state === 'paused') {
    state = 'playing';
    pauseScreen.style.display = 'none';
    lastTime = performance.now();
  }
}

// ---- Name Screen ----
function showNameScreen() {
  hideAllScreens();
  state = 'name';
  nameScreen.style.display = '';
  nameInput.value = '';
  if (nameLeaderboard) {
    renderLeaderboard(nameLeaderboard, null, null, null);
  }
  nameInput.focus();
}

function submitName() {
  const name = nameInput.value.trim().toUpperCase();
  if (name.length === 0) {
    nameInput.style.borderColor = '#ff3131';
    nameInput.style.boxShadow = '0 0 20px rgba(255, 49, 49, 0.4)';
    setTimeout(() => { nameInput.style.borderColor = ''; nameInput.style.boxShadow = ''; }, 600);
    return;
  }
  playerName = name.slice(0, 16);
  startGame();
}

// ---- Collision ----
function boxCollide(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

// ---- Hide all screens ----
function hideAllScreens() {
  titleScreen.style.display = 'none';
  nameScreen.style.display = 'none';
  gameoverScreen.style.display = 'none';
  victoryScreen.style.display = 'none';
  pauseScreen.style.display = 'none';
  levelUpBanner.style.display = 'none';
}

// ---- Init ----
function startGame() {
  score = 0; lives = 3;
  player = new Player(W / 2, H - 80);
  enemies = []; bullets = []; particles = []; powerups = [];
  boss = null;
  waveManager = new WaveManager();
  state = 'playing';
  levelUpTimer = 0;
  hideAllScreens();
  updateHUD();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function showLevelUpBanner(level) {
  levelUpText.textContent = `LEVEL ${level}`;
  levelUpBanner.style.display = '';
  // Force re-trigger CSS animation
  const span = levelUpBanner.querySelector('span');
  span.style.animation = 'none';
  span.offsetHeight; // reflow
  span.style.animation = '';
  levelUpTimer = 2;
}

function spawnBoss() {
  const wm = waveManager;
  const colors = wm.bossColorSet;
  boss = new Boss(W, {
    hp: wm.bossHp,
    speed: wm.bossSpeed,
    shootRate: wm.bossShootRate,
    spread: wm.bossSpread,
    score: wm.bossScore,
    bodyColor: colors.body,
    coreColor: colors.core,
    eyeColor: colors.eyes,
    bulletColor: colors.bullet,
  });
}

function handleEndGame(endType) {
  const currentLevel = waveManager.level;

  // Save to leaderboard if qualifies
  if (qualifiesForLeaderboard(score)) {
    saveToLeaderboard(playerName, score, currentLevel);
  }

  if (endType === 'gameover') {
    state = 'gameover';
    finalScoreEl.textContent = `SCORE: ${String(score).padStart(7, '0')}`;
    finalLevelEl.textContent = `REACHED LEVEL: ${currentLevel}`;
    renderLeaderboard(gameoverLeaderboard, playerName, score, currentLevel);
    gameoverScreen.style.display = '';
  } else {
    state = 'victory';
    victoryScoreEl.textContent = `SCORE: ${String(score).padStart(7, '0')}`;
    renderLeaderboard(victoryLeaderboard, playerName, score, currentLevel);
    victoryScreen.style.display = '';
  }
}

function updateHUD() {
  scoreEl.textContent = String(score).padStart(7, '0');
  livesEl.textContent = '♥'.repeat(Math.max(0, lives));
  if (waveManager) {
    levelEl.textContent = `LEVEL ${waveManager.level}`;
    waveEl.textContent = waveManager.currentWaveName;
  }
}

// ---- Game Loop ----
function loop(now) {
  if (state !== 'playing') { if (state === 'paused') requestAnimationFrame(loop); return; }
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

function update(dt) {
  starField.update(dt, H);

  // Level up banner timer
  if (levelUpTimer > 0) {
    levelUpTimer -= dt;
    if (levelUpTimer <= 0) levelUpBanner.style.display = 'none';
  }

  // Player
  player.update(dt, keys, W, H);
  if (keys['Space']) player.shoot(bullets);

  // Wave manager
  waveManager.update(dt, enemies, W);

  // Boss spawn
  if (waveManager.isBossWave && !boss && !waveManager.bossSpawned) {
    spawnBoss();
    waveManager.bossSpawned = true;
  }

  // Boss update
  if (boss) boss.update(dt, W, H, bullets);

  // Enemies
  enemies.forEach(e => e.update(dt, W, H, bullets));
  enemies = enemies.filter(e => !e.dead);

  // Bullets
  bullets.forEach(b => b.update(dt, H));
  bullets = bullets.filter(b => !b.dead);

  // Particles
  particles.forEach(p => p.update(dt));
  particles = particles.filter(p => !p.dead);

  // Powerups
  powerups.forEach(p => p.update(dt, H));
  powerups = powerups.filter(p => !p.dead);

  // ---- Collisions ----
  // Player bullets vs enemies
  bullets.filter(b => b.isPlayer).forEach(b => {
    enemies.forEach(e => {
      if (!b.dead && !e.dead && boxCollide(b, e)) {
        b.dead = true;
        e.hp--;
        if (e.hp <= 0) {
          e.dead = true;
          score += e.score;
          playExplosion();
          spawnExplosion(particles, e.x, e.y, 15, [e.color, '#fff', '#ffe100']);
          if (Math.random() < 0.15) powerups.push(new Powerup(e.x, e.y));
        } else {
          playHit();
          spawnExplosion(particles, b.x, b.y, 5, ['#fff']);
        }
      }
    });
    // vs boss
    if (boss && !b.dead && boxCollide(b, boss)) {
      b.dead = true;
      boss.hp--;
      playBossHit();
      spawnExplosion(particles, b.x, b.y, 5, [boss.bodyColor, boss.coreColor]);
      screenShake = 0.08;
      if (boss.hp <= 0) {
        score += boss.score;
        playExplosion();
        spawnExplosion(particles, boss.x, boss.y, 60, [boss.bodyColor, boss.coreColor, '#00fff7', '#fff']);
        boss = null;
        screenShake = 0.3;

        // Tell wave manager boss is defeated
        waveManager.onBossDefeated();

        // Check victory (level 50 completed)
        if (waveManager.gameComplete) {
          setTimeout(() => { handleEndGame('victory'); }, 1200);
        } else {
          // Clear remaining enemy bullets for fairness
          bullets = bullets.filter(b => b.isPlayer);
          setTimeout(() => {
            if (state === 'playing') showLevelUpBanner(waveManager.level);
          }, 800);
        }
      }
    }
  });

  // Enemy bullets vs player
  if (player.invincible <= 0) {
    bullets.filter(b => !b.isPlayer).forEach(b => {
      if (!b.dead && boxCollide(b, player)) {
        b.dead = true;
        playerHit();
      }
    });
    // Enemy body vs player
    enemies.forEach(e => {
      if (!e.dead && boxCollide(e, player)) {
        e.dead = true;
        score += e.score;
        spawnExplosion(particles, e.x, e.y, 10, [e.color, '#fff']);
        playerHit();
      }
    });
    // Boss body vs player
    if (boss && boxCollide(boss, player)) playerHit();
  }

  // Powerups vs player
  powerups.forEach(p => {
    if (!p.dead && boxCollide(p, player)) {
      p.dead = true;
      playPowerup();
      player.powerLevel = Math.min(2, player.powerLevel + 1);
      player.powerTimer = 8;
      score += 50;
      spawnExplosion(particles, p.x, p.y, 10, ['#39ff14', '#fff']);
    }
  });

  // Screen shake decay
  if (screenShake > 0) screenShake = Math.max(0, screenShake - dt);

  updateHUD();
}

function playerHit() {
  lives--;
  playExplosion();
  spawnExplosion(particles, player.x, player.y, 20, ['#00fff7', '#fff', '#ff3131']);
  screenShake = 0.2;
  player.invincible = 2;
  player.powerLevel = 0;
  if (lives <= 0) {
    handleEndGame('gameover');
  }
}

function render() {
  ctx.save();
  // Screen shake
  if (screenShake > 0) {
    const intensity = screenShake * 40;
    ctx.translate(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    );
  }

  // Clear
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);

  // Stars
  starField.draw(ctx);

  // Powerups
  powerups.forEach(p => p.draw(ctx));

  // Enemies
  enemies.forEach(e => e.draw(ctx));

  // Boss
  if (boss) boss.draw(ctx);

  // Bullets
  bullets.forEach(b => b.draw(ctx));

  // Player
  player.draw(ctx);

  // Particles
  particles.forEach(p => p.draw(ctx));

  ctx.restore();
}

// Start RAF for title screen stars
function titleLoop(now) {
  if (state !== 'title' && state !== 'name' && state !== 'gameover' && state !== 'victory') return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  starField.update(dt, H);
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);
  starField.draw(ctx);
  requestAnimationFrame(titleLoop);
}

// Initial leaderboard render for title screen
if (titleLeaderboard) {
  renderLeaderboard(titleLeaderboard, null, null, null);
}

lastTime = performance.now();
requestAnimationFrame(titleLoop);
