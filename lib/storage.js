// lib/storage.js
import { supabase } from "./supabaseClient";

/** Gabungkan segmen path dengan aman (hindari slash ganda). */
function joinPath(...parts) {
  return parts
    .filter(Boolean)
    .map((p) => String(p).trim().replace(/^\/+|\/+$/g, "")) // hapus slash berlebih
    .join("/");
}

/** Encode tiap segmen path agar karakter spesial (spasi, %, #, dll) aman. */
function encodePath(p) {
  return p
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

/**
 * Dapatkan URL publik dari Supabase Storage.
 * Jika path relatif → buatkan URL lengkap.
 */
export function publicUrl(bucket, path) {
  if (!path) return null;

  // Bersihkan path dari karakter aneh (spasi, newline, CR, tab)
  const clean = String(path)
    .trim()
    .replace(/[\r\n\t]+/g, "") // hapus karakter tersembunyi
    .replace(/^\/+/, ""); // hapus slash depan

  const encoded = encodePath(clean);

  const { data, error } = supabase.storage.from(bucket).getPublicUrl(encoded);
  if (error) {
    console.warn("⚠️ Supabase publicUrl error:", error.message);
    return null;
  }

  return data?.publicUrl || null;
}

/**
 * Konversi path gambar menjadi URL publik yang valid.
 * - Jika sudah URL penuh (http/https) → kembalikan langsung.
 * - Jika relatif → ubah ke public URL Supabase.
 */
export function toPublicUrl(bucket, value) {
  if (!value) return null;

  const s = String(value).trim();

  // Jika value sudah URL absolut, langsung return
  if (/^https?:\/\//i.test(s)) return s;

  // Jika mengandung karakter newline → bersihkan
  const clean = s.replace(/[\r\n\t]+/g, "").replace(/^\/+/, "");

  return publicUrl(bucket, clean);
}
