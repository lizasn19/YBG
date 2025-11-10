"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

const SLIDES = [
{ title:"Gabung Membership YBG", 
    body:"Lebih dari sekadar katalog, temukan pengalaman belanja + rewards eksklusif.", 
    image:"/slides/info1.png",
    duration:10000,
},

{ title:"Kumpulkan Poin, Tukar Hadiah", 
    body:"Setiap transaksi & aktivitas bisa jadi poin. Tukar dengan voucher, merch, atau hadiah spesial YBG.", 
    image:"/slides/info2.png", 
    duration:10000, 
},

{ title:"Event & Promo Hanya untuk Kamu", 
    body:"Dari diskon spesial sampai undangan event eksklusif, semua hanya untuk member YBG.", 
    image:"/slides/info3.png", 
    duration:10000,
 },

];

export default function InfoCarousel() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const L = SLIDES.length;
  const wrap = (idx) => ((idx % L) + L) % L;

  useEffect(() => {
    const d = SLIDES[i]?.duration ?? 10000;
    const t = setTimeout(() => setI((n) => wrap(n + 1)), d);
    return () => clearTimeout(t);
  }, [i, L]);

  if (!L) return null;
  const slide = SLIDES[i];

  const nextSlide = () => setI((n) => wrap(n + 1));
  const prevSlide = () => setI((n) => wrap(n - 1));

  return (
    // Latar abu-abu di desktop; container ponsel di tengah
    <div style={{ minHeight: "100dvh", background: "#F3F4F6" }}>
      <div
        style={{
          width: "100%",
          minHeight: "100dvh",
          background: "#E6B8C8",                    
          padding: "24px 16px",                     
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setI(idx)}
              style={{
                width: 30, height: 4, borderRadius: 2,
                background: idx === i ? "#D6336C" : "white",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Gambar: tinggi responsif 55% layar */}
        <div style={{ position: "relative", width: "100%", height: "40vh", marginTop: 40 }}>
          <Image src={slide.image} alt={slide.title} fill style={{ objectFit: "contain" }} priority />
        </div>

        {/* Teks */}
        <h2 style={{ marginTop: 12, color: "#000", fontWeight: 600, fontSize: 22, textAlign: "center" }}>
          {slide.title}
        </h2>
        <p style={{ color: "#000", textAlign: "center" }}>{slide.body}</p>

        {/* Tombol: full-width di “ponsel” */}
        <div style={{ marginTop: 150, display: "flex", gap: 12 }}>
          {i > 0 && (
            <button
              onClick={prevSlide}
              style={{
                flex: 1, padding: "5px 10px",
                background: "#fff", color: "#111",
                border: "1px solid #D6336C", borderRadius: 8, cursor: "grab",
              }}
            >
              Sebelumnya
            </button>
          )}
          <button
            onClick={() => (i === L - 1 ? router.push("/login") : nextSlide())}
            style={{
              flex: 1, padding: "5px 10px",
              background: "#D6336C", color: "#fff",
              border: "none", borderRadius: 8, cursor: "grab",
            }}
          >
            {i === L - 1 ? "Mulai Sekarang" : "Selanjutnya"}
          </button>
        </div>
      </div>
    </div>
  );
}
