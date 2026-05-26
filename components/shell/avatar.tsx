"use client";

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const COLORS = [
  "#c97443", // brand warm (close to --brand oklch(62% .16 30))
  "#2e9585", // teal
  "#4a7fc1", // blue
  "#7e6ebf", // purple
  "#5a9e6f", // green
  "#c4607a", // rose
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  return COLORS[hash % COLORS.length]!;
}

export function Avatar({ name, size = 32, className }: AvatarProps) {
  return (
    <span
      className={className}
      aria-label={name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: hashColor(name),
        color: "var(--paper)",
        fontSize: Math.round(size * 0.38),
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0,
        userSelect: "none",
        letterSpacing: "0.01em",
      }}
    >
      {getInitials(name)}
    </span>
  );
}
