"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// Komponen yang memakai useSearchParams dibungkus Suspense
function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  const [ready, setReady] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setMsg("");

      // Jika env belum tersedia saat prerender, jangan lanjutkan
      if (!supabase) {
        if (!cancelled) setMsg("Konfigurasi belum siap. Coba lagi beberapa saat.");
        return;
      }

      // Ambil code dari URL dan tukar sesi
      const code = searchParams.get("code") || searchParams.get("oobCode");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && !cancelled) {
          setMsg("Link reset tidak valid atau kadaluarsa.");
          return;
        }
      }

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
  }, [searchParams, supabase]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!pw1 || pw1.length < 8) return setMsg("Password minimal 8 karakter.");
    if (pw1 !== pw2) return setMsg("Konfirmasi password tidak sama.");
    if (!supabase) return setMsg("Konfigurasi belum siap. Coba lagi beberapa saat.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;

      setMsg("Password berhasil diubah. Silakan login ulang.");
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
          <div className="mt-6 text-center text-sm text-rose-600">
            {msg || "Menyiapkan sesi..."}
          </div>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Memuat…</div>}>
      <ResetContent />
    </Suspense>
  );
}
