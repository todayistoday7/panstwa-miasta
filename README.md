# 🎮 Państwa-Miasta — Real-Time Multiplayer

A real-time multiplayer word game supporting unlimited simultaneous rooms.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm start
```
Open **http://localhost:3000** in your browser.

For development with auto-restart:
```bash
npm run dev
```

---

## How It Works

- One player **creates a room** → gets a 5-character room code (e.g. `WOLF4`)
- Other players **join with the code** — each on their own phone/laptop
- Host controls the game (draw letter, start round, scoring)
- All players see updates in real-time via WebSockets

## Room Capacity
- **Max 12 players per room**
- **Unlimited simultaneous rooms** — 100 groups of 5 can all play at once with no interference

---

## Deploying to the Web

### Option A: Railway (easiest, free tier available)
1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Railway auto-detects Node.js and sets the start command
4. Your game is live at a public URL in ~2 minutes

### Option B: Render
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Build command: `npm install`
4. Start command: `node server.js`
5. Free tier available

### Option C: Fly.io
```bash
npm install -g flyctl
fly launch
fly deploy
```

### Option D: Your own VPS (DigitalOcean, Hetzner, etc.)
```bash
# On your server:
git clone <your-repo>
cd panstwa-miasta
npm install
# Install PM2 to keep it running:
npm install -g pm2
pm2 start server.js --name panstwa-miasta
pm2 save
pm2 startup
```
Then point your domain/nginx to port 3000.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | Port to listen on |

Set `PORT` automatically on most hosting platforms.

---

## Project Structure

```
panstwa-miasta/
├── server.js          # Node.js + Socket.io backend
├── package.json
└── public/
    ├── index.html     # Main game UI
    ├── css/
    │   └── style.css
    └── js/
        ├── langs.js   # All language strings (PL/EN/DE/FR/ES)
        └── client.js  # Socket.io client + game logic
```

---

## Features
- ✅ Real-time multiplayer — each player on their own device
- ✅ Unlimited simultaneous rooms with unique codes
- ✅ 5 languages: Polish, English, German, French, Spanish
- ✅ Challenge / majority vote system for fake words
- ✅ Host controls: scoring override, challenge management
- ✅ Progress tracker (host sees how far each player is)
- ✅ Automatic scoring with manual override
- ✅ Disconnection handling
- ✅ Up to 12 players per room
