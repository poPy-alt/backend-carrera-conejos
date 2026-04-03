const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Almacén para estados de juego por sala (RPS, Obstáculos y Proyectiles)
const gameRooms = {};

// Función auxiliar para generar obstáculos (aleatorios pero fijos para la sesión)
function generateLevelObstacles() {
  const obs = [];
  const ROWS = 20, COLS = 18;
  const reserved = new Set(["0,0", "0,1", "1,0", "19,17", "19,16", "18,17", "10,9"]); // Inicio, fin y centro
  
  while (obs.length < 23) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    const k = `${r},${c}`;
    if (!reserved.has(k) && !obs.includes(k)) {
      obs.push(k);
    }
  }
  return obs;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_game', (data) => {
    const { room, profile } = data;
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    if (!gameRooms[room]) {
      gameRooms[room] = {
        obstacles: generateLevelObstacles(),
        projectileInterval: null,
        rps: {},
        players: {},
        scenario: profile.scenario || 'rabbits'
      };
    }

    // Usar el número enviado por el cliente para la posición si es válido
    if (data.playerNumber === 1) {
      gameRooms[room].players.p1 = { ...profile, socketId: socket.id };
    } else if (data.playerNumber === 2) {
      gameRooms[room].players.p2 = { ...profile, socketId: socket.id };
    } else {
      // Fallback si no viene playerNumber
      if (!gameRooms[room].players.p1) gameRooms[room].players.p1 = { ...profile, socketId: socket.id };
      else if (!gameRooms[room].players.p2) gameRooms[room].players.p2 = { ...profile, socketId: socket.id };
    }

    // Notificar a todos sobre los perfiles asignados
    io.to(room).emit('room_players_sync', {
      p1: gameRooms[room].players.p1,
      p2: gameRooms[room].players.p2,
      roomScenario: gameRooms[room].scenario
    });

    const currentSessions = io.sockets.adapter.rooms.get(room);
    const clientCount = currentSessions?.size || 0;

    socket.emit('sync_obstacles', gameRooms[room].obstacles);

    if (clientCount === 2 && !gameRooms[room].projectileInterval) {
      gameRooms[room].projectileInterval = setInterval(() => {
        const col = Math.floor(Math.random() * 18);
        const id = `carrot-${Date.now()}-${Math.random()}`;
        io.to(room).emit('spawn_projectile_sync', { id, col });
      }, 1500);
    }
  });

  socket.on('request_obstacles', (room) => {
    if (gameRooms[room] && gameRooms[room].obstacles) {
      socket.emit('sync_obstacles', gameRooms[room].obstacles);
    }
  });

  // RPS WiFi Sync
  socket.on('rps_choice', (data) => {
    const { room, playerNumber, choice } = data;
    if (!gameRooms[room]) return;
    
    gameRooms[room].rps[`p${playerNumber}`] = choice;
    socket.to(room).emit('player_ready_sync', { playerNumber });

    if (gameRooms[room].rps.p1 && gameRooms[room].rps.p2) {
      io.to(room).emit('rps_duel_start', {
        p1: gameRooms[room].rps.p1,
        p2: gameRooms[room].rps.p2
      });
      gameRooms[room].rps = {}; // Limpiar para el siguiente duelo
    }
  });

  socket.on('player_move', (data) => {
    socket.to(data.room).emit('player_move_sync', data);
  });

  socket.on('dice_roll', (data) => {
    socket.to(data.room).emit('dice_roll_sync', data);
  });

  socket.on('player_hit', (data) => {
    socket.to(data.room).emit('player_hit_sync', data);
  });

  socket.on('play_again', (data) => {
    const { room, playerNumber } = data;
    if (!gameRooms[room]) return;
    
    if (!gameRooms[room].playAgain) {
      gameRooms[room].playAgain = {};
    }
    gameRooms[room].playAgain[`p${playerNumber}`] = true;

    // Notificar al otro que este jugador quiere revancha
    socket.to(room).emit('player_wants_rematch', { playerNumber });

    if (gameRooms[room].playAgain.p1 && gameRooms[room].playAgain.p2) {
      // Reiniciar sala
      gameRooms[room].playAgain = {};
      gameRooms[room].rps = {};
      gameRooms[room].obstacles = generateLevelObstacles();
      
      io.to(room).emit('restart_game_sync', {
        obstacles: gameRooms[room].obstacles
      });

      // Reiniciar intervalo de proyectiles
      if (gameRooms[room].projectileInterval) {
        clearInterval(gameRooms[room].projectileInterval);
      }
      gameRooms[room].projectileInterval = setInterval(() => {
        const col = Math.floor(Math.random() * 18);
        const id = `carrot-${Date.now()}-${Math.random()}`;
        io.to(room).emit('spawn_projectile_sync', { id, col });
      }, 1500);
    }
  });

  socket.on('exit_game', (data) => {
    const { room } = data;
    socket.to(room).emit('partner_left');
    socket.leave(room);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('partner_left');
        
        // Limpiar info del jugador en la sala
        if (gameRooms[room] && gameRooms[room].players) {
           if (gameRooms[room].players.p1?.socketId === socket.id) {
             delete gameRooms[room].players.p1;
           } else if (gameRooms[room].players.p2?.socketId === socket.id) {
             delete gameRooms[room].players.p2;
           }
           io.to(room).emit('room_players_sync', {
             p1: gameRooms[room].players.p1,
             p2: gameRooms[room].players.p2
           });
        }
      }
      const size = io.sockets.adapter.rooms.get(room)?.size;
      if (size && size <= 1 && gameRooms[room]?.projectileInterval) {
        clearInterval(gameRooms[room].projectileInterval);
        gameRooms[room].projectileInterval = null;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
