"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calculator, CheckCircle2, FileSearch, PenLine, Route, ShieldCheck } from "lucide-react";
import type { Step } from "@/lib/api";

const ICONS: Record<string, typeof Route> = {
  guard: ShieldCheck, router: Route, researcher: FileSearch, calculator: Calculator, writer: PenLine, verifier: CheckCircle2,
};

/** Fil d'activité des agents, qui s'anime à mesure que chaque étape arrive. */
export default function AgentSteps({ steps, running }: { steps: Step[]; running: boolean }) {
  return (
    <ol className="space-y-2">
      <AnimatePresence initial={false}>
        {steps.map((step, i) => {
          const Icon = ICONS[step.node] ?? Route;
          const last = i === steps.length - 1 && running;
          return (
            <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className={`grid h-7 w-7 place-items-center rounded-lg ${last ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400"}`}>
                <Icon size={15} className={last ? "animate-pulse" : ""} />
              </span>
              {step.label}
            </motion.li>
          );
        })}
      </AnimatePresence>
      {running && (
        <li className="flex items-center gap-1 pl-9">
          {[0, 1, 2].map((d) => (
            <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-brand-500" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: d * 0.15 }} />
          ))}
        </li>
      )}
    </ol>
  );
}
