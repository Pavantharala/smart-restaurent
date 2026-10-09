// =========================================================
// SMART CAFE - CUSTOMER GAMING PAGE
// =========================================================
//
// This page is responsible for:
// - Finding the customer's gaming session.
// - Showing available game categories.
// - Sending the selected game to the correct game page.
//
// Individual games are NOT implemented here.
//
// Game definitions come from:
// src/games/gameRegistry.ts
//
// =========================================================

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  useGaming,
} from "../../context/GamingContext";

import {
  useOrder,
} from "../../context/OrderContext";

import {
  singlePlayerGames,
  multiplayerGames,
} from "../../games/gameRegistry";

// =========================================================
// COMPONENT
// =========================================================

export default function GamingPage() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const {
    getGamingSessionById,
    getGamingSessionByOrderId,
    getRemainingSeconds,
  } = useGaming();

  const {
    getOrderById,
  } = useOrder();

  // =========================================================
  // URL PARAMETERS
  // =========================================================

  const orderId =
    searchParams.get("order");

  const sessionId =
    searchParams.get("session");

  // =========================================================
  // FIND SESSION
  // =========================================================

  const gamingSession =
    sessionId
      ? getGamingSessionById(sessionId)
      : orderId
        ? getGamingSessionByOrderId(orderId)
        : undefined;

  // =========================================================
  // FIND ORDER
  // =========================================================

  const order =
    gamingSession
      ? getOrderById(gamingSession.orderId)
      : undefined;

  // =========================================================
  // PAGE STATE
  // =========================================================

  const [remainingSeconds, setRemainingSeconds] =
    useState(0);

  const [error, setError] =
    useState<string | null>(null);

  // =========================================================
  // VALIDATION
  // =========================================================

  useEffect(() => {
    if (!gamingSession) {
      setError(
        "No active gaming session was found."
      );

      return;
    }

    if (!order) {
      setError(
        "The order connected to this gaming session was not found."
      );

      return;
    }

    if (
      gamingSession.orderId !== order.id
    ) {
      setError(
        "Invalid gaming session and order relationship."
      );

      return;
    }

    if (
      order.type !== "dine-in" &&
      order.type !== "waiting-lounge"
    ) {
      setError(
        "Gaming is not available for this order."
      );

      return;
    }

    if (
      gamingSession.status === "cancelled"
    ) {
      setError(
        "This gaming session has been cancelled."
      );

      return;
    }

    setError(null);
  }, [
    gamingSession,
    order,
  ]);

  // =========================================================
  // TIMER
  // =========================================================

  useEffect(() => {
    if (!gamingSession) {
      return;
    }

    const updateTimer = () => {
      const seconds =
        getRemainingSeconds(
          gamingSession
        );

      setRemainingSeconds(
        Math.max(0, seconds)
      );
    };

    updateTimer();

    const timer =
      window.setInterval(
        updateTimer,
        1000
      );

    return () => {
      window.clearInterval(timer);
    };
  }, [
    gamingSession,
    getRemainingSeconds,
  ]);

  // =========================================================
  // TIMER FORMAT
  // =========================================================

  const minutes =
    Math.floor(
      remainingSeconds / 60
    );

  const seconds =
    remainingSeconds % 60;

  const formattedTime =
    `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "32px",
            borderRadius: "16px",
            background: "#fff",
            border: "1px solid #ddd",
            textAlign: "center",
          }}
        >
          <h1>
            Gaming Unavailable
          </h1>

          <p
            style={{
              marginTop: "12px",
              color: "#666",
            }}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            style={{
              marginTop: "20px",
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // SAFETY
  // =========================================================

  if (!gamingSession || !order) {
    return null;
  }

  // =========================================================
  // SESSION STATES
  // =========================================================

  const isClosing =
    gamingSession.status === "closing";

  const isExpired =
    gamingSession.status === "expired";

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* ===================================================
            HEADER
            =================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
              }}
            >
              Smart Cafe Gaming
            </h1>

            <p
              style={{
                marginTop: "8px",
                color: "#666",
              }}
            >
              Choose a game and enjoy your session.
            </p>
          </div>

          {/* TIMER */}

          <div
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              background: isClosing
                ? "#fff3cd"
                : "#111",
              color: isClosing
                ? "#856404"
                : "#fff",
              fontWeight: 700,
              fontSize: "20px",
            }}
          >
            {isExpired
              ? "Ended"
              : isClosing
                ? `Closing: ${formattedTime}`
                : `Time: ${formattedTime}`}
          </div>
        </div>

        {/* ===================================================
            CLOSING MESSAGE
            =================================================== */}

        {isClosing && (
          <div
            style={{
              marginBottom: "24px",
              padding: "16px",
              borderRadius: "12px",
              background: "#fff3cd",
              border: "1px solid #ffe69c",
              textAlign: "center",
            }}
          >
            <strong>
              Final gaming countdown
            </strong>

            <p
              style={{
                margin: "6px 0 0",
              }}
            >
              Your session is ending soon.
              New games cannot be started.
            </p>
          </div>
        )}

        {/* ===================================================
            SINGLE PLAYER
            =================================================== */}

        <section>
          <h2>
            Single Player
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {singlePlayerGames.map(
              (game) => (
                <div
                  key={game.id}
                  style={{
                    padding: "22px",
                    borderRadius: "16px",
                    background: "#fff",
                    border: "1px solid #ddd",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    {game.name}
                  </h3>

                  <p
                    style={{
                      marginTop: "10px",
                      color: "#666",
                    }}
                  >
                    {game.description}
                  </p>

                  <button
                    type="button"
                    disabled={
                      isClosing ||
                      isExpired ||
                      remainingSeconds <= 0
                    }
                    onClick={() =>
                      navigate(
                        `/games/single?session=${encodeURIComponent(
                          gamingSession.id
                        )}&game=${encodeURIComponent(
                          game.id
                        )}`
                      )
                    }
                    style={{
                      marginTop: "16px",
                      width: "100%",
                      padding: "11px",
                      borderRadius: "8px",
                      border: "none",
                      cursor:
                        isClosing ||
                        isExpired ||
                        remainingSeconds <= 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Play
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        {/* ===================================================
            MULTIPLAYER
            =================================================== */}

        <section
          style={{
            marginTop: "36px",
          }}
        >
          <h2>
            Multiplayer
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {multiplayerGames.length === 0 ? (
              <div
                style={{
                  padding: "22px",
                  borderRadius: "16px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  color: "#666",
                }}
              >
                Multiplayer games are coming soon.
              </div>
            ) : (
              multiplayerGames.map(
                (game) => (
                  <div
                    key={game.id}
                    style={{
                      padding: "22px",
                      borderRadius: "16px",
                      background: "#fff",
                      border: "1px solid #ddd",
                    }}
                  >
                    <h3>
                      {game.name}
                    </h3>

                    <p
                      style={{
                        color: "#666",
                      }}
                    >
                      {game.description}
                    </p>

                    <button
                      type="button"
                      disabled={
                        isClosing ||
                        isExpired ||
                        remainingSeconds <= 0
                      }
                      onClick={() =>
                        navigate(
                          `/games/multiplayer?session=${encodeURIComponent(
                            gamingSession.id
                          )}&game=${encodeURIComponent(
                            game.id
                          )}`
                        )
                      }
                      style={{
                        marginTop: "12px",
                        width: "100%",
                        padding: "11px",
                        borderRadius: "8px",
                        border: "none",
                        cursor:
                          isClosing ||
                          isExpired ||
                          remainingSeconds <= 0
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Play
                    </button>
                  </div>
                )
              )
            )}
          </div>
        </section>

        {/* ===================================================
            EXIT
            =================================================== */}

        <div
          style={{
            marginTop: "32px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Exit Gaming
          </button>
        </div>
      </div>
    </div>
  );
}