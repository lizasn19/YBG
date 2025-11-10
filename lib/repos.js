// lib/repos.js
import { supabase } from "@/lib/supabaseClient";
import { toPublicUrl } from "@/lib/storage";

export async function fetchBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("id,nama,slug,logo_url,is_active")
    .eq("is_active", true)
    .order("nama", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((b) => {
    // kolom menyimpan path relatif seperti: "brand/LV.png"
    const rawPath = (b?.logo_url ?? "").toString().trim(); // << pastikan "brand/.."
    return {
      id: b.id,
      name: b.nama,
      slug: b.slug,
      // jadikan URL publik Supabase; kalau sudah http(s) biarkan
      logoSrc: toPublicUrl("Public", rawPath) || null,
    };
  });
}
