// Global Leaderboard module — powered by Dreamlo
// Uses frontend fetch API to communicate with a free leaderboard BaaS

const PUBLIC_KEY = '69f739268f40bb1068c254cc';
const PRIVATE_KEY = 'roLmuVlKXEOr4ey24KjZ5gB1jufVdy0065mfMAV3uqLg';
const MAX_ENTRIES = 5;

let cachedBoard = [];
let isFetching = false;

/** Fetch leaderboard from Dreamlo */
export async function fetchLeaderboard(force = false) {
  if (isFetching && !force) return cachedBoard;
  isFetching = true;
  try {
    // Dreamlo returns JSON with `{ "dreamlo": { "leaderboard": { "entry": [...] } } }`
    const res = await fetch(`https://dreamlo.com/lb/${PUBLIC_KEY}/json`);
    const data = await res.json();
    let entries = [];
    if (data.dreamlo && data.dreamlo.leaderboard && data.dreamlo.leaderboard.entry) {
      const e = data.dreamlo.leaderboard.entry;
      entries = Array.isArray(e) ? e : [e];
    }
    
    cachedBoard = entries.map(e => ({
      name: e.name,
      score: parseInt(e.score, 10),
      level: parseInt(e.seconds, 10) || 1
    })).slice(0, MAX_ENTRIES);
  } catch (err) {
    console.error("Failed to fetch global leaderboard", err);
  }
  isFetching = false;
  return cachedBoard;
}

/** Save a new entry to Dreamlo */
export async function saveToLeaderboard(name, score, level) {
  // Sanitize name for URL (Dreamlo uses path parameters)
  const safeName = encodeURIComponent(name.slice(0, 16).replace(/[^a-zA-Z0-9_\- ]/g, '').trim()) || 'UNKNOWN';
  
  try {
    // Dreamlo add endpoint: /add/{name}/{score}/{seconds}
    // We map level to the 'seconds' field so we can store it.
    await fetch(`https://dreamlo.com/lb/${PRIVATE_KEY}/add/${safeName}/${score}/${level}`);
    await fetchLeaderboard(true); // force refresh cache after saving
  } catch (err) {
    console.error("Failed to save to global leaderboard", err);
  }
}

/** Check if a score qualifies (checks local cache to avoid blocking) */
export function qualifiesForLeaderboard(score) {
  if (cachedBoard.length < MAX_ENTRIES) return true;
  return score > cachedBoard[cachedBoard.length - 1].score;
}

/**
 * Render leaderboard HTML into a container element.
 * Handles loading state automatically.
 */
export function renderLeaderboard(container, currentName, currentScore, currentLevel) {
  container.innerHTML = '<div class="lb-title">GLOBAL TOP PILOTS</div><div style="text-align:center; padding: 20px; color:#00fff7; font-family:\'Orbitron\', sans-serif;">CONNECTING TO SATELLITE...</div>';
  
  fetchLeaderboard().then(board => {
    let html = '<div class="lb-title">GLOBAL TOP PILOTS</div>';
    html += '<table class="lb-table"><thead><tr><th>#</th><th>NAME</th><th>SCORE</th><th>LVL</th></tr></thead><tbody>';

    if (board.length === 0) {
      html += '<tr><td colspan="4" class="lb-empty">NO RECORDS YET</td></tr>';
    } else {
      board.forEach((entry, i) => {
        // Handle name matching roughly because of sanitization
        const safeCurrentName = currentName ? currentName.slice(0, 16).replace(/[^a-zA-Z0-9_\- ]/g, '').trim() : '';
        const isCurrent = safeCurrentName && entry.name === safeCurrentName && entry.score === currentScore;
        const cls = isCurrent ? ' class="lb-highlight"' : '';
        html += `<tr${cls}><td>${i + 1}</td><td>${escapeHtml(entry.name)}</td><td>${String(entry.score).padStart(7, '0')}</td><td>${entry.level}</td></tr>`;
      });
    }

    html += '</tbody></table>';

    if (currentName) {
      html += '<div class="lb-current">';
      html += `<span class="lb-current-label">YOUR RUN</span>`;
      html += `<span class="lb-current-name">${escapeHtml(currentName)}</span>`;
      html += `<span class="lb-current-score">${String(currentScore).padStart(7, '0')}</span>`;
      html += `<span class="lb-current-level">LVL ${currentLevel}</span>`;
      
      const isOnBoard = board.some(e => e.name === currentName.slice(0, 16).replace(/[^a-zA-Z0-9_\- ]/g, '').trim() && e.score === currentScore);
      if (isOnBoard) {
         html += `<span class="lb-badge">★ NEW HIGH SCORE</span>`;
      }

      html += '</div>';
    }

    container.innerHTML = html;
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Prefetch on script load
fetchLeaderboard();
