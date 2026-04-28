export default function WaveSeparator({
  color = "#EFF6FF",
  flip = false,
}: {
  color?: string;
  flip?: boolean;
}) {
  return (
    <div
      className={`wave-separator ${flip ? "wave-separator-flip" : ""}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <path
          d="M0,64 C280,18 880,72 1440,38 L1440,80 L0,80 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}
