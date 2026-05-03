// Leaderboard module — localStorage-backed top 5 scores
// Memory-conscious: only stores exactly 5 entries max

const STORAGE_KEY = 'cosmos_clash_leaderboard';
const MAX_ENTRIES = 5;

/**
 * @typedef {{ name: string, score: number, level: number }} LeaderboardEntry
 */

const DEFAULT_LEADERBOARD = [
  { name: 'APOLLO', score: 50000, level: 10 },
  { name: 'STARBUCK', score: 40000, level: 8 },
  { name: 'VIPER', score: 30000, level: 6 },
  { name: 'JESTER', score: 20000, level: 4 },
  { name: 'MAVERICK', score: 10000, level: 2 }
];

/** Load leaderboard from localStorage. Returns sorted array (max 5). */
export function loadLeaderboard() {
  let stored = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        stored = data
          .filter(e => e && typeof e.name === 'string' && typeof e.score === 'number')
          .map(e => ({ name: e.name.slice(0, 16), score: e.score, level: e.level || 1 }));
      }
    }
  } catch {}

  const merged = new Map();
  // Add defaults
  DEFAULT_LEADERBOARD.forEach(e => {
    merged.set(`${e.name}_${e.score}`, e);
  });
  
  // Add stored entries
  stored.forEach((e, i) => {
    const key = `${e.name}_${e.score}`;
    // If it matches a default exactly, deduplicate it. Otherwise, keep it unique.
    if (merged.has(key) && merged.get(key).level === e.level) {
      merged.set(key, e);
    } else {
      merged.set(`${key}_${i}`, e);
    }
  });

  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

/** Check if a score qualifies for the leaderboard. */
export function qualifiesForLeaderboard(score) {
  const board = loadLeaderboard();
  if (board.length < MAX_ENTRIES) return true;
  return score > board[board.length - 1].score;
}

/** Save a new entry if it qualifies. Returns the updated board. */
export function saveToLeaderboard(name, score, level) {
  const board = loadLeaderboard();
  board.push({ name: name.slice(0, 16), score, level });
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — silently fail
  }
  return trimmed;
}

/**
 * Render leaderboard HTML into a container element.
 * @param {HTMLElement} container
 * @param {string} currentName - current player name (to highlight)
 * @param {number} currentScore - current player score
 * @param {number} currentLevel - current player level
 */
export function renderLeaderboard(container, currentName, currentScore, currentLevel) {
  const board = loadLeaderboard();
  const isOnBoard = board.some(e => e.name === currentName && e.score === currentScore);

  let html = '<div class="lb-title">TOP PILOTS</div>';
  html += '<table class="lb-table"><thead><tr><th>#</th><th>NAME</th><th>SCORE</th><th>LVL</th></tr></thead><tbody>';

  if (board.length === 0) {
    html += '<tr><td colspan="4" class="lb-empty">NO RECORDS YET</td></tr>';
  } else {
    board.forEach((entry, i) => {
      const isCurrent = entry.name === currentName && entry.score === currentScore;
      const cls = isCurrent ? ' class="lb-highlight"' : '';
      html += `<tr${cls}><td>${i + 1}</td><td>${escapeHtml(entry.name)}</td><td>${String(entry.score).padStart(7, '0')}</td><td>${entry.level}</td></tr>`;
    });
  }

  html += '</tbody></table>';

  // Always show current player info below
  html += '<div class="lb-current">';
  html += `<span class="lb-current-label">YOUR RUN</span>`;
  html += `<span class="lb-current-name">${escapeHtml(currentName)}</span>`;
  html += `<span class="lb-current-score">${String(currentScore).padStart(7, '0')}</span>`;
  html += `<span class="lb-current-level">LVL ${currentLevel}</span>`;
  if (isOnBoard) {
    html += `<span class="lb-badge">★ NEW HIGH SCORE</span>`;
  }
  html += '</div>';

  container.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
