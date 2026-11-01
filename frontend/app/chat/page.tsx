"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calculator, FileText, LogOut, Send, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import AgentSteps from "@/components/AgentSteps";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { askStream, fetchCompanies, type FinalAnswer, type Source, type Step } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type Message = { id: number; question: string; steps: Step[]; result?: FinalAnswer; error?: string };

const SUGGESTIONS = [
  "Quel est le chiffre d'affaires consolidé en 2023 ?",
  "Compare le résultat net entre 2022 et 2023.",
  "Quels sont les principaux risques mentionnés ?",
  "ما هو صافي الربح سنة 2023؟",
];
const YEARS = ["2022", "2023", "2024", "2025"];

/** Remplace les citations [n] par des pastilles cliquables. */
function withCitations(text: string) {
  return text.replace(/\[(\d+)\]/g, "[$1](#source-$1)");
}

export default function ChatPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [year, setYear] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [running, setRunning] = useState(false);
  const [openSource, setOpenSource] = useState<Source | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) router.replace("/login");
        else setEmail(data.session.user.email ?? null);
      });
    }
    fetchCompanies().then(setCompanies);
    // Société présélectionnée depuis la page d'accueil (/chat?company=...)
    const preset = new URLSearchParams(window.location.search).get("company");
    if (preset) setCompany(preset);
  }, [router]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    if (!question.trim() || running) return;
    const id = Date.now();
    setMessages((m) => [...m, { id, question, steps: [] }]);
    setInput("");
    setRunning(true);
    const update = (patch: Partial<Message>) => setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)));
    try {
      const result = await askStream(
        { question, company: company || null, year: year || null },
        (step) => setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, steps: [...msg.steps, step] } : msg))),
      );
      update({ result });
    } catch (err) {
      update({ error: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      setRunning(false);
    }
  }

  async function logout() {
    await supabase?.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <Logo />
        <div className="flex items-center gap-2">
          <select aria-label="Entreprise" value={company} onChange={(e) => setCompany(e.target.value)} className="input !w-auto !py-2 text-sm">
            <option value="">Toutes les entreprises</option>
            {companies.map((c) => <option key={c} value={c}>{c.replaceAll("_", " ")}</option>)}
          </select>
          <select aria-label="Année" value={year} onChange={(e) => setYear(e.target.value)} className="input hidden !w-auto !py-2 text-sm sm:block">
            <option value="">Toutes les années</option>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <ThemeToggle />
          {supabase && (
            <button onClick={logout} title={email ?? ""} aria-label="Se déconnecter" className="glass grid h-10 w-10 place-items-center rounded-xl">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-8">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-10 text-center">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-gold-500 text-white shadow-xl">
                <Sparkles />
              </motion.div>
              <h1 className="text-2xl font-bold">Que voulez-vous savoir ?</h1>
              <p className="mt-2 text-slate-500">Posez une question en français, en anglais ou en arabe.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} whileHover={{ scale: 1.02 }} onClick={() => ask(s)} dir="auto" className="glass rounded-xl p-4 text-left text-sm">
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex justify-end">
                <p dir="auto" className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-3 text-white shadow">{m.question}</p>
              </div>
              <div className="glass rounded-2xl rounded-bl-sm p-5 shadow-sm">
                <AgentSteps steps={m.steps} running={running && !m.result && !m.error} />
                {m.error && <p className="mt-3 text-sm text-red-600">{m.error}</p>}
                <AnimatePresence>
                  {m.result && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                      <div dir="auto" className="prose-answer">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => {
                              const n = Number(href?.replace("#source-", ""));
                              const src = m.result?.sources.find((s) => s.n === n);
                              return src ? (
                                <button onClick={() => setOpenSource(src)} className="mx-0.5 inline-grid h-5 min-w-5 place-items-center rounded-md bg-brand-100 px-1 align-text-top text-xs font-bold text-brand-600 transition hover:bg-brand-500 hover:text-white dark:bg-brand-900 dark:text-brand-400">
                                  {children}
                                </button>
                              ) : <a href={href}>{children}</a>;
                            },
                          }}
                        >
                          {withCitations(m.result.answer)}
                        </ReactMarkdown>
                      </div>

                      {m.result.calculations.some((c) => c.value !== undefined) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.result.calculations.filter((c) => c.value !== undefined).map((c) => (
                            <span key={c.label} title={c.formula} className="inline-flex items-center gap-1 rounded-lg bg-gold-400/20 px-2.5 py-1 text-xs font-medium">
                              <Calculator size={13} /> {c.label} : {c.value} {c.unit}
                            </span>
                          ))}
                        </div>
                      )}

                      {m.result.sources.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {m.result.sources.map((s) => (
                            <motion.button key={s.n} whileHover={{ y: -2 }} onClick={() => setOpenSource(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700">
                              <FileText size={13} className="text-brand-500" />
                              [{s.n}] {s.company.replaceAll("_", " ")} {s.year} · p.{s.page}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
          <div ref={bottom} />
        </div>
      </main>

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="border-t border-slate-200 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-3xl gap-2">
          <input dir="auto" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez votre question…" className="input" maxLength={1000} />
          <motion.button whileTap={{ scale: 0.9 }} disabled={running || !input.trim()} className="btn-primary !px-4" aria-label="Envoyer">
            <Send size={18} />
          </motion.button>
        </div>
      </form>

      <AnimatePresence>
        {openSource && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenSource(null)} className="fixed inset-0 z-40 bg-black/30" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 30 }} className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-brand-500">Source [{openSource.n}]</p>
                  <h2 className="text-lg font-bold">{openSource.company.replaceAll("_", " ")} · {openSource.year}</h2>
                  <p className="text-sm text-slate-500">Page {openSource.page} · {openSource.source}</p>
                </div>
                <button onClick={() => setOpenSource(null)} aria-label="Fermer"><X /></button>
              </div>
              <p dir="auto" className="whitespace-pre-wrap rounded-xl border-l-4 border-gold-500 bg-gold-400/10 p-4 text-sm leading-relaxed">{openSource.excerpt}…</p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
