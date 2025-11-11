"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
const supabase = supabaseBrowser;

export default function ForgotPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const baseUrl = useMemo(() => {
    const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
    if (fromEnv) return fromEnv;
    if (typeof window !== "undefined") return window.location.origin;
    return ""; 
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    const emailTrim = email.trim().toLowerCase();
    const valid = /\S+@\S+\.\S+/.test(emailTrim);
    if (!valid) {
      setMsg("Masukkan email yang valid.");
      return;
    }

    if (!baseUrl) {
      setMsg("Konfigurasi URL belum siap. Coba lagi beberapa saat.");
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${baseUrl}/auth/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, { redirectTo });
      if (error) throw error;

      setMsg("Email reset telah dikirim. Periksa inbox/spam kamu.");
    } catch (err) {
      const code = String(err?.status || err?.code || "");
      if (code === "429") {
        setMsg("Terlalu sering meminta reset. Coba lagi beberapa menit lagi.");
      } else {
        setMsg(err?.message || "Gagal mengirim email reset.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-100">
      <main className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-white shadow md:border flex flex-col px-6 pt-10 pb-[env(safe-area-inset-bottom)]">
        <h1 className="text-black text-[22px] font-bold text-center">Lupa Password</h1>
        <p className="text-sm text-gray-600 text-center mt-1">
          Masukkan email akun untuk menerima link reset password.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="block text-black mb-1 font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </label>

          {msg && <p className="text-sm text-center text-rose-600">{msg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D6336C] text-white font-semibold rounded-lg py-3 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="block w-full text-center text-sm text-gray-600 mt-2 hover:underline"
          >
            Kembali ke Masuk
          </button>
        </form>
      </main>
    </div>
  );
}
