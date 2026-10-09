type GameHeaderProps = {
  title: string;
  description: string;
  category: "single-player" | "multiplayer";
};

export default function GameHeader({
  title,
  description,
  category,
}: GameHeaderProps) {
  return (
    <header
      style={{
        marginBottom: "24px",
      }}
    >
      <h1>{title}</h1>

      <p>{description}</p>

      <p>
        {category === "single-player"
          ? "Single Player"
          : "Multiplayer"}
      </p>
    </header>
  );
}