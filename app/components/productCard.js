"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
const supabase = getSupabaseClient();


export default function HorizontalProductList({ title }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // ambil dari tabel ybg_exclusive
        const { data, error } = await supabase
          .from("ybg_exclusive")
          .select("id, nama, image_url, price, brand_slug, kategori, deskripsi")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Fetch ybg_exclusive error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading)
    return (
      <div className="px-4">
        <h2 className="text-[#D6336C] font-semibold mb-2">{title}</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[140px] h-[180px] bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );

  if (products.length === 0) return null;

  return (
    <div className="px-4">
      <h2 className="text-[#D6336C] font-semibold mb-2">{title}</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.brand_slug || p.kategori || "detail"}/${p.id}`}
            className="min-w-[140px] max-w-[140px] bg-white rounded-xl border shadow-sm overflow-hidden shrink-0"
          >
            <div className="relative w-full h-[160px]">
              <Image
                src={p.image_url || "/placeholder.png"}
                alt={p.nama}
                fill
                sizes="(max-width: 430px) 140px"
                className="object-cover"
              />
            </div>
            <div className="p-2">
              <p className="text-[13px] font-medium text-gray-900 line-clamp-2">
                {p.nama}
              </p>
              {p.price && (
                <p className="text-[12px] text-[#D6336C] font-semibold mt-1">
                  Rp {Number(p.price).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
