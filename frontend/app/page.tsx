"use client";

import { motion, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Bot, Calculator, FileSearch, Globe2, ShieldCheck, Workflow } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import CompanySearch from "@/components/surreal/CompanySearch";
import FloatingCurrencies from "@/components/surreal/FloatingCurrencies";
import Magnetic from "@/components/surreal/Magnetic";
import Nucleus from "@/components/surreal/Nucleus";
import ReportViewer from "@/components/surreal/ReportViewer";
import SlotCounter from "@/components/surreal/SlotCounter";
import Ticker from "@/components/surreal/Ticker";
import { COMPANIES } from "@/lib/financials";

const FEATURES = [
  { icon: Workflow, title: "Agents IA", text: "Un routeur, un chercheur, un calculateur et un vérificateur collaborent avec LangGraph." },
  { icon: FileSearch, title: "Recherche hybride", text: "Sens et mots-clés combinés, puis un tri des meilleurs extraits." },
  { icon: Calculator, title: "Calculs exacts", text: "Les ratios sont calculés par du code, jamais estimés par le modèle." },
  { icon: ShieldCheck, title: "Sources vérifiées", text: "Chaque chiffre renvoie à sa page, et un agent contrôle la fidélité de la réponse." },
  { icon: Globe2, title: "FR · EN · AR", text: "Posez votre question dans votre langue, même sur un rapport rédigé en français." },
  { icon: Bot, title: "Serveur MCP", text: "Utilisable depuis n'importe quel assistant compatible MCP." },
];

/** Halo lumineux qui suit le curseur. */
function CursorAura() {
  const x = useSpring(useMotionValue(-400), { stiffness: 120, damping: 20 });
  const y = useSpring(useMotionValue(-400), { stiffness: 120, damping: 20 });
  useEffect(() => {
    const move = (e: PointerEvent) => { x.set(e.clientX - 200); y.set(e.clientY - 200); };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[1] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,.18),transparent_65%)] mix-blend-screen"
      style={{ x, y }}
    />
  );
}

/** Rideau d'ouverture : la page se révèle comme un rêve qui commence. */
function Curtain() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] bg-[#05030d]"
      initial={{ clipPath: "circle(150% at 50% 50%)" }}
      animate={{ clipPath: "circle(0% at 50% 45%)" }}
      transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
    />
  );
}

function Section({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
      <motion.div initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8 }} className="mb-12 text-center">
        <p className="text-sm uppercase tracking-[.35em] text-violet-300">{eyebrow}</p>
        <h2 className="metal-text mt-3 text-4xl font-black sm:text-5xl">{title}</h2>
      </motion.div>
      {children}
    </section>
  );
}

export default function Home() {
  const [selected, setSelected] = useState(COMPANIES[0].slug);
  const viewer = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroFade = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const heroSkew = useTransform(scrollYProgress, [0, 0.18], [0, -6]);

  function select(slug: string) {
    setSelected(slug);
    viewer.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="dark grain relative isolate min-h-screen overflow-x-hidden bg-[#05030d] text-slate-100">
      <Curtain />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,rgba(76,29,149,.45),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(8,145,178,.25),transparent_55%)]" />
      <FloatingCurrencies />
      <CursorAura />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <nav className="flex items-center gap-3">
          <a href="#societes" className="hidden text-sm text-slate-300 transition hover:text-white sm:block">Sociétés</a>
          <a href="#rapports" className="hidden text-sm text-slate-300 transition hover:text-white sm:block">Rapports</a>
          <Magnetic className="rounded-full">
            <Link href="/login" className="iridescent block rounded-full bg-white/5 px-5 py-2 text-sm font-semibold backdrop-blur">Se connecter</Link>
          </Magnetic>
        </nav>
      </header>

      {/* Hero : le noyau financier */}
      <motion.section style={{ opacity: heroFade, skewY: heroSkew }} className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 px-4 pt-6 [transform-style:flat] [will-change:transform] lg:grid-cols-[1fr_1.1fr]">
        <div className="relative z-10 min-w-0 text-center lg:text-left">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="frost inline-block rounded-full px-4 py-1.5 text-sm font-medium text-violet-200">
            Bourse de Casablanca · RAG agentique
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(16px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, delay: 1.3 }}
            className="mt-6 text-[2.6rem] font-black leading-[1.02] tracking-tight sm:text-7xl"
          >
            Les rapports financiers,
            <br />
            <span className="metal-text">comme dans un rêve.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }} className="mx-auto mt-6 max-w-xl text-lg text-slate-300 lg:mx-0">
            Des agents IA lisent les rapports annuels des sociétés cotées, calculent chaque ratio et citent la page exacte. Le décor est irréel, les chiffres ne le sont pas.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9 }} className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Magnetic className="rounded-full">
              <Link href="/chat" className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 px-7 py-3.5 text-lg font-bold text-white shadow-[0_0_40px_rgba(168,85,247,.55)]">
                Poser une question <ArrowRight className="transition group-hover:translate-x-1" size={20} />
              </Link>
            </Magnetic>
            <Magnetic className="rounded-full">
              <a href="#societes" className="iridescent block rounded-full bg-white/5 px-7 py-3.5 text-lg font-semibold backdrop-blur">Explorer les sociétés</a>
            </Magnetic>
          </motion.div>
        </div>
        <motion.div className="relative h-[360px] min-w-0 overflow-visible sm:h-[600px]" initial={{ opacity: 0, scale: 0.6, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.6, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}>
          <div className="absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-[.6] sm:scale-100">
            <Nucleus />
          </div>
        </motion.div>
      </motion.section>

      <div className="relative z-10 mt-6">
        <Ticker />
      </div>

      {/* Compteurs */}
      <section className="relative z-10 mx-auto grid max-w-4xl grid-cols-3 gap-4 px-4 pt-24 text-center">
        {[{ v: "5", l: "agents IA" }, { v: "3", l: "langues" }, { v: String(COMPANIES.length), l: "sociétés" }].map((c, i) => (
          <motion.div key={c.l} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6, rotate: i - 1 }} className="iridescent frost rounded-3xl p-6">
            <p className="metal-text text-5xl font-black"><SlotCounter value={c.v} /></p>
            <p className="mt-1 text-sm text-slate-400">{c.l}</p>
          </motion.div>
        ))}
      </section>

      <Section id="societes" eyebrow="Moteur de recherche" title="Les sociétés cotées">
        <CompanySearch selected={selected} onSelect={select} />
      </Section>

      <div ref={viewer} id="rapports" className="scroll-mt-10">
        <Section eyebrow="Visualiseur de rapports" title="Bilans, résultats et ratios">
          <ReportViewer slug={selected} />
        </Section>
      </div>

      <Section eyebrow="Sous le décor" title="Comment ça marche">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30, rotateX: -20 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="iridescent frost rounded-3xl p-6"
              style={{ transformPerspective: 900 }}
            >
              <f.icon className="mb-4 text-violet-300" />
              <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <footer className="relative z-10 pb-10 text-center text-sm text-slate-500">
        Projet portfolio · LangGraph, Qdrant, FastAPI, MCP, Next.js · Chiffres issus des rapports AMMC
      </footer>
    </main>
  );
}
