"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Chiffre affiché comme un rouleau de machine à sous qui s'arrête sur la bonne valeur. */
export default function SlotCounter({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, margin: "-40px" });
  const chars = value.split("");

  return (
    <span ref={ref} className={`inline-flex overflow-hidden tabular-nums ${className}`} aria-label={value}>
      {chars.map((ch, i) => {
        const d = DIGITS.indexOf(ch);
        if (d === -1) return <span key={i} aria-hidden className="whitespace-pre">{ch}</span>;
        // Chaque rouleau fait quelques tours avant de s'arrêter, les derniers chiffres plus longtemps
        const turns = 1 + (i % 3);
        const target = turns * 10 + d;
        return (
          <span key={i} aria-hidden className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none">
            <motion.span
              className="absolute left-0 top-0 flex flex-col"
              initial={{ y: "0em" }}
              animate={{ y: inView ? `-${target}em` : "0em" }}
              transition={{ duration: 1.4 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              {Array.from({ length: (turns + 1) * 10 }, (_, k) => (
                <span key={k} className="block h-[1em] leading-none">{k % 10}</span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
