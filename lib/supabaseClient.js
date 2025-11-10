import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Jangan menggagalkan build kalau env belum terbaca saat analisis modul.
  if (!url || !anon) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Supabase env missing. Check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
  }

  return createClient(url, anon);
}
