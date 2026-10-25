type LogoProps = {
  size?: number;
  tone?: "light" | "dark";
};

export function Logo({ size = 72, tone = "light" }: LogoProps) {
  const bg = tone === "light" ? "#ffffff" : "#0B1F6B";
  const fg = tone === "light" ? "#0B1F6B" : "#ffffff";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Mayorista Sofia"
      className="sofia-logo"
    >
      <rect x="2" y="2" width="92" height="92" rx="22" fill={bg} />
      <text
        x="48"
        y="62"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="54"
        fontWeight="700"
        fill={fg}
      >
        S
      </text>
      <circle cx="48" cy="74" r="3.5" fill={fg} />
    </svg>
  );
}
