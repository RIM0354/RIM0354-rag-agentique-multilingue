import { supabase } from "./supabase";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Source = { n: number; company: string; year: string; page: number; source: string; excerpt: string };
export type Calculation = { label: string; formula: string; unit?: string; value?: number; error?: string };
export type FinalAnswer = { answer: string; sources: Source[]; calculations: Calculation[] };
export type Step = { node: string; label: string };

async function authHeaders(): Promise<Record<string, string>> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCompanies(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/companies`);
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

/** Pose une question et reçoit les étapes des agents en temps réel (Server-Sent Events via POST). */
export async function askStream(
  body: { question: string; company?: string | null; year?: string | null },
  onStep: (step: Step) => void,
): Promise<FinalAnswer> {
  const res = await fetch(`${API_URL}/ask/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(res.status === 401 ? "Session expirée, reconnectez-vous." : `Erreur API (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const raw of events) {
      const event = raw.match(/^event: (.*)$/m)?.[1];
      const data = raw.match(/^data: (.*)$/m)?.[1];
      if (!event || !data) continue;
      if (event === "step") onStep(JSON.parse(data));
      if (event === "final") return JSON.parse(data);
    }
  }
  throw new Error("La réponse a été interrompue.");
}
