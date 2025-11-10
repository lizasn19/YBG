"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const BRAND_SEED = [
  { id: "b1", name: "YSL",         image: "/brand/ysl.png" },
  { id: "b2", name: "Prada",       image: "/brand/prada.png" },
  { id: "b3", name: "Miu Miu",     image: "/brand/miumiu.png" },
  { id: "b4", name: "Balenciaga",  image: "/brand/balenciaga.png" },
  { id: "b5", name: "LV",          image: "/brand/LV.png" },
  { id: "b6", name: "Longchamp",   image: "/brand/longchamp.png" },
];

export default function BrandCarousel({ title = "Brand", useApi = false }) {
  const [brands, setBrands] = useState(BRAND_SEED);
  const [loading, setLoading] = useState(useApi);

  //dari API
  useEffect(() => {
    if (!useApi) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/brands", { cache: "no-store" });
        const data = await res.json();
        setBrands(Array.isArray(data) ? data : []);
      } catch {
        setBrands([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [useApi]);

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-baseline justify-between px-4">
        <h2 className="text-[18px] font-bold text-black">{title}</h2>
        <Link href="/brands" className="text-sm text-[#D6336C]">
          Lihat Semua
        </Link>
      </div>

      {/* Horizontal scroll */}
      <ul
        className="mt-2 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ scrollbarWidth: "none" }}
      >
        <style jsx>{`ul::-webkit-scrollbar{display:none;}`}</style>

        {(loading ? Array.from({ length: 6 }) : brands).map((b, i) => (
          <li key={b?.id ?? i} className="snap-start shrink-0 w-[90px]">
            {loading ? (
              <div className="animate-pulse w-[90px]">
                <div className="h-[90px] w-[90px] rounded-2xl bg-gray-200" />
                <div className="mt-2 h-3 w-14 rounded bg-gray-200" />
              </div>
            ) : (
              <Link
                href={`/product/${b.id}`}
                className="block text-center"
              >
                <div className="relative w-[90px] h-[90px] overflow-hidden rounded-2xl bg-white ring-1 ring-pink-100 grid place-items-center">
                  <Image
                    src={b.image}
                    alt={b.name}
                    fill
                    className="object-contain p-3"
                    sizes="90px"
                    priority={i === 0}
                  />
                </div>
                <p className="mt-2 text-[12px] text-gray-700 line-clamp-1">{b.name}</p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
