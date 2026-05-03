# Cosmos Clash — Retro Space Shooter

**Cosmos Clash** is a fast-paced, retro-styled endless space shooter built for the browser. Blast your way through alien invaders, defeat evolving bosses, and chase the highest score across 50 progressive levels! 

![Cosmos Clash Gameplay](https://cosmosclash.vercel.app/) <!-- Placeholder for actual screenshot -->

## 🚀 Features

- **Endless Progression (Up to 50 Levels):** Face increasingly difficult waves of enemies. Completing all 50 levels results in a glorious Victory!
- **Evolving Boss Battles:** At the end of every level, face off against a Boss that changes color. Every 5 levels, the boss gains a difficulty tier upgrade (increased HP, speed, and bullet spread).
- **Power-Ups:** Destroy enemies to collect power-ups that upgrade your ship's weaponry from a single laser to a devastating triple-shot.
- **Top 5 Leaderboard:** Enter your callsign before launch! The game locally stores and displays the top 5 highest-scoring pilots using `localStorage`.
- **Authentic Retro Aesthetics:** Beautiful neon visuals complete with CRT scanlines, screen glow, particle explosions, and screen-shake effects.
- **Synthesized Audio:** Custom retro sound effects (shooting, explosions, power-ups, and boss hits) generated dynamically using the Web Audio API.

## 🛠️ Technology Stack

- **Core:** HTML5, Vanilla CSS, and Vanilla JavaScript (ES6 Modules)
- **Rendering:** HTML5 `<canvas>` API
- **Audio:** Web Audio API (No external sound files required)
- **Build Tool:** [Vite](https://vitejs.dev/) for blazing-fast development and bundling

## 🎮 Controls

| Key | Action |
| --- | --- |
| `W A S D` or `↑ ← ↓ →` | Move your ship |
| `Space` | Fire weapons |
| `P` | Pause / Resume game |
| `Enter` | Start Game / Submit Name / Retry |

## 💻 Running Locally

To run Cosmos Clash on your local machine, ensure you have [Node.js](https://nodejs.org/) installed, then follow these steps:

1. Clone the repository or download the source code.
2. Navigate into the project directory:
   ```bash
   cd Cosmos_Clash
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173/` (or the URL provided in your terminal).

## 🌐 Deployment (Vercel)

Cosmos Clash is optimized and ready to be deployed instantly on **Vercel**. 

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your repository.
4. Vercel will automatically detect the Vite framework. 
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**. Your retro space shooter will be live and accessible globally within seconds!

## 📁 Project Structure

```text
├── index.html           # Main game shell and UI overlays (HUD, Menus)
├── public/
│   └── game_icon.png    # Favicon
├── src/
│   ├── audio.js         # Web Audio API sound synthesizers
│   ├── entities.js      # Player, Enemy, Boss, Bullet, and Powerup classes
│   ├── leaderboard.js   # LocalStorage leaderboard management
│   ├── main.js          # Main game loop, state management, and collisions
│   ├── particles.js     # Particle explosions and scrolling starfield
│   ├── style.css        # UI styling, CRT effects, and animations
│   └── waves.js         # Wave progression and scaling logic
└── package.json         # Project configuration and dependencies
```

## 📜 License

This project is licensed under the [MIT License](LICENSE).
