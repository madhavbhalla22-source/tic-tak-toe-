# ⚡ Nexus Tic Tac Toe — Modern Glassmorphism Web Game

A modern, responsive, and feature-rich Tic Tac Toe game built using plain **HTML5**, **CSS3**, and vanilla **JavaScript** (no frameworks, no npm installs, and zero external runtime libraries).

Simply double-click or open `index.html` in any web browser to play!

---

## 🎮 Game Modes

1. **👥 Two Players (Local Pass & Play)**
   - Classic 1v1 battle on the same device.
   - Customizable player names.
   - Choose who plays as X or O and who starts first.
   - Live scoreboard tracking wins and draws.

2. **🤖 Vs Computer (AI)**
   - **🌱 Easy**: Casual play with random computer moves.
   - **⚡ Medium**: Smart tactical AI that seizes immediate winning lines and blocks your forks.
   - **🧠 Unbeatable (Hard)**: Powered by the optimal **Minimax algorithm** with alpha-beta pruning — mathematically impossible to defeat!
   - Realistic "Computer is thinking..." natural timing delay for immersive feel.

3. **♾️ Infinite Mode (Special Twist)**
   - Each player can only have **3 marks on the board at a time**.
   - When a player places their 4th mark, their **oldest mark vanishes**!
   - The oldest mark glows with a subtle warning animation before it disappears so you can plan your next turn.
   - Playable both local 1v1 and vs Computer AI.
   - **Zero stalemates/draws** — dynamic and fast-paced!

---

## ✨ Features & Design Highlights

- **Modern Glassmorphism UI**: Frosted translucent cards (`backdrop-filter: blur`), subtle specular borders, and soft glowing neon accents.
- **Animated Gradient Canvas**: Slowly drifting cosmic gradients with ambient floating blobs.
- **3 Color Themes & Light/Dark Mode**:
  - 🌌 **Aurora**: Neon Purple, Electric Pink, Cyan & Rose
  - 🌅 **Sunset**: Warm Orange, Amber, Fiery Red & Sky Blue
  - 🌊 **Ocean**: Deep Aqua, Emerald, Mint & Sky
  - Dedicated **☀️ Light Mode** and **🌙 Dark Mode** for all themes.
  - Automatically remembers your selected theme and mode in `localStorage`.
- **SVG Marks & Glow**: Custom vector-drawn X and O symbols with animated draw-in strokes and glowing drop-shadows.
- **Winning Strike Animation**: Glowing SVG line that animates directly across the winning three cells.
- **Board Shake Animation**: Gentle physical shake feedback when a draw occurs.
- **Confetti Celebration**: Pure vanilla JS & HTML5 canvas particle explosion with physics and gravity on game victory.
- **Web Audio API Sound Synthesizer**: Custom, synthesized sound effects for moves, clicks, disappearing marks, victory fanfares, and draws. **No external MP3/WAV files required**, with one-click mute toggle.
- **Optional Turn Timer**: 10-second countdown with an animated circular progress ring; auto-plays a random move if time expires.
- **Undo Move Support**: Undo your moves at any time (supports reverting moves in both 2-Player and Vs AI modes).
- **Match History**: Persistent drawer displaying your last 10 completed matches and results.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| <kbd>1</kbd> - <kbd>9</kbd> | Place mark in grid cell (top-left to bottom-right) |
| <kbd>Numpad 1-9</kbd> | Place mark using standard keypad coordinates |
| <kbd>U</kbd> | Undo last move |
| <kbd>R</kbd> | Restart round / New round |
| <kbd>M</kbd> | Toggle sound effects on/off |
| <kbd>Esc</kbd> | Close any open modal |

---

## 🚀 How to Run

1. Open the project folder:
   `c:\Users\LENOVO\OneDrive\Desktop\tic tac toe`
2. Double-click `index.html` or open it with your favorite browser (Google Chrome, Microsoft Edge, Firefox, Safari, Brave, etc.).
3. Enjoy the game!
