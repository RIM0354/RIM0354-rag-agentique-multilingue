"use client";

import { motion, useTransform } from "framer-motion";
import CurrencyCoin, { type Currency } from "./CurrencyCoin";
import { usePointer } from "./usePointer";

const ORBITS: { tilt: number; radius: number; duration: number; coins: Currency[]; reverse?: boolean }[] = [
  { tilt: 72, radius: 150, duration: 14, coins: ["DH", "$", "€"] },
  { tilt: 64, radius: 215, duration: 22, coins: ["€", "DH", "$", "DH"], reverse: true },
  { tilt: 78, radius: 280, duration: 32, coins: ["$", "€", "DH", "$", "€"] },
];

/** Noyau financier lumineux autour duquel tourbillonnent les monnaies. */
export default function Nucleus() {
  const { x, y } = usePointer();
  const rotateX = useTransform(y, (v) => v * -12);
  const rotateY = useTransform(x, (v) => v * 14);

  return (
    <motion.div
      aria-hidden
      className="relative h-[600px] w-[600px]"
      style={{ rotateX, rotateY, transformPerspective: 1200, transformStyle: "preserve-3d" }}
    >
      {/* Halo et noyau */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="absolute h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,.45),rgba(34,211,238,.15)_45%,transparent_70%)] blur-2xl" style={{ animation: "breathe 6s ease-in-out infinite" }} />
        <motion.div
          className="relative grid h-36 w-36 place-items-center rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ background: "conic-gradient(from 0deg, #7c3aed, #22d3ee, #f0abfc, #fde68a, #34d399, #7c3aed)" }}
        >
          <div className="absolute inset-[3px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#c4b5fd_18%,#4c1d95_55%,#0b0618_100%)] shadow-[0_0_80px_20px_rgba(139,92,246,.45)]" />
        </motion.div>
        <svg className="absolute h-56 w-56 opacity-70" viewBox="0 0 100 100">
          <defs>
            <filter id="warp">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3">
                <animate attributeName="baseFrequency" dur="12s" values="0.02;0.045;0.02" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" scale="9" />
            </filter>
          </defs>
          <polyline filter="url(#warp)" fill="none" stroke="url(#g)" strokeWidth="1.4" points="10,62 22,55 32,60 44,40 55,48 66,30 78,36 90,18" />
          <linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#f0abfc" /></linearGradient>
        </svg>
      </div>

      {/* Orbites inclinées */}
      {ORBITS.map((orbit, o) => (
        <div key={o} className="absolute inset-0 grid place-items-center" style={{ transform: `rotateX(${orbit.tilt}deg)`, transformStyle: "preserve-3d" }}>
          <div className="absolute rounded-full border border-white/10" style={{ width: orbit.radius * 2, height: orbit.radius * 2 }} />
          <motion.div
            className="absolute"
            style={{ width: orbit.radius * 2, height: orbit.radius * 2, transformStyle: "preserve-3d" }}
            animate={{ rotate: orbit.reverse ? -360 : 360 }}
            transition={{ duration: orbit.duration, repeat: Infinity, ease: "linear" }}
          >
            {orbit.coins.map((c, i) => {
              const angle = (i / orbit.coins.length) * Math.PI * 2;
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: orbit.radius + Math.cos(angle) * orbit.radius - 22,
                    top: orbit.radius + Math.sin(angle) * orbit.radius - 22,
                    transform: `rotateX(-${orbit.tilt}deg)`, // la pièce reste face à nous
                  }}
                >
                  <CurrencyCoin symbol={c} size={44 + o * 4} spin={3 + i} />
                </div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
