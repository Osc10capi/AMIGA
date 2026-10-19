const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir los archivos estáticos (index.html, etc.) desde la carpeta actual
app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado:', socket.id);

    socket.on('joinGame', (playerData) => {
        players[socket.id] = {
            id: socket.id,
            name: playerData.name,
            role: playerData.role,
            skin: playerData.skin || 'skin1',
            x: 100,
            y: 100,
            direction: 1,
            isWalking: false,
            isCrouched: false,
            chatMessage: "",
            chatTimer: 0
        };
        io.emit('currentPlayers', players);
    });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].direction = movementData.direction;
            players[socket.id].isWalking = movementData.isWalking;
            players[socket.id].isCrouched = movementData.isCrouched;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('chatMessage', (msg) => {
        if (players[socket.id]) {
            players[socket.id].chatMessage = msg;
            players[socket.id].chatTimer = 300;
            io.emit('playerChat', { id: socket.id, message: msg });
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        delete players[socket.id];
        io.emit('removePlayer', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
