"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { supabase } from "@/lib/supabase";

/** Page ouverte depuis l'email « mot de passe oublié » de Supabase. */
export default function ResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = (await supabase?.auth.updateUser({ password })) ?? { error: null };
    if (error) return setError(error.message);
    router.push("/chat");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <AnimatedBackground />
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md space-y-4 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
        <input className="input" type="password" minLength={8} required placeholder="8 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full">Enregistrer</button>
      </motion.form>
    </main>
  );
}
