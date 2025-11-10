"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
const supabase = supabaseBrowser;


/** Simpan/ambil guest id lokal untuk pengguna yang tidak login */
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

/** Encode ke URL untuk WhatsApp query */
function enc(s) {
  return encodeURIComponent(String(s ?? ""));
}

/**
 * Props:
 * - reward: { id, title, image_url, cost, stock }
 * - points?: number (poin yang ditampilkan di UI saat ini)
 * - saWaNumber?: string (opsi override; misal "62812xxxxxxx")
 *   default ambil dari process.env.NEXT_PUBLIC_SA_WA_NUMBER
 */
export default function Claim({
  reward,
  points: parentPoints = 0,
  saWaNumber,
}) {
  const [opening, setOpening] = useState(false);

  const points = Number(parentPoints ?? 0);
  const stock  = Number(reward?.stock ?? 0);
  const cost   = Number(reward?.cost ?? 0);

  // tombol aktif selama stok masih ada (tidak memeriksa poin di sisi klien)
  const canClick = useMemo(() => {
    if (!reward) return false;
    if (stock <= 0) return false;
    return true;
  }, [reward, stock]);

  async function handleClick() {
    if (opening || !canClick) return;
    setOpening(true);
    try {
      // data identitas (kalau login)
      const { data: u } = await supabase.auth.getUser();
      const email = u?.user?.email ?? null;
      const uid   = u?.user?.id ?? null;

      // cadangan identitas kalau belum login
      const guestId = !uid ? getOrCreateGuestId() : null;

      const now = new Date();
      const when = now.toLocaleString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      // nomor WA SA
      const wa = (saWaNumber || process.env.NEXT_PUBLIC_SA_WA_NUMBER || "").replace(/[^0-9]/g, "");
      if (!wa) {
        alert("Nomor WhatsApp SA belum diset (NEXT_PUBLIC_SA_WA_NUMBER).");
        return;
      }

      const lines = [
        "Halo Admin SA, saya ingin menukarkan reward:",
        "",
        `• Reward  : ${reward?.title ?? "-"} (${cost} poin)`,
        `• RewardID: ${reward?.id ?? "-"}`,
        "",
        `• Akun    : ${email ?? "Belum login"}`,
        `• UserID  : ${uid ?? "-"}`,
        guestId ? `• GuestID : ${guestId}` : null,
        `• Poin UI : ${Number.isFinite(points) ? points : 0}`,
        `• Waktu   : ${when}`,
        "",
        "Mohon bantu proses ya 🙏",
      ].filter(Boolean);

      const url = `https://wa.me/${wa}?text=${enc(lines.join("\n"))}`;

      // buka WA (tab baru)
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setOpening(false);
    }
  }

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
        <h3 className="text-sm font-medium">{reward?.title || "Reward"}</h3>
        <p className="text-sm text-pink-600">
          {Number.isFinite(cost) ? cost : 0} point · Stok {Number.isFinite(stock) ? stock : 0}
        </p>
      </div>

      <div className="mt-3">
        <button
          onClick={handleClick}
          disabled={!canClick || opening}
          className={`w-full h-11 rounded-xl text-white font-medium transition ${
            !canClick
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : opening
              ? "bg-[#D6336C]/70 cursor-wait"
              : "bg-[#D6336C] hover:bg-[#b02f56]"
          }`}
        >
          {stock <= 0
            ? "Stok Habis"
            : opening
            ? "Membuka WhatsApp…"
            : "Tukarkan via WhatsApp"}
        </button>
      </div>
    </div>
  );
}
