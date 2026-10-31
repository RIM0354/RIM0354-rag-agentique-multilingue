"use client";

import { animate, motion, useInView } from "framer-motion";
import { ArrowRight, Bot, Calculator, FileSearch, Globe2, ShieldCheck, Workflow } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const QUESTIONS = [
  "Quel est le chiffre d'affaires de Maroc Telecom en 2023 ?",
  "Compare la marge nette d'Attijariwafa bank en 2022 et 2023.",
  "What are Cosumar's main risks?",
  "ما هي النتيجة الصافية لمرسى المغرب؟",
];

const FEATURES = [
  { icon: Workflow, title: "Agents IA", text: "Un routeur, un chercheur, un calculateur et un vérificateur collaborent avec LangGraph." },
  { icon: FileSearch, title: "Recherche hybride", text: "Sens (BGE-M3) + mots-clés (BM25), puis reranking des meilleurs extraits." },
  { icon: Calculator, title: "Calculs exacts", text: "Les ratios sont calculés par du code, jamais estimés par le modèle." },
  { icon: ShieldCheck, title: "Sources vérifiées", text: "Chaque chiffre renvoie à sa page, et un agent contrôle la fidélité de la réponse." },
  { icon: Globe2, title: "FR · EN · AR", text: "Posez votre question dans votre langue, même sur un rapport rédigé en français." },
  { icon: Bot, title: "Serveur MCP", text: "Utilisable directement depuis Claude Desktop ou tout autre agent compatible." },
];

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{value}{suffix}</span>;
}

function TypingQuestion() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    const full = QUESTIONS[index];
    if (text.length < full.length) {
      const t = setTimeout(() => setText(full.slice(0, text.length + 1)), 35);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setText(""); setIndex((index + 1) % QUESTIONS.length); }, 2200);
    return () => clearTimeout(t);
  }, [text, index]);
  return (
    <span dir="auto">
      {text}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 bg-brand-500" />
    </span>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="btn-primary !py-2">Se connecter</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:pt-24">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto mb-6 inline-block rounded-full px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
          RAG agentique · Bourse de Casablanca
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          L&apos;analyste financier IA qui{" "}
          <span className="bg-gradient-to-r from-brand-500 via-fuchsia-500 to-gold-500 bg-clip-text text-transparent">cite ses sources</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Posez vos questions sur les rapports annuels des sociétés cotées. Des agents IA cherchent, calculent et vérifient chaque chiffre avant de répondre.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="glass mx-auto mt-10 flex max-w-2xl items-center gap-3 rounded-2xl p-4 text-left shadow-xl">
          <Bot className="shrink-0 text-brand-500" />
          <p className="min-h-6 flex-1 font-medium"><TypingQuestion /></p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-8">
          <Link href="/chat" className="btn-primary group text-lg">
            Essayer maintenant <ArrowRight className="transition group-hover:translate-x-1" size={20} />
          </Link>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-4 pb-20 text-center">
        {[{ n: 5, s: "", l: "agents IA" }, { n: 3, s: "", l: "langues" }, { n: 6, s: "", l: "étapes par question" }].map((c) => (
          <div key={c.l} className="glass rounded-2xl p-6">
            <p className="text-3xl font-extrabold text-brand-500 sm:text-4xl"><Counter to={c.n} suffix={c.s} /></p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.l}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="mb-10 text-center text-3xl font-bold">Comment ça marche</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-6 shadow-sm"
            >
              <f.icon className="mb-4 text-brand-500" />
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="pb-10 text-center text-sm text-slate-500">
        Projet portfolio · LangGraph, Qdrant, FastAPI, MCP, Next.js
      </footer>
    </main>
  );
}
