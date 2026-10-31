"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { authEnabled, supabase } from "@/lib/supabase";

type Mode = "login" | "signup" | "forgot";

const TITLES: Record<Mode, string> = {
  login: "Bon retour 👋",
  signup: "Créer un compte",
  forgot: "Mot de passe oublié",
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/chat");
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return router.push("/chat");
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/chat");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/chat` },
        });
        if (error) throw error;
        setMessage({ type: "success", text: "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset` });
        if (error) throw error;
        setMessage({ type: "success", text: "Si ce compte existe, un lien de réinitialisation vient d'être envoyé." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Une erreur est survenue." });
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    await supabase?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/chat` } });
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-10">
      <AnimatedBackground />
      <div className="absolute left-4 right-4 top-5 mx-auto flex max-w-6xl items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 16 }} className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl">
        {mode !== "forgot" && (
          <div className="relative mb-8 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setMessage(null); }} className="relative z-10 py-2 text-sm font-semibold">
                {mode === m && <motion.span layoutId="tab" className="absolute inset-0 -z-10 rounded-lg bg-white shadow dark:bg-slate-700" transition={{ type: "spring", stiffness: 300, damping: 28 }} />}
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.form key={mode} onSubmit={submit} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-4">
            <h1 className="text-2xl font-bold">{TITLES[mode]}</h1>

            {!authEnabled && (
              <p className="rounded-xl bg-gold-400/20 p-3 text-sm">
                Mode démo : Supabase n&apos;est pas configuré, la connexion est désactivée.
              </p>
            )}

            {mode === "signup" && (
              <label className="relative block">
                <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input className="input pl-10" placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} required={authEnabled} />
              </label>
            )}
            <label className="relative block">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input className="input pl-10" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required={authEnabled} />
            </label>
            {mode !== "forgot" && (
              <label className="relative block">
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input className="input pl-10" type="password" placeholder="Mot de passe (8 caractères min.)" minLength={authEnabled ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} required={authEnabled} />
              </label>
            )}

            <AnimatePresence>
              {message && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`rounded-xl p-3 text-sm ${message.type === "error" ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                  {message.text}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button whileTap={{ scale: 0.97 }} disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="animate-spin" size={18} />}
              {!authEnabled ? "Entrer en mode démo" : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
            </motion.button>

            {mode === "login" && authEnabled && (
              <>
                <button type="button" onClick={() => setMode("forgot")} className="block w-full text-center text-sm text-brand-500 hover:underline">
                  Mot de passe oublié ?
                </button>
                <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />ou<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
                <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={google} className="input flex items-center justify-center gap-2 font-semibold">
                  <span className="text-lg font-black text-brand-500">G</span> Continuer avec Google
                </motion.button>
              </>
            )}
            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("login")} className="block w-full text-center text-sm text-brand-500 hover:underline">
                Retour à la connexion
              </button>
            )}
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
