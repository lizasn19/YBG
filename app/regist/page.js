"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function normPhoneToE164(idPhone = "") {
  let p = (idPhone || "").trim().replace(/\s+/g, "");
  if (!p) return "";
  if (p.startsWith("+")) return p;
  if (p.startsWith("0")) return "+62" + p.slice(1);
  return p;
}
const isEmail = (v = "") => /\S+@\S+\.\S+/.test(String(v).trim());

export default function RegistPage() {
  const router = useRouter();

  // simpan email/phone yang sudah tervalidasi agar tidak hilang saat ganti step
  const emailRef = useRef("");
  const phoneRef = useRef("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });

  const [step, setStep] = useState("fill"); // fill | otp | done
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  // 1) Kirim OTP ke email — TANPA magic link
  async function handleSendOtp(e) {
    e.preventDefault();
    setMsg("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phoneE164 = normPhoneToE164(form.phone);
    const pwd = form.password;
    const confirm = form.confirm;

    if (!name) return setMsg("Nama wajib diisi.");
    if (!email || !isEmail(email)) return setMsg("Email tidak valid.");
    if (!pwd || pwd.length < 8) return setMsg("Password minimal 8 karakter.");
    if (pwd !== confirm) return setMsg("Konfirmasi password tidak sama.");

    setLoading(true);
    try {
      // simpan agar tidak hilang saat step berubah
      emailRef.current = email;
      phoneRef.current = phoneE164;

      // PENTING:
      // - gunakan signInWithOtp (bukan signUp)
      // - JANGAN set emailRedirectTo => tidak jadi magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: name,
            phone: phoneE164,
            phone_verified: false,
          },
        },
      });
      if (error) throw error;

      setStep("otp");
      setMsg("Kode OTP sudah dikirim ke email kamu. Cek inbox/spam.");
    } catch (err) {
      console.error(err);
      // beberapa instance supabase melempar objek error yg beda-beda
      const code = String(err?.status || err?.code || "");
      if (code === "429") {
        setMsg("Terlalu sering mengirim OTP. Coba lagi beberapa menit lagi.");
      } else {
        setMsg(
          err?.message ||
            "Gagal mengirim OTP. Pastikan SMTP aktif & template Magic link menampilkan {{ .Token }}."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // 2) Verifikasi OTP → set password + metadata
  async function handleVerifyAndFinish(e) {
    e.preventDefault();
    setMsg("");

    const code = (otp || "").replace(/\D/g, "");
    if (!code || code.length < 6) return setMsg("Masukkan kode OTP (6 digit).");

    setLoading(true);
    try {
      // verifikasi kode (akan sekaligus membuat sesi login)
      const { error: verErr } = await supabase.auth.verifyOtp({
        email: emailRef.current,
        token: code,
        type: "email", // Wajib 'email' untuk OTP email
      });
      if (verErr) throw verErr;

      // setelah verify berhasil, kita bisa set password & metadata
      const { error: updErr } = await supabase.auth.updateUser({
        password: form.password,
        data: {
          full_name: form.name.trim(),
          phone: phoneRef.current,
          phone_verified: !!phoneRef.current,
        },
      });
      if (updErr) throw updErr;

      setStep("done");
      setMsg("Registrasi berhasil! Mengalihkan ke halaman login…");
      router.replace("/login");
    } catch (err) {
      console.error(err);
      // jika project-mu masih menyalakan "Confirm email", verifyOtp bisa gagal/tidak membuat sesi.
      // Matikan "Confirm email" di Auth → Sign in/Providers untuk alur OTP-only.
      setMsg(
        err?.message ||
          "Verifikasi gagal. Pastikan kodenya benar, belum kedaluwarsa, dan 'Confirm email' dimatikan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (loading) return;
    setMsg("");
    const email = emailRef.current || form.email.trim().toLowerCase();
    if (!isEmail(email)) return setMsg("Email tidak valid.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: form.name.trim(),
            phone: phoneRef.current || normPhoneToE164(form.phone),
            phone_verified: false,
          },
        },
      });
      if (error) throw error;
      setMsg("Kode OTP dikirim ulang. Cek inbox/spam.");
    } catch (err) {
      console.error(err);
      const code = String(err?.status || err?.code || "");
      if (code === "429") {
        setMsg("Terlalu sering mengirim OTP. Coba sebentar lagi.");
      } else {
        setMsg(err?.message || "Gagal mengirim ulang OTP.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-100">
      <main className="mx-auto w-full max-w-[430px] bg-white shadow md:border px-6 pt-10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col items-center">
          <img src="/logo_ybg.png" alt="YBG" className="w-28 h-28" />
          <h1 className="text-black text-[22px] font-semibold">Daftar Akun YBG</h1>
          <p className="text-sm text-gray-600 mt-1 text-center">
            Verifikasi akun via <b>OTP Email</b>.
          </p>
        </div>

        {step === "fill" && (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            <Input label="Nama Lengkap" name="name" value={form.name} onChange={onChange} />
            <Input label="Email" type="email" name="email" value={form.email} onChange={onChange} />
            <Input
              label="Nomor Handphone (opsional)"
              type="tel"
              name="phone"
              placeholder="08xxx atau +62xxx"
              value={form.phone}
              onChange={onChange}
            />
            <Input label="Password" type="password" name="password" value={form.password} onChange={onChange} />
            <Input label="Konfirmasi Password" type="password" name="confirm" value={form.confirm} onChange={onChange} />

            {msg && <p className="text-sm text-center text-rose-600">{msg}</p>}

            <button
              disabled={loading}
              className="w-full bg-[#D6336C] text-white font-semibold rounded-lg py-3 disabled:opacity-60"
            >
              {loading ? "Mengirim OTP..." : "Kirim OTP ke Email"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyAndFinish} className="mt-6 space-y-4">
            <Input
              label="Kode OTP (6 digit)"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />

            {msg && <p className="text-sm text-center text-rose-600">{msg}</p>}

            <button
              disabled={loading}
              className="w-full bg-[#D6336C] text-white font-semibold rounded-lg py-3 disabled:opacity-60"
            >
              {loading ? "Memverifikasi..." : "Verifikasi & Buat Akun"}
            </button>

            <button
              type="button"
              onClick={resendOtp}
              disabled={loading}
              className="w-full border border-[#D6336C] text-[#D6336C] font-semibold rounded-lg py-3 disabled:opacity-60"
            >
              Kirim Ulang OTP
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="mt-6">
            <p className="text-center text-emerald-600 font-medium">
              Registrasi berhasil! Silakan login.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block text-sm">
      {label && <span className="block text-black mb-1 font-medium">{label}</span>}
      <input
        {...props}
        className="w-full border border-[#D1D5DB] rounded-lg px-3 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
      />
    </label>
  );
}
