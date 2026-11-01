"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { COMPANIES, type Company } from "@/lib/financials";

function TiltCard({ company, active, onSelect }: { company: Company; active: boolean; onSelect: () => void }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 15 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 150, damping: 15 });
  const glowX = useTransform(mx, (v) => `${(v + 0.5) * 100}%`);
  const glowY = useTransform(my, (v) => `${(v + 0.5) * 100}%`);

  return (
    <motion.button
      layout
      onClick={onSelect}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      whileTap={{ scale: 0.96 }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={`iridescent frost group relative overflow-hidden rounded-3xl p-6 text-left transition ${active ? "ring-2 ring-white/40" : ""}`}
    >
      {/* Reflet qui suit la souris */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-1 opacity-0 transition group-hover:opacity-100"
        style={{ background: useTransform([glowX, glowY], ([x, y]) => `radial-gradient(240px circle at ${x} ${y}, hsla(${company.hue},90%,70%,.28), transparent 60%)`) }}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="metal-text text-3xl font-black tracking-widest">{company.ticker}</span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${company.status === "indexed" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}>
            {company.status === "indexed" ? "Données vérifiées" : "Indexation en cours"}
          </span>
        </div>
        <p className="mt-4 text-lg font-semibold text-white">{company.name}</p>
        <p className="text-sm text-slate-400">{company.sector} · rapports {company.reports.join(", ")}</p>
      </div>
    </motion.button>
  );
}

/** Barre de recherche et fiches des sociétés cotées. */
export default function CompanySearch({ selected, onSelect }: { selected: string; onSelect: (slug: string) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return COMPANIES.filter((c) => !s || `${c.name} ${c.ticker} ${c.sector}`.toLowerCase().includes(s));
  }, [q]);

  return (
    <div>
      <motion.label
        whileFocus={{ scale: 1.01 }}
        className="iridescent frost mx-auto flex max-w-2xl items-center gap-3 rounded-full px-6 py-4"
      >
        <Search className="text-violet-300" size={20} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une société, un symbole, un secteur…"
          className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
        />
        <Sparkles className="text-amber-200" size={18} />
      </motion.label>

      <motion.div layout className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => <TiltCard key={c.slug} company={c} active={c.slug === selected} onSelect={() => onSelect(c.slug)} />)}
        {list.length === 0 && <p className="col-span-full text-center text-slate-400">Aucune société ne correspond. Essayez « IAM » ou « banque ».</p>}
      </motion.div>
    </div>
  );
}
