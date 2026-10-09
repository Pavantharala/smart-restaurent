import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useGaming } from "../../context/GamingContext";
import { useOrder } from "../../context/OrderContext";

import { singlePlayerGames } from "../../games/gameRegistry";

import {
  MemoryMatchGame,
  TargetTapGame,
} from "../../games/single-player";

import {
  GameHeader,
  GameTimer,
} from "../../games/shared";


export default function SinglePlayerGamePage() {

  // =======================================================
  // URL PARAMETERS
  // =======================================================

  const [searchParams] =
    useSearchParams();


  // =======================================================
  // GAMING CONTEXT
  // =======================================================

  const {
    getGamingSessionById,
    getGamingSessionByOrderId,
    getRemainingSeconds,
  } = useGaming();


  // =======================================================
  // ORDER CONTEXT
  // =======================================================

  const {
    getOrderById,
  } = useOrder();


  // =======================================================
  // READ URL PARAMETERS
  // =======================================================

  const sessionId =
    searchParams.get("session");

  const orderId =
    searchParams.get("order");

  const gameId =
    searchParams.get("game");


  // =======================================================
  // TIMER STATE
  // =======================================================
  //
  // null means the timer has not been initialized yet.
  //
  // This prevents a valid gaming session from briefly
  // appearing as expired while the page is loading.
  //
  // =======================================================

  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState<number | null>(null);


  // =======================================================
  // FIND GAMING SESSION
  // =======================================================

  const gamingSession =
    sessionId
      ? getGamingSessionById(sessionId)
      : orderId
        ? getGamingSessionByOrderId(orderId)
        : undefined;


  // =======================================================
  // FIND RELATED ORDER
  // =======================================================

  const order =
    gamingSession
      ? getOrderById(
          gamingSession.orderId,
        )
      : orderId
        ? getOrderById(orderId)
        : undefined;


  // =======================================================
  // FIND SELECTED GAME
  // =======================================================

  const selectedGame =
    singlePlayerGames.find(
      (game) =>
        game.id === gameId,
    );


  // =======================================================
  // GAMING TIMER
  // =======================================================

  useEffect(() => {

    if (!gamingSession) {

      setRemainingSeconds(null);

      return;
    }


    const updateTimer = () => {

      setRemainingSeconds(
        getRemainingSeconds(
          gamingSession,
        ),
      );
    };


    // Initialize immediately
    updateTimer();


    // Continue updating every second
    const interval =
      window.setInterval(
        updateTimer,
        1000,
      );


    return () => {

      window.clearInterval(
        interval,
      );

    };

  }, [
    gamingSession,
    getRemainingSeconds,
  ]);


  // =======================================================
  // GAMING SESSION NOT FOUND
  // =======================================================

  if (!gamingSession) {

    return (
      <main
        style={{
          padding: "24px",
        }}
      >
        <h1>
          Gaming Session Not Found
        </h1>

        <p>
          The gaming session could not be
          found or may no longer be available.
        </p>
      </main>
    );
  }


  // =======================================================
  // ORDER NOT FOUND
  // =======================================================

  if (!order) {

    return (
      <main
        style={{
          padding: "24px",
        }}
      >
        <h1>
          Order Not Found
        </h1>

        <p>
          The order connected to this
          gaming session could not be found.
        </p>
      </main>
    );
  }


  // =======================================================
  // SESSION / ORDER VALIDATION
  // =======================================================

  if (
    gamingSession.orderId !==
    order.id
  ) {

    return (
      <main
        style={{
          padding: "24px",
        }}
      >
        <h1>
          Invalid Gaming Session
        </h1>

        <p>
          This gaming session does not
          belong to the selected order.
        </p>
      </main>
    );
  }


  // =======================================================
  // ORDER TYPE VALIDATION
  // =======================================================

  if (
    order.type !== "dine-in" &&
    order.type !== "waiting-lounge"
  ) {

    return (
      <main
        style={{
          padding: "24px",
        }}
      >
        <h1>
          Gaming Not Available
        </h1>

        <p>
          Gaming is available only for
          dine-in and waiting-lounge orders.
        </p>
      </main>
    );
  }


  // =======================================================
  // GAME VALIDATION
  // =======================================================

  if (!selectedGame) {

    return (
      <main
        style={{
          padding: "24px",
        }}
      >
        <h1>
          Game Not Available
        </h1>

        <p>
          This single-player game could
          not be found in the game registry.
        </p>
      </main>
    );
  }


  // =======================================================
  // TIMER INITIALIZATION
  // =======================================================

  const timerInitialized =
    remainingSeconds !== null;


  // =======================================================
  // SESSION STATUS
  // =======================================================

  const isExpired =
    gamingSession.status === "expired" ||
    gamingSession.status === "cancelled" ||
    (
      timerInitialized &&
      remainingSeconds <= 0
    );


  const isClosing =
    gamingSession.status === "closing";


  const isPlayable =
    gamingSession.status === "active" &&
    timerInitialized &&
    remainingSeconds > 0;


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
      }}
    >

      {/* =================================================
          GAME HEADER
          ================================================= */}

      <GameHeader
        title={
          selectedGame.name
        }
        description={
          selectedGame.description
        }
        category="single-player"
      />


      {/* =================================================
          TIMER
          ================================================= */}

      <GameTimer
        remainingSeconds={
          remainingSeconds ?? 0
        }
      />


      {/* =================================================
          TIMER LOADING
          ================================================= */}

      {!timerInitialized && (
        <section
          style={{
            marginTop: "20px",
          }}
        >
          <p>
            Loading gaming timer...
          </p>
        </section>
      )}


      {/* =================================================
          EXPIRED / CANCELLED
          ================================================= */}

      {timerInitialized &&
        isExpired && (

        <section
          style={{
            marginTop: "24px",
          }}
        >
          <h2>
            Gaming Session Ended
          </h2>

          <p>
            Your gaming session has ended.
          </p>
        </section>
      )}


      {/* =================================================
          CLOSING PERIOD
          ================================================= */}

      {timerInitialized &&
        !isExpired &&
        isClosing && (

        <section
          style={{
            marginTop: "24px",
          }}
        >
          <h2>
            Final Countdown
          </h2>

          <p>
            Your gaming session is in
            its final closing period.
          </p>

          <p>
            New gameplay cannot be started
            during the closing period.
          </p>


          {/* ---------------------------------------------
              CURRENT GAME
              --------------------------------------------- */}

          {selectedGame.id ===
            "target-tap" && (

            <TargetTapGame
              isPlayable={false}
            />
          )}


          {selectedGame.id ===
            "memory-match" && (

            <MemoryMatchGame
              isPlayable={false}
            />
          )}

        </section>
      )}


      {/* =================================================
          ACTIVE GAME
          ================================================= */}

      {timerInitialized &&
        !isExpired &&
        !isClosing && (

        <section
          style={{
            marginTop: "24px",
          }}
        >

          {/* ---------------------------------------------
              TARGET TAP
              --------------------------------------------- */}

          {selectedGame.id ===
            "target-tap" && (

            <TargetTapGame
              isPlayable={isPlayable}
            />
          )}


          {/* ---------------------------------------------
              MEMORY MATCH
              --------------------------------------------- */}

          {selectedGame.id ===
            "memory-match" && (

            <MemoryMatchGame
              isPlayable={isPlayable}
            />
          )}

        </section>
      )}

    </main>
  );
}