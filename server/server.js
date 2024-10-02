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
let tossCounter = 0;
let timer;

function endGame() {
    let list = []
    for (let playerSocket of playersSockets) {
        playerSocket.socket.emit("score", playerSocket.score)
        list.push({
            name: playerSocket.name,
            score: playerSocket.score,
        })
    }
    list.sort(compareFn)
    io.to("playersRoom").emit("results", list)
    setTimeout(() => {
        for (let playersSocket of playersSockets) {
            playersSocket.socket.disconnect()
        }
        playersSockets = []
        turn = 0
    }, 10000)
}

function startTimer() {
    let remainingTime = 10
    timer = setInterval(() => {
        io.to("playersRoom").emit("timeLeft", remainingTime)
        remainingTime--;
        if (remainingTime === 0) {
            clearInterval(timer)
            processToss()
        }
    }, 1000)
}

function openConnections() {
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
    clearInterval(timer)
    let toss = Math.round(Math.random());
    for (let playerSocket of playersSockets) {
        if (playerSocket.toss && playerSocket.bet) {
            if (parseInt(playerSocket.toss) === toss) {
                playerSocket.score += 10;
                playerSocket.score += parseInt(playerSocket.bet);
            } else {
                playerSocket.score -= playerSocket.bet;
            }
            delete playerSocket.bet;
            delete playerSocket.toss;
        }
    }
    sendPlayersListAndScore();
    tossCounter = 0;
    turn++;
    if (turn === 3) endGame()
    else startTimer()
}

function compareFn(a, b) {
    return b.score - a.score;
}


function sendPlayersListAndScore() {
    let list = []
    for (let playerSocket of playersSockets) {
        playerSocket.socket.emit("score", playerSocket.score)
        list.push({
            name: playerSocket.name,
            score: playerSocket.score,
        })
    }
    list.sort(compareFn)
    io.to("playersRoom").emit("players", list)
}

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    if (playersSockets.length < 3){
        socket.join("playersRoom")
        socket.on("changeName", (name)=> {
            console.log("Nb players : " + playersSockets.length)
            let playerName = name ? name : "Player " + (playersSockets.length + 1)
            playersSockets.push({
                socket: socket,
                name: playerName,
                score: 100
            })
            sendPlayersListAndScore()
            if (playersSockets.length === 3){
                openConnections()
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
            io.to("playersRoom").emit("message", {
                emitter: message.name,
                content: message.text
            })
        })
    } else {
        socket.emit("connectionRefused")
    }
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
