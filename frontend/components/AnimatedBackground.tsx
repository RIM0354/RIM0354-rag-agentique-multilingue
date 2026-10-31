"use client";

import { motion } from "framer-motion";

/** Fond animé : trois halos de couleur qui dérivent lentement. */
export default function AnimatedBackground() {
  const blobs = [
    { className: "bg-brand-400/40 left-[-10%] top-[-10%]", x: [0, 80, -40, 0], y: [0, 60, 120, 0], d: 18 },
    { className: "bg-gold-400/30 right-[-10%] top-[20%]", x: [0, -100, 40, 0], y: [0, 80, -40, 0], d: 22 },
    { className: "bg-fuchsia-400/25 bottom-[-20%] left-[30%]", x: [0, 60, -80, 0], y: [0, -60, 20, 0], d: 26 },
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute h-[32rem] w-[32rem] rounded-full blur-3xl ${b.className}`}
          animate={{ x: b.x, y: b.y }}
          transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.15)_1px,transparent_0)] [background-size:28px_28px]" />
    </div>
  );
}
