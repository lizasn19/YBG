"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export const dynamic = "force-dynamic";

function ResetContent() {
  const router = useRouter();
  const q = useSearchParams();
  const supabase = supabaseBrowser; 

  const [status, setStatus] = useState("checking"); 
  const [msg, setMsg] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window !== "undefined" && window.location.hash.includes("error=")) {
        const h = new URLSearchParams(window.location.hash.slice(1));
        if (!cancelled) {
          setMsg(h.get("error_description") || "Tautan tidak valid atau kadaluarsa.");
          setStatus("error");
        }
        return;
      }

      const code = q.get("code") || q.get("oobCode");
      if (!code) {
        setMsg("Tautan tidak valid atau kadaluarsa.");
        setStatus("error");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;

      if (error) {
        setMsg(error.message || "Tautan tidak valid atau kadaluarsa.");
        setStatus("error");
        return;
      }

      setStatus("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [q]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (pw1.length < 8) return setMsg("Password minimal 8 karakter.");
    if (pw1 !== pw2) return setMsg("Konfirmasi password tidak sama.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setLoading(false);

    if (error) {
      setMsg(error.message || "Gagal memperbarui password.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (status !== "ready") {
    return (
      <div className="min-h-[100dvh] bg-neutral-100">
        <main className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-white shadow md:border flex items-center justify-center p-6">
          <p className="text-sm text-center text-rose-600">
            {msg || "Memvalidasi tautan…"}
          </p>
        </main>
      </div>
    );
  }

  // Form reset
  return (
    <div className="min-h-[100dvh] bg-neutral-100">
      <main className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-white shadow md:border flex flex-col px-6 pt-10 pb-[env(safe-area-inset-bottom)]">
        <h1 className="text-black text-[22px] font-bold text-center">Reset Password</h1>
        <p className="text-sm text-gray-600 text-center mt-1">
          Masukkan password barumu di bawah ini.
        </p>

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
            {loading ? "Memproses…" : "Simpan Password"}
          </button>
        </form>
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
