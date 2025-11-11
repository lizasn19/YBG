"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
const supabase = supabaseBrowser;

export default function ForgotPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState(() => sp.get("email") || "");
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
    if (!valid) return setMsg("Masukkan email yang valid.");
    if (!baseUrl) return setMsg("Konfigurasi URL belum siap. Coba lagi beberapa saat.");

    setLoading(true);
    try {
      // Simpan untuk prefill di halaman OTP & login
      if (typeof window !== "undefined") localStorage.setItem("reset_email", emailTrim);

      // Kirim email reset; template WAJIB menampilkan {{ .Token }}
      const redirectTo = `${baseUrl}/auth/otp`;
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, { redirectTo });
      if (error) throw error;

      setMsg("Kode reset (6 digit) telah dikirim ke email kamu. Cek inbox/spam, lalu masukkan kodenya di halaman berikut.");
      // Arahkan ke form OTP dengan membawa email
      router.push(`/auth/otp?email=${encodeURIComponent(emailTrim)}`);
    } catch (err) {
      setMsg(err?.message || "Gagal mengirim email reset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-100">
      <main className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-white shadow md:border flex flex-col px-6 pt-10 pb-[env(safe-area-inset-bottom)]">
        <h1 className="text-black text-[22px] font-bold text-center">Lupa Password</h1>
        <p className="text-sm text-gray-600 text-center mt-1">
          Ketik email akun. Kami akan kirim <b>kode 6 digit</b> ke emailmu.
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
            {loading ? "Mengirim..." : "Kirim Kode Reset"}
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
