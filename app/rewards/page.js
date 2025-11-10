"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
const supabase = getSupabaseClient();


const WA_NUMBER = process.env.NEXT_PUBLIC_SA_WA_NUMBER;

function waLink(voucher, title) {
  const text =
    `Halo kak, saya mau redeem reward:\n` +
    `- Item: ${title}\n` +
    `- Kode Voucher: ${voucher}\n` +
    `Mohon dibantu ya.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function MyRewardsPage() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sendingId, setSendingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id || "";
      const res = await fetch("/api/rewards/claimed", {
        cache: "no-store",
        headers: uid ? { "X-User-Id": uid } : {},
      });
      const json = await res.json().catch(() => []);
      setList(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error("fetch claimed failed:", e);
      setErr("Gagal memuat reward yang sudah diklaim.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);


  const listDedup = useMemo(() => {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const out = [];
    for (const r of list) {
      const key = r.voucher_code || `${r.id || r.claim_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [list]);

  const hasData = listDedup.length > 0;

  const redeemViaWA = useCallback(
    async (item) => {
      const claimId = item.id || item.claim_id;
      const title = item.reward_title ?? item.title ?? "Reward";
      const voucher = item.voucher_code ?? "-";

      window.open(waLink(voucher, title), "_blank", "noopener,noreferrer");

      if (item.sent_to_sa) return;

      setSendingId(claimId);
      setList((cur) =>
        (cur || []).map((x) =>
          (x.id || x.claim_id) === claimId
            ? { ...x, sent_to_sa: true, sent_to_sa_at: new Date().toISOString() }
            : x
        )
      );

      try {
        await supabase.rpc("mark_claim_sent", { p_claim_id: claimId });
      } catch (e) {
        console.error("mark_claim_sent failed:", e);
        setList((cur) =>
          (cur || []).map((x) =>
            (x.id || x.claim_id) === claimId
              ? { ...x, sent_to_sa: false, sent_to_sa_at: null }
              : x
          )
        );
      } finally {
        setSendingId(null);
        setTimeout(load, 600);
      }
    },
    [load]
  );

  return (
    <div className="min-h-[100dvh] bg-neutral-100 flex justify-center">
      <main className="w-full min-h-[100dvh] bg-white flex flex-col md:max-w-[430px] md:shadow md:border pb-[88px]">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white shadow">
          <div className="flex items-center justify-between h-[62px] px-5">
            <div className="flex items-center">
              <Link href="/membership" aria-label="Kembali">
                <Image src="/back.svg" alt="" width={14} height={14} className="w-9 h-7 pr-3" />
              </Link>
              <h1 className="text-[#D6336C] text-lg">Reward Saya</h1>
            </div>
            <button
              onClick={loading ? undefined : load}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Muat..." : "Refresh"}
            </button>
          </div>
        </header>

        {err && (
          <p className="px-4 pt-3 text-xs text-rose-600">
            {err}{" "}
            <button onClick={load} className="underline">
              Coba lagi
            </button>
          </p>
        )}

        {loading && (
          <section className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 bg-white rounded-2xl shadow">
                <div className="w-[88px] h-[66px] bg-gray-100 animate-pulse rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-gray-100 animate-pulse rounded" />
                  <div className="h-3 w-24 bg-gray-100 animate-pulse rounded mt-2" />
                  <div className="flex gap-2 mt-3">
                    <div className="h-7 w-36 bg-gray-100 animate-pulse rounded" />
                    <div className="h-7 w-24 bg-gray-100 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Empty */}
        {!loading && !hasData && (
          <section className="px-4">
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
              <p className="text-sm text-gray-600">Belum ada reward yang diklaim.</p>
              <Link
                href="/membership"
                className="inline-block mt-3 text-white bg-[#D6336C] hover:bg-[#b02f56] rounded-xl px-4 py-2 text-sm"
              >
                Lihat Reward
              </Link>
            </div>
          </section>
        )}

        {/* List */}
        {!loading && hasData && (
          <ul className="mt-3 space-y-3 px-4 pb-4">
            {listDedup.map((raw) => {
              const id = raw.id || raw.claim_id;
              const title = raw.reward_title ?? raw.title ?? raw.rewards?.title ?? "Reward";
              const src =
                raw.reward_image_url ?? raw.image_url ?? raw.image ?? raw.rewards?.image_url ?? "";
              const voucher = raw.voucher_code ?? raw.code ?? "-";
              const created = raw.created_at ? new Date(raw.created_at).toLocaleString("id-ID") : null;
              const sent = !!raw.sent_to_sa;

              return (
                <li key={id} className="bg-white rounded-2xl shadow p-3 flex gap-3">
                  {src ? (
                    <div className="relative w-[88px] h-[66px] overflow-hidden rounded-lg shrink-0">
                      <Image
                        src={src}
                        alt={title}
                        fill
                        sizes="88px"
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;utf8," + encodeURIComponent(placeholderSVG());
                          e.currentTarget.onerror = null;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-[88px] h-[66px] rounded-lg bg-gray-100 grid place-items-center text-[10px] text-gray-500 shrink-0">
                      No image
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-black">{title}</p>
                      {sent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Terkirim ke SA
                        </span>
                      )}
                    </div>

                    {created && (
                      <p className="text-[11px] text-gray-500 mt-0.5">Diklaim: {created}</p>
                    )}

                    <p className="text-xs text-gray-600 mt-1">
                      Kode: <span className="font-mono">{voucher}</span>
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <button
                        onClick={() => redeemViaWA(raw)}
                        disabled={sendingId === id}
                        className={`rounded-lg text-white text-xs px-3 py-2 ${
                          sendingId === id
                            ? "bg-[#25D366]/60 cursor-wait"
                            : "bg-[#25D366] hover:bg-[#1fb157]"
                        }`}
                      >
                        {sent ? "Kirim Ulang via WhatsApp" : "Redeem via WhatsApp"}
                      </button>

                      <button
                        onClick={() => navigator.clipboard.writeText(voucher)}
                        className="rounded-lg bg-gray-100 text-gray-700 text-xs px-3 py-2"
                      >
                        Copy Kode
                      </button>

                      {typeof navigator !== "undefined" && navigator.share && (
                        <button
                          onClick={() =>
                            navigator
                              .share({
                                title: "Voucher YBG",
                                text: `${title} — Kode: ${voucher}`,
                              })
                              .catch(() => {})
                          }
                          className="rounded-lg bg-gray-100 text-gray-700 text-xs px-3 py-2"
                        >
                          Share
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function placeholderSVG() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="88" height="66">
  <rect width="100%" height="100%" fill="#F3F4F6"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-size="10" fill="#9CA3AF" font-family="sans-serif">No image</text>
</svg>`;
}
