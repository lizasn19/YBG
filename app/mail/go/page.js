"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function MailGoPage() {
  const params = useSearchParams();
  const next = useMemo(() => {
    const raw = params.get("next") || "";
    try { return decodeURIComponent(raw); } catch { return raw; }
  }, [params]);

  const onContinue = () => {
    if (next) window.location.href = next;
  };

  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <div className="max-w-md w-full bg-white border shadow p-6 rounded-xl text-center">
        <h1 className="text-lg font-semibold mb-2">Buka tautan aman</h1>
        <p className="text-sm text-gray-600 mb-4">
          Klik tombol di bawah untuk melanjutkan. (Langkah ini mencegah
          pemindaian otomatis email menghabiskan tautan satu-kali.)
        </p>
        <button
          onClick={onContinue}
          className="px-4 py-2 rounded-lg bg-[#D6336C] text-white font-medium"
        >
          Lanjutkan
        </button>

        {!next && (
          <p className="text-xs text-rose-600 mt-3">
            Tautan tidak ditemukan. Minta email baru lalu coba lagi.
          </p>
        )}
      </div>
    </main>
  );
}
