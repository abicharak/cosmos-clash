// Retro sound effects using Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx = null;

function ensureCtx() {
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

export function playShoot() {
  const c = ensureCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(880, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.1);
  g.gain.setValueAtTime(0.15, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + 0.1);
}

export function playExplosion() {
  const c = ensureCtx();
  const bufSize = c.sampleRate * 0.3;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(0.2, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.setValueAtTime(800, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.3);
  src.connect(f).connect(g).connect(c.destination);
  src.start(); src.stop(c.currentTime + 0.3);
}

export function playHit() {
  const c = ensureCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(200, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.15);
  g.gain.setValueAtTime(0.12, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + 0.15);
}

export function playPowerup() {
  const c = ensureCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(440, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(1760, c.currentTime + 0.2);
  g.gain.setValueAtTime(0.12, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + 0.25);
}

export function playBossHit() {
  const c = ensureCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(120, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.2);
  g.gain.setValueAtTime(0.18, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + 0.2);
}
