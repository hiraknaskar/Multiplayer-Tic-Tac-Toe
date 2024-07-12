const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const port = process.env.PORT || 3000; // Use environment variable or fallback to 3000
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5174", // Ensure CORS settings are correct
    methods: ["GET", "POST"]
  }
});

const allUsers = {};
const allRooms = [];

io.on("connection", (socket) => {
  allUsers[socket.id] = {
    socket: socket,
    online: true,
    playing: false,
    gameFinished: false,
  };

  socket.on("request_to_play", (data) => {
    const currentUser = allUsers[socket.id];
    currentUser.playerName = data.playerName;

    let opponentPlayer;

    for (const key in allUsers) {
      const user = allUsers[key];
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
    const currentUser = allUsers[socket.id];
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

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
