import React, { useEffect, useState } from "react";
import "./App.css";
import Squere from "./Square/Squere";
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
    // Check rows
    for (let row = 0; row < gameState.length; row++) {
      if (
        gameState[row][0] !== "" && // Ensure the cell is not empty
        gameState[row][0] === gameState[row][1] &&
        gameState[row][1] === gameState[row][2]
      ) {
        setfinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }

    // Check columns
    for (let col = 0; col < gameState.length; col++) {
      if (
        gameState[0][col] !== "" && // Ensure the cell is not empty
        gameState[0][col] === gameState[1][col] &&
        gameState[1][col] === gameState[2][col]
      ) {
        setfinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col];
      }
    }

    // Check main diagonal
    if (
      gameState[0][0] !== "" && // Ensure the cell is not empty
      gameState[0][0] === gameState[1][1] &&
      gameState[1][1] === gameState[2][2]
    ) {
      setfinishedArrayState([0, 4, 8]);
      return gameState[0][0];
    }

    // Check anti-diagonal
    if (
      gameState[0][2] !== "" && // Ensure the cell is not empty
      gameState[0][2] === gameState[1][1] &&
      gameState[1][1] === gameState[2][0]
    ) {
      setfinishedArrayState([2, 4, 6]);
      return gameState[0][2];
    }

    const isDraw = gameState.flat().every((e) => {
      if (e === "circle" || e === "cross") return true;
    });

    if (isDraw) return "draw";

    // No winner found
    return null;
  };

  useEffect(() => {
    const winner = checkWiner();
    if (winner) {
      setfinishgame(winner);
    } 
  }, [gameState]);

  socket?.on("playerMoveFromServer",(data)=>{
    // setcurrentPlayer(data.state.currentPlayer);
    const id= data.state.id;
    setgameState((prevState)=>{
      let newState = [...prevState];
        const rowIndex = Math.floor(id / 3);
        const colIndex = id % 3;
        newState[rowIndex][colIndex] = data.state.sign;
        console.log(finishedArrayState);
        return newState;
    });
    setcurrentPlayer(data.state.sign==="circle"?"cross":"circle");
  });
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

  socket?.on("opponentLeftMatch", () => {
    alert(opponentName+ "Left the Match")
    setFinishetState("opponentLeftMatch");
  });

  socket?.on("connect", function () {
    setplatonline(true);
  });
  socket?.on("opponentNotFound", function () {
    setopponentName(false);
  });
  socket?.on("opponentFound", function (data) {
    setplayingAs(data.playingAs);
    setopponentName(data.opponentName);
  });

  async function platonlineClick() {
    const result = await takePlayerName();
    if (!result.isConfirmed) {
      return;
    }

    const username = result.value;
    setplayerName(username);

    const newsocket = io("http://localhost:3000", {
      autoConnuct: true,
    });

    newsocket?.emit("request_to_play", {
      playerName: username,
    });

    setsocket(newsocket);
  }

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
              arr.map((e, colIndex) => {
                return (
                  <Squere
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
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className="upper-layer">
        {finishgame && finishgame!=='opponentLeftMatch' && finishgame!== "draw" && (
          <h3 className="finisged-game">{finishgame===playingAs?"you":opponentName} won the game!</h3>
        )}
        {finishgame&& finishgame!=='opponentLeftMatch' && finishgame === "draw" && (
          <h3 className="finisged-game">It's a DRAW!</h3>
        )}
        {!finishgame && opponentName && (
          <h4 className="finisged-game">
            You are playing against {opponentName}
          </h4>
        )}
        {finishgame && finishgame === "opponentLeftMatch" && (
        <h2>You won the match, Opponent has left</h2>
      )}
      </div>
    </>
  );
};

export default App;
