const { log } = require("console");
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  path:'/socket',
 
  transports: ['websocket','polling'],
  cors:{
    origin:'*',
  },
  allowEIO3:true,
});
const allUser = {};
const allRooms = [];

io.on("connection", (socket) => {
  allUser[socket.id] = {
    socket: socket,
    online: true,
    playing: false,
    gameFinished: false,
  };

  socket.on("request_to_play", (data) => {
    const currentUser = allUser[socket.id];
    currentUser.playerName = data.playerName;

    let opponentPlayer;

    for (const key in allUser) {
      const user = allUser[key];
      if (user.online && !user.playing && !user.gameFinished && socket.id !== key) {
        opponentPlayer = user;
        break;
      }
    }

    if (opponentPlayer) {
      allRooms.push({
        player1: opponentPlayer,
        player2: currentUser,
      });

      opponentPlayer.playing = true;
      currentUser.playing = true;

      opponentPlayer.socket.emit("opponentFound", {
        opponentName: currentUser.playerName,
        playingAs: "cross",
      });
      currentUser.socket.emit("opponentFound", {
        opponentName: opponentPlayer.playerName,
        playingAs: "circle",
      });

      const handlePlayerMove = (data) => {
        if (data.state.finished) {
          opponentPlayer.gameFinished = true;
          currentUser.gameFinished = true;
        }
        opponentPlayer.socket.emit("playerMoveFromServer", { ...data });
        currentUser.socket.emit("playerMoveFromServer", { ...data });
      };

      currentUser.socket.on("playerMoveFromClient", handlePlayerMove);
      opponentPlayer.socket.on("playerMoveFromClient", handlePlayerMove);
    } else {
      currentUser.socket.emit("opponentNotFound");
    }
  });

  socket.on("disconnect", function () {
    const currentUser = allUser[socket.id];
    currentUser.online = false;

    for (let index = 0; index < allRooms.length; index++) {
      const { player1, player2 } = allRooms[index];

      if (player1.socket.id === socket.id) {
        player2.socket.emit("opponentLeftMatch");
        player2.playing = false;
        player2.gameFinished = false;
        allRooms.splice(index, 1);
        break;
      }

      if (player2.socket.id === socket.id) {
        player1.socket.emit("opponentLeftMatch");
        player1.playing = false;
        player1.gameFinished = false;
        allRooms.splice(index, 1);
        break;
      }
    }
  });
});

httpServer.listen(3000);