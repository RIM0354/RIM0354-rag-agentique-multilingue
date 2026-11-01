"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";

/** Élément « magnétique » : il est attiré par le curseur et ondule au clic. */
export default function Magnetic({ children, className = "", strength = 0.35, onClick }: {
  children: ReactNode; className?: string; strength?: number; onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 14, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 14, mass: 0.4 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  return (
    <motion.div
      ref={ref}
      className={`relative inline-block overflow-hidden ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      onPointerDown={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const id = Date.now();
        setRipples((list) => [...list, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
        setTimeout(() => setRipples((list) => list.filter((p) => p.id !== id)), 700);
      }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
    >
      {children}
      {ripples.map((p) => (
        <motion.span
          key={p.id}
          className="pointer-events-none absolute rounded-full bg-white/40"
          style={{ left: p.x, top: p.y, width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 30, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}
