import type { CSSProperties } from "react";

export type Currency = "$" | "€" | "DH";

const PALETTES: Record<Currency, { c1: string; c2: string; c3: string; glow: string }> = {
  $: { c1: "#a7f3d0", c2: "#34d399", c3: "#ecfccb", glow: "rgba(52,211,153,.55)" },
  "€": { c1: "#c4b5fd", c2: "#818cf8", c3: "#e0e7ff", glow: "rgba(129,140,248,.6)" },
  DH: { c1: "#fde68a", c2: "#f59e0b", c3: "#fff7ed", glow: "rgba(245,158,11,.6)" },
};

/** Pièce de monnaie métallique qui tourne sur elle-même en 3D. */
export default function CurrencyCoin({ symbol, size = 64, spin = 6, style }: {
  symbol: Currency; size?: number; spin?: number; style?: CSSProperties;
}) {
  const p = PALETTES[symbol];
  const vars = { "--c1": p.c1, "--c2": p.c2, "--c3": p.c3, "--glow": p.glow, "--spin": `${spin}s` } as CSSProperties;
  return (
    <div style={{ width: size, height: size, perspective: 600, ...style }} aria-hidden>
      <div className="coin relative h-full w-full" style={vars}>
        <span className="coin-face" style={{ fontSize: size * (symbol === "DH" ? 0.34 : 0.48) }}>{symbol}</span>
        <span className="coin-face back" style={{ fontSize: size * (symbol === "DH" ? 0.34 : 0.48) }}>{symbol}</span>
      </div>
    </div>
  );
}
