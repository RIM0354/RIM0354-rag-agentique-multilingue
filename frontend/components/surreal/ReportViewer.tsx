"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileText, Moon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { COMPANIES, fmt, lastChange, netMargin, type Metric } from "@/lib/financials";
import Magnetic from "./Magnetic";
import SlotCounter from "./SlotCounter";
import WarpChart from "./WarpChart";

type Tab = "income" | "balance" | "ratios";
const TABS: { id: Tab; label: string }[] = [
  { id: "income", label: "Compte de résultat" },
  { id: "balance", label: "Bilan & segments" },
  { id: "ratios", label: "Ratios" },
];

function MetricCard({ m, index }: { m: Metric; index: number }) {
  const years = Object.keys(m.values).sort();
  const last = years[years.length - 1];
  const ch = lastChange(m);
  const up = (ch?.pct ?? 0) >= 0;
  const digits = m.unit === "DH" || m.unit === "%" ? 2 : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 110, damping: 16 }}
      whileHover={{ y: -8, rotateZ: index % 2 ? 0.6 : -0.6 }}
      className="iridescent frost relative overflow-hidden rounded-3xl p-6"
      style={{ transformPerspective: 1000 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: up ? "rgba(52,211,153,.35)" : "rgba(192,38,211,.4)" }}
      />
      <p className="relative text-xs font-semibold uppercase tracking-[.2em] text-slate-400">{m.label}</p>
      <p className="relative mt-3 text-4xl font-black text-white">
        <SlotCounter value={fmt(m.values[last], digits)} />
        <span className="ml-2 text-base font-semibold text-slate-400">{m.unit}</span>
      </p>
      <div className="relative mt-2 flex items-center gap-2 text-sm">
        <span className="text-slate-400">en {last}</span>
        {ch && (
          <span className={`rounded-full px-2.5 py-0.5 font-bold ${up ? "bg-emerald-400/15 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,.55)]" : "bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_0_14px_rgba(217,70,239,.55)]"}`}>
            {up ? "▲" : "▼"} {fmt(Math.abs(ch.pct), Math.abs(ch.pct) < 0.1 ? 2 : 1)} % vs {ch.from}
          </span>
        )}
      </div>
      <div className="relative mt-4"><WarpChart values={m.values} unit={m.unit} up={up} /></div>
      {m.source && <p className="relative mt-2 flex items-center gap-1.5 text-xs text-slate-500"><FileText size={12} /> {m.source}</p>}
    </motion.article>
  );
}

/** Visualiseur de rapports : cartes en verre givré, lueurs selon la tendance. */
export default function ReportViewer({ slug }: { slug: string }) {
  const [tab, setTab] = useState<Tab>("income");
  const company = COMPANIES.find((c) => c.slug === slug) ?? COMPANIES[0];

  const margin = netMargin(company);
  const ratios: Metric[] = Object.keys(margin).length
    ? [{ label: "Marge nette (calculée)", unit: "%", values: margin, source: "Résultat net part du groupe / chiffre d'affaires" }]
    : [];
  const metrics = tab === "income" ? company.income : tab === "balance" ? company.balance : ratios;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[.3em] text-violet-300">{company.sector}</p>
          <h3 className="metal-text text-4xl font-black sm:text-5xl">{company.name}</h3>
        </div>
        <div className="frost relative flex rounded-full p-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="relative z-10 rounded-full px-4 py-2 text-sm font-semibold text-white">
              {tab === t.id && (
                <motion.span layoutId="report-tab" className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-violet-600/80 to-cyan-500/70 shadow-[0_0_24px_rgba(139,92,246,.6)]" transition={{ type: "spring", stiffness: 300, damping: 26 }} />
              )}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <AnimatePresence mode="wait">
          {company.status !== "indexed" ? (
            <motion.div key={`wait-${company.slug}`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="iridescent frost rounded-3xl p-10 text-center">
              <motion.div animate={{ rotate: [0, 12, -12, 0], y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity }} className="mx-auto mb-4 w-fit text-amber-200"><Moon size={40} /></motion.div>
              <p className="text-xl font-semibold text-white">Les rapports {company.reports.join(" et ")} de {company.name} sont en cours d&apos;indexation.</p>
              <p className="mx-auto mt-2 max-w-lg text-slate-400">Les chiffres apparaîtront ici dès qu&apos;ils auront été vérifiés. Aucun chiffre n&apos;est affiché tant qu&apos;il n&apos;a pas été lu dans le rapport.</p>
            </motion.div>
          ) : metrics.length === 0 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-400">Pas encore de données pour cet onglet.</motion.p>
          ) : (
            <motion.div key={`${company.slug}-${tab}`} className="grid gap-6 md:grid-cols-2">
              {metrics.map((m, i) => <MetricCard key={m.label} m={m} index={i} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 text-center">
        <Magnetic className="rounded-full">
          <Link href={`/chat?company=${company.slug}`} className="iridescent flex items-center gap-2 rounded-full bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur">
            Interroger l&apos;analyste IA sur {company.name} <ArrowRight size={18} />
          </Link>
        </Magnetic>
      </div>
    </div>
  );
}
