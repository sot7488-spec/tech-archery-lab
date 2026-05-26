"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("sot7488@gmail.com");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      window.location.assign("/");
    } catch (err) {
      console.error("ERROR GENERAL:", err);
      setErrorMsg("Error inesperado al iniciar sesión");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-white">
      <div className="absolute inset-0 tal-radial tal-grid-bg" />
      <div className="absolute -top-32 right-[-120px] h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-[-140px] left-[-120px] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-slate-950/70 shadow-[0_0_80px_rgba(34,211,238,0.18)] backdrop-blur-xl md:grid-cols-2">
        <div className="hidden border-r border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 p-10 md:block">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-cyan-300">
            TECH ARCHERY LAB
          </p>

          <h1 className="mt-8 text-5xl font-black leading-none tracking-tight">
            Archery
            <span className="block tal-text-glow text-cyan-300">
              Performance
            </span>
            Lab
          </h1>

          <p className="mt-6 text-sm leading-7 text-slate-300">
            Plataforma para control de atletas, entrenamientos, equipamiento,
            tuning y rendimiento deportivo.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-cyan-400/20 bg-white/5 p-4">
              <p className="text-xs font-black text-cyan-300">DATA</p>
              <p className="mt-2 text-2xl font-black">Analytics</p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-white/5 p-4">
              <p className="text-xs font-black text-cyan-300">COACH</p>
              <p className="mt-2 text-2xl font-black">Training</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-8 md:p-10">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Acceso privado
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight">
              Iniciar sesión
            </h2>

            <p className="mt-3 text-sm text-slate-400">
              Ingresa al centro de gestión deportiva TAL.
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-medium text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Contraseña"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-medium text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {errorMsg && (
              <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-4 font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar al portal"}
            </button>

            <Link
              href="/register"
              className="block rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-center text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
            >
              Crear cuenta nueva
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}