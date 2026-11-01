import { COMPANIES, fmt, lastChange } from "@/lib/financials";

type Item = { key: string; ticker: string; label: string; value: string; pct?: number };

function buildItems(): Item[] {
  const items: Item[] = [];
  for (const c of COMPANIES) {
    if (c.status !== "indexed") {
      items.push({ key: c.ticker, ticker: c.ticker, label: c.name, value: "indexation en cours" });
      continue;
    }
    for (const m of c.income) {
      const ch = lastChange(m);
      const years = Object.keys(m.values).sort();
      const last = years[years.length - 1];
      items.push({
        key: `${c.ticker}-${m.label}`,
        ticker: c.ticker,
        label: `${m.label} ${last}`,
        value: `${fmt(m.values[last], m.unit === "DH" ? 2 : 0)} ${m.unit}`,
        pct: ch?.pct,
      });
    }
  }
  return items;
}

function Row({ items, duration, reverse }: { items: Item[]; duration: number; reverse?: boolean }) {
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div
        className="marquee flex shrink-0 gap-3 py-2"
        style={{ ["--duration" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {loop.map((it, i) => {
          const up = (it.pct ?? 0) >= 0;
          return (
            <span key={i} className="frost flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 px-4 py-1.5 text-sm">
              <b className="metal-text font-black tracking-wider">{it.ticker}</b>
              <span className="text-slate-400">{it.label}</span>
              <span className="font-semibold text-white">{it.value}</span>
              {it.pct !== undefined && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${up ? "bg-emerald-400/15 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,.5)]" : "bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,.5)]"}`}>
                  {up ? "▲" : "▼"} {fmt(Math.abs(it.pct), Math.abs(it.pct) < 0.1 ? 2 : 1)} %
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Ruban infini qui fait défiler les sociétés et leurs indicateurs réels. */
export default function Ticker() {
  const items = buildItems();
  return (
    <div className="relative z-10 -rotate-1 border-y border-white/10 bg-black/30 backdrop-blur">
      <Row items={items} duration={45} />
      <Row items={[...items].reverse()} duration={60} reverse />
    </div>
  );
}
