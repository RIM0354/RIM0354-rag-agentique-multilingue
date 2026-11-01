"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { fmt } from "@/lib/financials";

/** Petit graphique dont la courbe ondule doucement, comme vue à travers de l'eau. */
export default function WarpChart({ values, unit, up }: { values: Record<string, number>; unit: string; up: boolean }) {
  const id = useId().replace(/:/g, "");
  const years = Object.keys(values).sort();
  const nums = years.map((y) => values[y]);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || Math.abs(max) || 1;
  const W = 300;
  const H = 110;
  const pts = years.map((y, i) => ({
    year: y,
    v: values[y],
    x: years.length === 1 ? W / 2 : 20 + (i / (years.length - 1)) * (W - 40),
    y: H - 22 - ((values[y] - min) / span) * (H - 48),
  }));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const c1 = up ? "#34d399" : "#d946ef";
  const c2 = up ? "#22d3ee" : "#7c3aed";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full overflow-visible" role="img" aria-label={`Évolution en ${unit}`}>
      <defs>
        <linearGradient id={`s${id}`} x1="0" x2="1"><stop offset="0" stopColor={c2} /><stop offset="1" stopColor={c1} /></linearGradient>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} stopOpacity=".35" /><stop offset="1" stopColor={c1} stopOpacity="0" /></linearGradient>
        <filter id={`w${id}`}>
          <feTurbulence type="turbulence" baseFrequency="0.012 0.04" numOctaves="2" seed="7">
            <animate attributeName="baseFrequency" dur="10s" values="0.012 0.04;0.02 0.06;0.012 0.04" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
      </defs>
      <g filter={`url(#w${id})`}>
        <motion.path d={area} fill={`url(#a${id})`} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1.2 }} />
        <motion.path
          d={line} fill="none" stroke={`url(#s${id})`} strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${c1})` }}
        />
      </g>
      {pts.map((p) => (
        <g key={p.year}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" style={{ filter: `drop-shadow(0 0 6px ${c1})` }} />
          <text x={p.x} y={H - 4} textAnchor="middle" className="fill-slate-400 text-[10px]">{p.year}</text>
          <title>{`${p.year} : ${fmt(p.v, unit === "DH" ? 2 : 0)} ${unit}`}</title>
        </g>
      ))}
    </svg>
  );
}
