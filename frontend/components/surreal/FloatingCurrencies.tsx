"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { useMemo } from "react";
import CurrencyCoin, { type Currency } from "./CurrencyCoin";
import { seeded, usePointer } from "./usePointer";

const SYMBOLS: Currency[] = ["$", "€", "DH"];

function Floater({ px, py, item }: {
  px: MotionValue<number>; py: MotionValue<number>;
  item: { left: number; top: number; size: number; depth: number; symbol: Currency; spin: number; drift: number; delay: number; blur: number };
}) {
  // Plus la pièce est « proche », plus elle bouge avec la souris (parallaxe)
  const x = useTransform(px, (v) => v * item.depth * -60);
  const y = useTransform(py, (v) => v * item.depth * -40);
  const rotateX = useTransform(py, (v) => v * 25);
  const rotateY = useTransform(px, (v) => v * -25);
  return (
    <motion.div className="absolute" style={{ left: `${item.left}%`, top: `${item.top}%`, x, y, filter: `blur(${item.blur}px)` }}>
      <motion.div
        animate={{ y: [0, -item.drift, 0, item.drift * 0.6, 0], rotateZ: [0, 8, -6, 0] }}
        transition={{ duration: 9 + item.depth * 6, delay: item.delay, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotateX, rotateY, transformPerspective: 800 }}
      >
        <CurrencyCoin symbol={item.symbol} size={item.size} spin={item.spin} />
      </motion.div>
    </motion.div>
  );
}

/** Champ de pièces qui flottent en apesanteur et réagissent à la souris. */
export default function FloatingCurrencies({ count = 16 }: { count?: number }) {
  const { x, y } = usePointer();
  const items = useMemo(() => {
    const rand = seeded(42);
    return Array.from({ length: count }, (_, i) => {
      const depth = 0.3 + rand() * 1.2;
      return {
        left: rand() * 96,
        top: rand() * 92,
        size: 18 + depth * 34,
        depth,
        symbol: SYMBOLS[i % 3],
        spin: 4 + rand() * 8,
        drift: 10 + rand() * 30,
        delay: rand() * 4,
        blur: depth < 0.6 ? 2 : 0, // les pièces lointaines sont floues
      };
    });
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {items.map((item, i) => <Floater key={i} px={x} py={y} item={item} />)}
    </div>
  );
}
