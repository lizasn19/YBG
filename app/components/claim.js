// app/components/claim.js
"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// bikin/stored guest id (untuk user non-login)
function getOrCreateGuestId() {
  try {
    const k = "ybg-guest-id";
    let v = localStorage.getItem(k);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(k, v);
    }
    return v;
  } catch {
    return null;
  }
}

export default function Claim({
  reward,
  onClaimed,
  points: parentPoints = 0,
}) {
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [waNumber, setWaNumber] = useState(process.env.NEXT_PUBLIC_SA_WA_NUMBER || "");

  // ambil email user jika login, dan siapkan guestId
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUserEmail(data?.user?.email ?? null);
      } catch {}
      setGuestId(getOrCreateGuestId());
    })();
  }, []);

  const points = Number(parentPoints ?? 0);
  const stock  = Number(reward?.stock ?? 0);
  const cost   = Number(reward?.cost ?? 0);

  // Boleh tetap lakukan guard UI: stok > 0
  const canClaim = useMemo(() => {
    if (!reward) return false;
    if (stock <= 0) return false;
    return true;
  }, [reward, stock]);

  const buildWaHref = () => {
    const idInfo = userEmail ? `Email: ${userEmail}` : `GuestID: ${guestId || "-"}`;
    const title = reward?.title || "Reward";
    const rid = reward?.id || "-";

    // Pesan yang dikirim ke SA (silakan sesuaikan sesuai SOP SA)
    const text = [
      "Halo Kak Admin SA, saya mau klaim voucher 🙏",
      `• Akun: ${idInfo}`,
      `• Reward: ${title} (ID: ${rid})`,
      `• Biaya Poin: ${isFinite(cost) ? cost : 0}`,
      `• Poin Saat Ini (UI): ${isFinite(points) ? points : "-"}`,
      "",
      "Mohon proses penukaran ya. Terima kasih! 💖",
    ].join("\n");

    const encoded = encodeURIComponent(text);
    const phone = (waNumber || "").replace(/^\+/, ""); // hilangkan '+' jika ada
    // pakai wa.me biar simpel
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  const handleClaim = async () => {
    if (processing) return;
    setLocalError(null);

    if (!waNumber) {
      setLocalError("Nomor WhatsApp SA belum dikonfigurasi.");
      alert("Nomor WhatsApp SA belum dikonfigurasi.");
      return;
    }
    if (!canClaim) return;

    setProcessing(true);
    try {
      // langsung redirect ke WhatsApp (tab baru)
      const url = buildWaHref();
      window.open(url, "_blank", "noopener,noreferrer");

      // callback UI (refresh poin/daftar reward bila perlu)
      try { if (typeof onClaimed === "function") await onClaimed(); } catch {}

      // catatan: tidak ada pencatatan otomatis di DB.
      // SA yang akan memproses poin & stok secara manual via Supabase.
    } catch (e) {
      console.error("claim (WA) error:", e);
      const msg = "Gagal membuka WhatsApp. Coba lagi.";
      setLocalError(msg);
      alert(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-3 shadow">
      <div className="rounded-lg overflow-hidden">
        {reward?.image_url ? (
          <div className="relative w-full h-40 md:h-44 rounded-lg overflow-hidden">
            <Image
              src={reward.image_url}
              alt={reward?.title || "Reward"}
              fill
              sizes="(max-width:430px) 100vw, 430px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-40 md:h-44 bg-gray-100 rounded-lg" />
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm text-black font-medium">{reward?.title || "Reward"}</h3>
        <p className="text-sm text-pink-600">
          {Number.isFinite(cost) ? cost : 0} point
        </p>
      </div>

      <div className="mt-3">
        <button
          onClick={handleClaim}
          disabled={!canClaim || processing}
          className={`w-full h-11 rounded-xl text-white font-medium transition ${
            stock <= 0 || !canClaim
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : processing
              ? "bg-[#D6336C]/70 cursor-wait"
              : "bg-[#D6336C] hover:bg-[#b02f56]"
          }`}
        >
          {stock <= 0
            ? "Stok Habis"
            : processing
            ? "Membuka WhatsApp..."
            : "Klaim via WhatsApp"}
        </button>
      </div>

      {localError && <p className="mt-2 text-xs text-rose-600">{localError}</p>}
    </div>
  );
}
