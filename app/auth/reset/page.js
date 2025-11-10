"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false); // sudah punya recovery session?
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setMsg("");
      // 1) Jika ada ?code= di URL (email OTP style), tukar jadi session
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !cancelled) {
          setMsg("Link reset tidak valid atau kadaluarsa.");
          return;
        }
      }

      // 2) Cek apakah kita sudah punya session (recovery)
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setReady(!!data?.session);
      if (!data?.session && !cancelled) {
        setMsg("Sesi pemulihan tidak ditemukan. Ulangi proses lupa password.");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!pw1 || pw1.length < 8) {
      setMsg("Password minimal 8 karakter.");
      return;
    }
    if (pw1 !== pw2) {
      setMsg("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;

      setMsg("Password berhasil diubah. Silakan login ulang.");
      // opsional: sign out supaya bersih
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (err) {
      setMsg(err?.message || "Gagal memperbarui password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-100">
      <main className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-white shadow md:border flex flex-col px-6 pt-10 pb-[env(safe-area-inset-bottom)]">
        <h1 className="text-black text-[22px] font-bold text-center">Reset Password</h1>
        <p className="text-sm text-gray-600 text-center mt-1">
          Masukkan password barumu di bawah ini.
        </p>

        {!ready ? (
          <div className="mt-6 text-center text-sm text-rose-600">{msg || "Menyiapkan sesi..."}</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="block text-black mb-1 font-medium">Password baru</span>
              <input
                type="password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </label>

            <label className="block text-sm">
              <span className="block text-black mb-1 font-medium">Ulangi password baru</span>
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </label>

            {msg && <p className="text-sm text-center text-rose-600">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D6336C] text-white font-semibold rounded-lg py-3 disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Simpan Password"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
