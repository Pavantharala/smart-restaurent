import { useEffect, useState } from "react";

type ReactionBattleGameProps = {
  isPlayable: boolean;
};

type Player = {
  name: string;
  score: number;
  ready: boolean;
};

type RoundState =
  | "waiting"
  | "countdown"
  | "active"
  | "finished";

export default function ReactionBattleGame({
  isPlayable,
}: ReactionBattleGameProps) {
  const [players, setPlayers] = useState<Player[]>([
    {
      name: "Player 1",
      score: 0,
      ready: false,
    },
    {
      name: "Player 2",
      score: 0,
      ready: false,
    },
  ]);

  const [roundState, setRoundState] =
    useState<RoundState>("waiting");

  const [countdown, setCountdown] = useState(3);

  const [roundMessage, setRoundMessage] = useState(
    "Both players must be ready.",
  );

  const bothPlayersReady =
    players[0].ready && players[1].ready;

  /*
   * Round countdown.
   */
  useEffect(() => {
    if (roundState !== "countdown") {
      return;
    }

    if (countdown <= 0) {
      setRoundState("active");
      setRoundMessage("REACT NOW!");
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [roundState, countdown]);

  /*
   * Disable the game if the gaming session
   * is no longer playable.
   */
  useEffect(() => {
    if (!isPlayable) {
      setRoundState("waiting");
      setRoundMessage("Gaming session is not active.");
    }
  }, [isPlayable]);

  const toggleReady = (playerIndex: number) => {
    if (!isPlayable || roundState !== "waiting") {
      return;
    }

    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) =>
        index === playerIndex
          ? {
              ...player,
              ready: !player.ready,
            }
          : player,
      ),
    );
  };

  const startRound = () => {
    if (!isPlayable || !bothPlayersReady) {
      return;
    }

    setCountdown(3);
    setRoundState("countdown");
    setRoundMessage("Get ready...");
  };

  const handleReaction = (playerIndex: number) => {
    if (!isPlayable || roundState !== "active") {
      return;
    }

    setPlayers((currentPlayers) =>
      currentPlayers.map((player, index) =>
        index === playerIndex
          ? {
              ...player,
              score: player.score + 1,
            }
          : player,
      ),
    );

    setRoundState("finished");

    setRoundMessage(
      `${players[playerIndex].name} won this round!`,
    );
  };

  const resetGame = () => {
    setPlayers([
      {
        name: "Player 1",
        score: 0,
        ready: false,
      },
      {
        name: "Player 2",
        score: 0,
        ready: false,
      },
    ]);

    setCountdown(3);
    setRoundState("waiting");
    setRoundMessage("Both players must be ready.");
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      <h2>Reaction Battle</h2>

      <p>
        Two players compete to react first.
      </p>

      <div
        style={{
          textAlign: "center",
          margin: "24px 0",
          minHeight: "60px",
        }}
      >
        {roundState === "countdown" ? (
          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
            }}
          >
            {countdown}
          </div>
        ) : (
          <h3>{roundMessage}</h3>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {players.map((player, index) => (
          <div
            key={player.name}
            style={{
              border: "1px solid #ccc",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <h3>{player.name}</h3>

            <p>
              Score: <strong>{player.score}</strong>
            </p>

            <button
              type="button"
              onClick={() => toggleReady(index)}
              disabled={
                !isPlayable ||
                roundState !== "waiting"
              }
            >
              {player.ready ? "Ready ✓" : "Ready"}
            </button>

            <div style={{ marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => handleReaction(index)}
                disabled={
                  !isPlayable ||
                  roundState !== "active"
                }
                style={{
                  width: "100%",
                  minHeight: "80px",
                  fontSize: "20px",
                }}
              >
                REACT!
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "24px",
          textAlign: "center",
        }}
      >
        <button
          type="button"
          onClick={startRound}
          disabled={
            !isPlayable ||
            !bothPlayersReady ||
            roundState !== "waiting"
          }
        >
          Start Round
        </button>

        <button
          type="button"
          onClick={resetGame}
          style={{
            marginLeft: "10px",
          }}
        >
          Reset Game
        </button>
      </div>
    </div>
  );
}