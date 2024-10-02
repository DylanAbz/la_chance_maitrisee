import { Server } from 'socket.io';
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:63342",
    }
});

let playersInfos = []
let turn = 0;
let tossCounter = 0;
let timer;
let waitingRoomQueue = [];
let roomsState = [{
    name: "room1",
    state: "INACTIVE",
    timer: null
},{
    name: "room2",
    state: "INACTIVE",
    timer: null
},{
    name: "room3",
    state: "INACTIVE",
    timer: null
},{
    name: "room4",
    state: "INACTIVE",
    timer: null
},{
    name: "room5",
    state: "INACTIVE",
    timer: null
}]

function endGame() {
    let list = []
    for (let playerSocket of playersInfos) {
        playerSocket.socket.emit("score", playerSocket.score)
        list.push({
            name: playerSocket.name,
            score: playerSocket.score,
        })
    }
    list.sort(compareFn)
    io.to("playersRoom").emit("results", list)
    setTimeout(() => {
        for (let playersSocket of playersInfos) {
            playersSocket.socket.disconnect()
        }
        playersInfos = []
        turn = 0
    }, 5000)
}

function startTimer(roomName) {
    let remainingTime = 30
    timer = setInterval(() => {
        io.to(roomName).emit("timeLeft", remainingTime)
        remainingTime--;
        if (remainingTime === -1) {
            clearInterval(timer)
            processToss(roomName)
        }
    }, 1000)
    for (let roomsStateElement of roomsState) {
        if (roomsStateElement.name === roomName){
            roomsStateElement.timer = timer
        }
    }
}

function getPlayersFromRoomName(roomName) {
    return playersInfos.filter((playerInfo) => {
        return playerInfo.room === roomName
    })
}

function openConnections(roomName) {
    io.to(roomName).emit("startGame")
    startTimer(roomName)
    let playersInRoom = getPlayersFromRoomName(roomName)
    for (let playerSocket of playersInRoom) {
        playerSocket.socket.on("bet", (data) => {
            if (playerSocket.toss === undefined){
                playerSocket["bet"] = data.bet
                playerSocket["toss"] = data.toss
                tossCounter++
                if (tossCounter === 3) processToss(roomName)
            }
        })
    }
}

function processToss(roomName){
    for (let roomsStateElement of roomsState) {
        if (roomsStateElement.name === roomName){
            clearInterval(roomsStateElement.timer)
        }
    }
    let toss = Math.round(Math.random());
    let playersInRoom = getPlayersFromRoomName(roomName)
    for (let playerSocket of playersInRoom) {
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
    sendPlayersListAndScore(roomName);
    tossCounter = 0;
    turn++;
    if (turn === 3) endGame(roomName)
    else startTimer(roomName)
}

function compareFn(a, b) {
    return b.score - a.score;
}


function sendPlayersListAndScore(roomName) {
    let playersInRoom = getPlayersFromRoomName(roomName)
    let list = []
    for (let playerSocket of playersInRoom) {
        playerSocket.socket.emit("score", playerSocket.score)
        list.push({
            name: playerSocket.name,
            score: playerSocket.score,
        })
    }
    list.sort(compareFn)
    io.to(roomName).emit("players", list)
}

function getPlayersInfosFromSocket(socket) {
    return playersInfos.find((playerInfo) => playerInfo.socket.id === socket.id)
}


function createNewRoom() {
    let roomName = findAvailableRoomName()
    if (roomName !== null) {
        for (let index = 0; index < 3; index++) {
            let playerInfo = getPlayersInfosFromSocket(waitingRoomQueue.shift())
            playerInfo.room = roomName
            playerInfo.socket.leave("waitingRoom")
            playerInfo.socket.join(roomName)
        }
        openConnections(roomName)
    } else{
        setTimeout(createNewRoom, 2000)
    }
}


function findAvailableRoomName() {
    for (let roomsStateElement of roomsState) {
        if (roomsStateElement.state === "INACTIVE") return roomsStateElement.name
    }
    return null;
}

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    socket.on("changeName", (name)=> {
        console.log("Nb players : " + playersInfos.length)
        let playerName = name ? name : "Player " + (playersInfos.length + 1)
        playersInfos.push({
            socket: socket,
            name: playerName,
            score: 100,
            room: "waitingRoom"
        })
        socket.join("waitingRoom")
        socket.on('joinGame', () => {
            waitingRoomQueue.push(socket.id)
            if (waitingRoomQueue.length === 3){
                createNewRoom()
            }
        })
    })
    socket.on('disconnect', () => {
        let newPlayers = []
        for (let playersSocket of playersInfos) {
            if (playersSocket.socket.id !== socket.id){
                newPlayers.push(playersSocket)
            }else {
                console.log('user disconnected : ' + playersSocket.name);
            }
        }
        playersInfos = newPlayers
    });
    socket.on('message', (message) => {
        console.log(getPlayersInfosFromSocket(socket).room)
        io.to(getPlayersInfosFromSocket(socket).room.toString()).emit("message", {
            emitter: message.name,
            content: message.text
        })
    })
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
