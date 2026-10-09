import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGaming } from "../../context/GamingContext";
import { useOrder } from "../../context/OrderContext";
import { multiplayerGames } from "../../games/gameRegistry";
import { ReactionBattleGame, TicTacToeGame } from "../../games/multiplayer";
import { GameHeader, GameTimer } from "../../games/shared";


export default function MultiplayerGamePage() {
  const [searchParams] = useSearchParams();

  const {
    getGamingSessionById,
    getGamingSessionByOrderId,
    getRemainingSeconds,
  } = useGaming();

  const { getOrderById } = useOrder();

  const sessionId = searchParams.get("session");
  const orderId = searchParams.get("order");
  const gameId = searchParams.get("game");

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const gamingSession = sessionId
    ? getGamingSessionById(sessionId)
    : orderId
      ? getGamingSessionByOrderId(orderId)
      : undefined;

  const order = gamingSession
    ? getOrderById(gamingSession.orderId)
    : orderId
      ? getOrderById(orderId)
      : undefined;

  const selectedGame = multiplayerGames.find(
    (game) => game.id === gameId,
  );

  useEffect(() => {
    if (!gamingSession) {
      return;
    }

    const updateTimer = () => {
      setRemainingSeconds(getRemainingSeconds(gamingSession));
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [gamingSession, getRemainingSeconds]);

  if (!gamingSession) {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Gaming Session Not Found</h1>

        <p>
          The gaming session could not be found or may no longer be available.
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Order Not Found</h1>

        <p>
          The order connected to this gaming session could not be found.
        </p>
      </main>
    );
  }

  if (gamingSession.orderId !== order.id) {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Invalid Gaming Session</h1>

        <p>
          This gaming session does not belong to the selected order.
        </p>
      </main>
    );
  }

  if (
    order.type !== "dine-in" &&
    order.type !== "waiting-lounge"
  ) {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Gaming Not Available</h1>

        <p>
          Gaming is available only for dine-in and waiting-lounge orders.
        </p>
      </main>
    );
  }

  if (!selectedGame) {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Game Not Available</h1>

        <p>
          This multiplayer game could not be found in the game registry.
        </p>
      </main>
    );
  }

  const isExpired =
    gamingSession.status === "expired" ||
    gamingSession.status === "cancelled" ||
    remainingSeconds <= 0;

  const isClosing = gamingSession.status === "closing";

  const isPlayable =
    gamingSession.status === "active" &&
    remainingSeconds > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <GameHeader
        title={selectedGame.name}
        description={selectedGame.description}
        category="multiplayer"
      />

      <GameTimer remainingSeconds={remainingSeconds} />

      {isExpired ? (
        <section style={{ marginTop: "24px" }}>
          <h2>Gaming Session Ended</h2>

          <p>
            Your gaming session has ended.
          </p>
        </section>
      ) : isClosing ? (
        <section style={{ marginTop: "24px" }}>
          <h2>Final Countdown</h2>

          <p>
            Your gaming session is in its final closing period.
          </p>

          <p>
            You can finish your current game, but new gameplay should not be
            started.
          </p>

          <ReactionBattleGame isPlayable={false} />
        </section>
      ) : (
        <section style={{ marginTop: "24px" }}>
          {selectedGame.id === "reaction-battle" && (
            <ReactionBattleGame isPlayable={isPlayable} />
          )}

          {selectedGame.id === "tic-tac-toe" && (
            <TicTacToeGame isPlayable={isPlayable}
            />
          )}
        </section>
      )}
    </main>
  );
}