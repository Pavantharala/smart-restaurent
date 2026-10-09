// =========================================================
// SMART CAFE - TARGET TAP GAME
// =========================================================
//
// This file contains ONLY the game itself.
//
// It does NOT:
// - create gaming sessions
// - manage orders
// - manage payments
// - manage tables
// - manage kitchen workflow
//
// The parent SinglePlayerGamePage controls the gaming
// session and tells this component whether the game is
// currently playable.
//
// =========================================================

import { useState } from "react";

// =========================================================
// TYPES
// =========================================================

type TargetPosition = {
  top: number;
  left: number;
};

type TargetTapGameProps = {
  isPlayable: boolean;
};

// =========================================================
// COMPONENT
// =========================================================

export default function TargetTapGame({
  isPlayable,
}: TargetTapGameProps) {
  // -------------------------------------------------------
  // SCORE
  // -------------------------------------------------------

  const [score, setScore] = useState(0);

  // -------------------------------------------------------
  // TARGET POSITION
  // -------------------------------------------------------

  const [targetPosition, setTargetPosition] =
    useState<TargetPosition>({
      top: 50,
      left: 50,
    });

  // =======================================================
  // MOVE TARGET
  // =======================================================

  const moveTarget = () => {
    const top =
      Math.floor(Math.random() * 80) + 10;

    const left =
      Math.floor(Math.random() * 80) + 10;

    setTargetPosition({
      top,
      left,
    });
  };

  // =======================================================
  // TARGET CLICK
  // =======================================================

  const handleTargetClick = () => {
    if (!isPlayable) {
      return;
    }

    setScore((currentScore) => currentScore + 1);

    moveTarget();
  };

  // =======================================================
  // GAME UI
  // =======================================================

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      {/* ===================================================
          SCORE
          =================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: "#fff",
            border: "1px solid #ddd",
            fontWeight: 700,
          }}
        >
          Score: {score}
        </div>
      </div>

      {/* ===================================================
          GAME BOARD
          =================================================== */}

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "600px",
          overflow: "hidden",
          borderRadius: "20px",
          background: "#111",
          border: "2px solid #222",
        }}
      >
        {/* =================================================
            TARGET
            ================================================= */}

        {isPlayable && (
          <button
            type="button"
            aria-label="Tap target"
            onClick={handleTargetClick}
            style={{
              position: "absolute",
              top: `${targetPosition.top}%`,
              left: `${targetPosition.left}%`,
              transform: "translate(-50%, -50%)",
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              border: "5px solid #fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            TAP
          </button>
        )}

        {/* =================================================
            LOCKED STATE
            ================================================= */}

        {!isPlayable && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.75)",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <div>
              <h2>Game Locked</h2>

              <p>
                Gameplay is currently unavailable.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}