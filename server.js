// ════════════════════════════════════════════════════════
// SERVER ENTRY POINT
// Handles Express setup, Socket.io, and delegates game
// logic to routes/pm.js and routes/taboo.js
// ════════════════════════════════════════════════════════
'use strict';

const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const path        = require('path');
const compression = require('compression');

const pm    = require('./routes/pm');
const taboo = require('./routes/taboo');
const dots       = require('./routes/dots');
const twotruth   = require('./routes/twotruth');
const lobbyHub   = require('./routes/lobby');

const app = express();
app.use(compression());

// ─── STATIC + PAGE ROUTES ────────────────────────────────
app.get('/taboo', (req, res) => res.sendFile(path.join(__dirname, 'public/taboo.html')));
app.get('/twotruth', (req, res) => res.sendFile(path.join(__dirname, 'public/twotruth.html')));
app.get('/dots',        (req, res) => res.sendFile(path.join(__dirname, 'public/dots.html')));
app.get('/games', (req, res) => res.sendFile(path.join(__dirname, 'public/games.html')));
app.use(express.static(path.join(__dirname, 'public')));

// ─── HEALTH + DEBUG ──────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  pm_rooms:    pm.getRoomCount(),
  taboo_rooms: taboo.getTabooRoomCount(),
  dots_rooms:       dots.getDotsRoomCount(),
  twotruth_rooms:   twotruth.getTTRoomCount(),
}));

app.get('/room/:code', (req, res) => {
  const room = pm.getRoomByCode(req.params.code.toUpperCase());
  if (!room) return res.json({ exists: false });
  res.json({ exists: true, players: room.players.length, phase: room.state.phase });
});

// ─── SOCKET.IO ───────────────────────────────────────────
const server = http.createServer(app);
const io     = new Server(server, {
  cors:          { origin: '*' },
  transports:    ['websocket', 'polling'],
  allowEIO3:     true,
  pingTimeout:   60000,
  pingInterval:  25000,
});

lobbyHub.init(io);

io.on('connection', (socket) => {
  pm.register(io, socket);
  taboo.register(io, socket);
  dots.register(io, socket);
  twotruth.register(io, socket);
});

// ─── START ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎮 Server running on http://localhost:${PORT}`));
