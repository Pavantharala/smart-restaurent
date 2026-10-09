type GameTimerProps = {
  remainingSeconds: number;
};

export default function GameTimer({
  remainingSeconds,
}: GameTimerProps) {
  const safeSeconds = Math.max(0, remainingSeconds);

  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return (
    <div
      style={{
        fontSize: "24px",
        fontWeight: 700,
      }}
    >
      Time Remaining: {minutes}:
      {seconds.toString().padStart(2, "0")}
    </div>
  );
}