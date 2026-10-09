import { useEffect, useMemo, useState } from "react";

type Card = {
  id: number;
  value: string;
  matched: boolean;
};

type MemoryMatchGameProps = {
  isPlayable: boolean;
};

const SYMBOLS = [
  "🍎",
  "🍌",
  "🍇",
  "🍉",
  "🍓",
  "🍊",
  "🥝",
  "🍍",
];

function createCards(): Card[] {
  const values = [...SYMBOLS, ...SYMBOLS];

  return values
    .sort(() => Math.random() - 0.5)
    .map((value, index) => ({
      id: index,
      value,
      matched: false,
    }));
}

export default function MemoryMatchGame({
  isPlayable,
}: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>(
    () => createCards(),
  );

  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);

  const flippedCards = useMemo(
    () =>
      flipped
        .map((id) =>
          cards.find((card) => card.id === id),
        )
        .filter(Boolean) as Card[],
    [flipped, cards],
  );

  useEffect(() => {
    if (flipped.length !== 2) {
      return;
    }

    const [first, second] = flippedCards;

    if (!first || !second) {
      return;
    }

    const match = first.value === second.value;

    const timeout = window.setTimeout(() => {
      if (match) {
        setCards((currentCards) =>
          currentCards.map((card) =>
            flipped.includes(card.id)
              ? {
                  ...card,
                  matched: true,
                }
              : card,
          ),
        );
      }

      setFlipped([]);
    }, 600);

    setMoves((currentMoves) => currentMoves + 1);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [flipped, flippedCards]);

  useEffect(() => {
    const allMatched =
      cards.length > 0 &&
      cards.every((card) => card.matched);

    if (allMatched) {
      setCompleted(true);
    }
  }, [cards]);

  function handleCardClick(card: Card) {
    if (!isPlayable) {
      return;
    }

    if (completed) {
      return;
    }

    if (card.matched) {
      return;
    }

    if (flipped.includes(card.id)) {
      return;
    }

    if (flipped.length >= 2) {
      return;
    }

    setFlipped((currentFlipped) => [
      ...currentFlipped,
      card.id,
    ]);
  }

  function restartGame() {
    setCards(createCards());
    setFlipped([]);
    setMoves(0);
    setCompleted(false);
  }

  return (
    <section>
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2>Memory Match</h2>

          <p>
            Find all matching pairs with as few moves
            as possible.
          </p>

          <strong>
            Moves: {moves}
          </strong>
        </div>

        <button
          type="button"
          onClick={restartGame}
          disabled={!isPlayable}
          style={{
            padding: "10px 16px",
            cursor: isPlayable
              ? "pointer"
              : "not-allowed",
          }}
        >
          Restart
        </button>
      </div>

      {completed && isPlayable && (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px",
            border: "1px solid #ccc",
            borderRadius: "10px",
          }}
        >
          <h3>🎉 Congratulations!</h3>

          <p>
            You matched all the cards in {moves} moves.
          </p>
        </div>
      )}

      {!isPlayable && !completed && (
        <p>
          Gaming is currently unavailable.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(60px, 1fr))",
          gap: "10px",
          maxWidth: "520px",
        }}
      >
        {cards.map((card) => {
          const isFlipped =
            flipped.includes(card.id);

          const isVisible =
            isFlipped || card.matched;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() =>
                handleCardClick(card)
              }
              disabled={
                !isPlayable ||
                card.matched ||
                flipped.length >= 2
              }
              style={{
                aspectRatio: "1",
                fontSize: "32px",
                border: "1px solid #ccc",
                borderRadius: "10px",
                cursor:
                  isPlayable &&
                  !card.matched &&
                  flipped.length < 2
                    ? "pointer"
                    : "default",
              }}
            >
              {isVisible ? card.value : "?"}
            </button>
          );
        })}
      </div>
    </section>
  );
}