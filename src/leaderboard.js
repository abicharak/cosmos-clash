// Leaderboard module — localStorage-backed top 5 scores
// Memory-conscious: only stores exactly 5 entries max

const STORAGE_KEY = 'cosmos_clash_leaderboard';
const MAX_ENTRIES = 5;

/**
 * @typedef {{ name: string, score: number, level: number }} LeaderboardEntry
 */

/** Load leaderboard from localStorage. Returns sorted array (max 5). */
export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // Sanitize & trim to MAX_ENTRIES
    return data
      .filter(e => e && typeof e.name === 'string' && typeof e.score === 'number')
      .map(e => ({ name: e.name.slice(0, 16), score: e.score, level: e.level || 1 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
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
