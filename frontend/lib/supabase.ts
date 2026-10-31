import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** null quand Supabase n'est pas configuré : l'application passe alors en mode démo, sans connexion. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
export const authEnabled = supabase !== null;
