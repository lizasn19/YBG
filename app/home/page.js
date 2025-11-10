"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import BannerCarousel from "../components/bannerCarousel";
import HorizontalProductList from "../components/productCard";
import BottomNavigation from "../components/bottomnav";
import { supabase } from "@/lib/supabaseClient";

// Urut dari terendah ke tertinggi (samakan dengan halaman Membership)
const TIERS = [
  { id: "friend",  name: "FRIEND",  threshold: 25 },
  { id: "bestie",  name: "BESTIE",  threshold: 50 },
  { id: "sisters", name: "SISTERS", threshold: 100 },
];

function getTierFromPoints(points) {
  if (points < TIERS[0].threshold) return "—";
  let current = TIERS[0];
  for (const t of TIERS) if (points >= t.threshold) current = t;
  return current.name;
}

export default function Beranda() {
  const [name, setName] = useState("User");
  const [tier, setTier] = useState("—");
  const [points, setPoints] = useState(0);

  const loadUser = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("getUser error:", error);
        setName("User"); setTier("—"); setPoints(0);
        return null;
      }
      const user = data?.user ?? null;
      if (!user) {
        setName("User"); setTier("—"); setPoints(0);
        return null;
      }
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split("@")[0] : "User");
      setName(displayName);
      return user.id;
    } catch (e) {
      console.error("loadUser failed:", e);
      setName("User"); setTier("—"); setPoints(0);
      return null;
    }
  }, []);

  const loadPoints = useCallback(async (userId) => {
    try {
      if (!userId) return;
      const { data, error } = await supabase
        .from("point_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.error("point_balances error:", error);
        setPoints(0); setTier("—");
        return;
      }
      const balance = Number(data?.balance ?? 0);
      setPoints(balance);
      setTier(getTierFromPoints(balance));
    } catch (e) {
      console.error("loadPoints failed:", e);
      setPoints(0); setTier("—");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const uid = await loadUser();
      await loadPoints(uid);
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      const uid = await loadUser();
      await loadPoints(uid);
    });

    return () => {
      try { authListener?.subscription?.unsubscribe?.(); } catch {}
    };
  }, [loadUser, loadPoints]);

  return (
    <div className="min-h-[100dvh] bg-neutral-100 flex justify-center">
      {/* Tambahkan overflow-y-auto + padding-bottom agar konten tidak ketutup bottom nav */}
      <main className="w-full min-h-[100dvh] bg-white flex flex-col md:max-w-[430px] md:shadow md:border overflow-y-auto pb-[80px]">
        {/* Top bar */}
        <div className="flex items-center justify-between bg-white shadow p-4 sticky top-0 z-10">
          <h2 className="text-[#D6336C] p-5 py-3">Hi, {name}</h2>

          <div className="flex items-center gap-2">
            <Image src="/membership.svg" alt="poin" width={26} height={20} className="w-8 h-8" />
            <div className="leading-tight text-[#D6336C] text-sm">
              <p>YB Tier Kamu</p>
              <h2 className="font-bold">{tier}</h2>
            </div>
          </div>

          <div className="text-[#D6336C] text-sm leading-tight">
            <p>Poin Kamu</p>
            <h2 className="font-bold">{points}</h2>
          </div>

          <Link
            href="/cart"
            aria-label="Keranjang"
            title="Keranjang"
            className="p-2 rounded-full border border-pink-200 text-pink-600 hover:bg-pink-50 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 18a2 2 0 1 0 2 2a2 2 0 0 0-2-2m10 0a2 2 0 1 0 2 2a2 2 0 0 0-2-2M7.2 14h9.45a2 2 0 0 0 1.92-1.47L20.8 7H6.21L5.27 4H2v2h2.27z"
              />
            </svg>
          </Link>
        </div>

        {/* Banner */}
        <div className="w-full">
          <BannerCarousel />
        </div>

        {/* List Product */}
        <div className="mt-2 mb-4">
          <HorizontalProductList title="YBG Exclusive" />
        </div>

        <div className="mb-6">
          <HorizontalProductList title="Upcoming Product on YBG" />
        </div>

        <BottomNavigation />
      </main>
    </div>
  );
}
