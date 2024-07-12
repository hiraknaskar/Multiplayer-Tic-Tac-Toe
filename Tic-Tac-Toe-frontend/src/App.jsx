import React, { useEffect, useState } from "react";
import "./App.css";
import Square from "./Square/Square"; // Ensure correct path
import { io } from "socket.io-client";
import Swal from "sweetalert2";

const renderform = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const App = () => {
  const [gameState, setgameState] = useState(renderform);
  const [currentPlayer, setcurrentPlayer] = useState("cross");
  const [finishgame, setfinishgame] = useState(false);
  const [finishedArrayState, setfinishedArrayState] = useState([]);
  const [platonline, setplatonline] = useState(false);
  const [socket, setsocket] = useState(null);
  const [playerName, setplayerName] = useState("");
  const [opponentName, setopponentName] = useState(null);
  const [playingAs, setplayingAs] = useState(null);

  const checkWiner = () => {
    // Your existing winner check logic
  };

  useEffect(() => {
    const winner = checkWiner();
    if (winner) {
      setfinishgame(winner);
    }
  }, [gameState]);

  useEffect(() => {
    if (socket) {
      socket.on("playerMoveFromServer", (data) => {
        const id = data.state.id;
        setgameState((prevState) => {
          let newState = [...prevState];
          const rowIndex = Math.floor(id / 3);
          const colIndex = id % 3;
          newState[rowIndex][colIndex] = data.state.sign;
          return newState;
        });
        setcurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
      });

      socket.on("opponentLeftMatch", () => {
        alert("Opponent Left the Match");
        setfinishgame("opponentLeftMatch");
      });

      socket.on("connect", () => {
        setplatonline(true);
      });

      socket.on("opponentNotFound", () => {
        setopponentName(false);
      });

      socket.on("opponentFound", (data) => {
        setplayingAs(data.playingAs);
        setopponentName(data.opponentName);
      });
    }
  }, [socket]);

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });
    return result;
  };

  const platonlineClick = async () => {
    const result = await takePlayerName();
    if (!result.isConfirmed) {
      return;
    }

    const username = result.value;
    setplayerName(username);

    const newSocket = io("https://tic-tac-toe-multiplayer-278e.onrender.com", {
      autoConnect: true,
    });

    newSocket.emit("request_to_play", {
      playerName: username,
    });

    setsocket(newSocket);
  };

  if (!platonline) {
    return (
      <div className="main-div">
        <button onClick={platonlineClick} className="playonline">
          Play Online
        </button>
      </div>
    );
  }

  if (platonline && !opponentName) {
    return (
      <div className="waiting">
        <p>Waiting for Opponent...</p>
      </div>
    );
  }

  return (
    <>
      <div className="main-div">
        <div className="water heading">
          <div className="move-detection">
            <div
              className={`left ${
                currentPlayer === playingAs
                  ? "current-move-" + currentPlayer
                  : ""
              }`}
            >
              {playerName}
            </div>
            <div
              className={`right ${
                currentPlayer !== playingAs
                  ? "current-move-" + currentPlayer
                  : ""
              }`}
            >
              {opponentName}
            </div>
          </div>
          <h1>TIC-TAC-TOE</h1>

          <div className="Square-wrapper heading">
            {gameState.map((arr, rowIndex) =>
              arr.map((e, colIndex) => (
                <Square
                  socket={socket}
                  gameState={gameState}
                  finishedArrayState={finishedArrayState}
                  setgameState={setgameState}
                  currentPlayer={currentPlayer}
                  setcurrentPlayer={setcurrentPlayer}
                  finishgame={finishgame}
                  id={rowIndex * 3 + colIndex}
                  key={rowIndex * 3 + colIndex}
                  currentElement={e}
                  playingAs={playingAs}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <div className="upper-layer">
        {finishgame && finishgame !== 'opponentLeftMatch' && finishgame !== "draw" && (
          <h3 className="finisged-game">{finishgame === playingAs ? "You" : opponentName} won the game!</h3>
        )}
        {finishgame && finishgame !== 'opponentLeftMatch' && finishgame === "draw" && (
          <h3 className="finisged-game">It's a DRAW!</h3>
        )}
        {!finishgame && opponentName && (
          <h4 className="finisged-game">
            You are playing against {opponentName}
          </h4>
        )}
        {finishgame && finishgame === 'opponentLeftMatch' && (
          <h2>You won the match, Opponent has left</h2>
        )}
      </div>
    </>
  );
};

export default App;
