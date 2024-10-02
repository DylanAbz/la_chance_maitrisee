import { Server } from 'socket.io';
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:63342', 'http://localhost'],
    }
});

let playersSockets = []
let turn = 0;

function startTurn() {
    if (turn < 3) {
        openConnections()
        turn++
    } else {
        endGame()
    }
}

function endGame() {
    for (let playersSocket of playersSockets) {
        playersSocket.socket.disconnect()
    }
    playersSockets = []
    turn = 0
}

function openConnections() {
    let tossCounter = 0
    for (let playerSocket of playersSockets) {
        playerSocket.socket.on("bet", (data) => {
            if (playerSocket.toss === undefined){
                playerSocket["bet"] = data.bet
                playerSocket["toss"] = data.toss
                tossCounter++
                if (tossCounter === 3) processToss()
            }
        })
    }
}

function processToss(){
    let toss = Math.round(Math.random())
    for (let playerSocket of playersSockets) {
        if (playerSocket.toss === toss) {
            playerSocket.score += 10
            playerSocket.score += playerSocket.bet
        }else {
            playerSocket.score -= playerSocket.bet
        }
        delete playerSocket.bet
        delete playerSocket.toss
    }
}

function sendPlayersListAndScore() {
    let list = []
    for (let playerSocket of playersSockets) {
        list.push({
            name: playerSocket.name,
            score: playerSocket.score,
        })
    }
    io.to("playersRoom").emit("players", list)
}

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    if (playersSockets.length < 3){
        socket.join("playersRoom")
        socket.on("changeName", (name)=> {
            let playerName = name ? name : "Player " + (playersSockets.length + 1)
            playersSockets.push({
                socket: socket,
                name: playerName,
                score: 100
            })
            sendPlayersListAndScore()
            if (playersSockets.length === 3){
                startTurn()
            }
        })
        socket.on('disconnect', () => {
            let newPlayers = []
            for (let playersSocket of playersSockets) {
                if (playersSocket.socket.id !== socket.id){
                    newPlayers.push(playersSocket)
                }else {
                    console.log('user disconnected : ' + playersSocket.name);
                }
            }
            playersSockets = newPlayers
        });
        socket.on('message', (message) => {
            socket.broadcast.emit("message", {
                emitter: playerName,
                content: message
            })
        })
    } else {
        socket.emit("connectionRefused")
    }
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
