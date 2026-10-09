import { useState } from "react";

type Player = "X" | "O";

type Board = Array<Player | null>;

type TicTacToeGameProps = {
  isPlayable: boolean;
};

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

function getWinner(board: Board): Player | null {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;

    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }

  return null;
}

export default function TicTacToeGame({
  isPlayable,
}: TicTacToeGameProps) {

  const [board, setBoard] = useState<Board>(
    () => createEmptyBoard(),
  );

  const [currentPlayer, setCurrentPlayer] =
    useState<Player>("X");

  const [winner, setWinner] =
    useState<Player | null>(null);

  const [draw, setDraw] =
    useState(false);

  const [scores, setScores] = useState({
    X: 0,
    O: 0,
  });


  function handleCellClick(index: number) {

    if (!isPlayable) {
      return;
    }

    if (board[index]) {
      return;
    }

    if (winner || draw) {
      return;
    }

    const updatedBoard = [
      ...board,
    ];

    updatedBoard[index] =
      currentPlayer;

    setBoard(updatedBoard);


    // -----------------------------------------------------
    // CHECK WINNER
    // -----------------------------------------------------

    const roundWinner =
      getWinner(updatedBoard);

    if (roundWinner) {

      setWinner(roundWinner);

      setScores(
        (currentScores) => ({
          ...currentScores,

          [roundWinner]:
            currentScores[roundWinner] + 1,
        }),
      );

      return;
    }


    // -----------------------------------------------------
    // CHECK DRAW
    // -----------------------------------------------------

    const isDraw =
      updatedBoard.every(
        (cell) => cell !== null,
      );

    if (isDraw) {

      setDraw(true);

      return;
    }


    // -----------------------------------------------------
    // CHANGE TURN
    // -----------------------------------------------------

    setCurrentPlayer(
      currentPlayer === "X"
        ? "O"
        : "X",
    );
  }


  function startNewRound() {

    setBoard(
      createEmptyBoard(),
    );

    setCurrentPlayer("X");

    setWinner(null);

    setDraw(false);
  }


  function resetScores() {

    setScores({
      X: 0,
      O: 0,
    });

    startNewRound();
  }


  return (
    <section>

      {/* =================================================
          GAME TITLE
          ================================================= */}

      <div
        style={{
          marginBottom: "20px",
        }}
      >

        <h2>
          Tic-Tac-Toe
        </h2>

        <p>
          Player X and Player O take turns.
        </p>

      </div>


      {/* =================================================
          SCORE
          ================================================= */}

      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >

        <strong>
          Player X: {scores.X}
        </strong>

        <strong>
          Player O: {scores.O}
        </strong>

      </div>


      {/* =================================================
          GAME STATUS
          ================================================= */}

      <div
        style={{
          marginBottom: "20px",
        }}
      >

        {winner && (
          <h3>
            🎉 Player {winner} wins!
          </h3>
        )}

        {!winner && draw && (
          <h3>
            🤝 It's a draw!
          </h3>
        )}

        {!winner && !draw && isPlayable && (
          <h3>
            Player {currentPlayer}'s turn
          </h3>
        )}

        {!isPlayable && !winner && !draw && (
          <h3>
            Game unavailable
          </h3>
        )}

      </div>


      {/* =================================================
          BOARD
          ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 90px)",
          gap: "8px",
          marginBottom: "24px",
        }}
      >

        {board.map(
          (cell, index) => (

            <button
              key={index}
              type="button"
              onClick={() =>
                handleCellClick(index)
              }
              disabled={
                !isPlayable ||
                Boolean(cell) ||
                Boolean(winner) ||
                draw
              }
              style={{
                width: "90px",
                height: "90px",
                fontSize: "36px",
                fontWeight: 700,
                cursor:
                  isPlayable &&
                  !cell &&
                  !winner &&
                  !draw
                    ? "pointer"
                    : "default",
              }}
            >
              {cell}
            </button>

          ),
        )}

      </div>


      {/* =================================================
          CONTROLS
          ================================================= */}

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >

        <button
          type="button"
          onClick={startNewRound}
          disabled={!isPlayable}
          style={{
            padding: "10px 16px",
            cursor:
              isPlayable
                ? "pointer"
                : "not-allowed",
          }}
        >
          New Round
        </button>


        <button
          type="button"
          onClick={resetScores}
          disabled={!isPlayable}
          style={{
            padding: "10px 16px",
            cursor:
              isPlayable
                ? "pointer"
                : "not-allowed",
          }}
        >
          Reset Scores
        </button>

      </div>

    </section>
  );
}