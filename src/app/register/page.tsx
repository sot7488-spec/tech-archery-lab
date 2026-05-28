"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Club = {
  id: string;
  name: string;
};

export default function RegisterPage() {
  const [clubs, setClubs] = useState<Club[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [clubId, setClubId] = useState("");
  const [role, setRole] = useState("athlete");

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClubs() {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setClubs(data ?? []);
    }

    loadClubs();
  }, []);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMsg("");
    setLoading(true);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMsg("Escribe tu nombre completo.");
      setLoading(false);
      return;
    }

    if (!cleanEmail) {
      setErrorMsg("Escribe tu correo electrónico.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (!clubId) {
      setErrorMsg("Selecciona un club.");
      setLoading(false);
      return;
    }

    if (role !== "athlete" && role !== "coach") {
      setErrorMsg("Rol no permitido.");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              role,
              club_id: clubId,
            },
          },
        });

      if (authError) {
        setErrorMsg(authError.message);
        setLoading(false);
        return;
      }

      const authUser = authData.user;

      if (!authUser) {
        setErrorMsg("No se pudo crear el usuario en Auth.");
        setLoading(false);
        return;
      }

      const { error: userError } = await supabase.from("users").insert({
        id: authUser.id,
        name: cleanName,
        email: cleanEmail,
        role,
        club_id: clubId,
        is_active: true,
      });

      if (userError) {
        setErrorMsg(userError.message);
        setLoading(false);
        return;
      }

      if (role === "athlete") {
        const { error: athleteError } = await supabase
          .from("athlete_profiles")
          .insert({
            user_id: authUser.id,
            club_id: clubId,
            bow_type: "recurvo",
          });

        if (athleteError) {
          setErrorMsg(athleteError.message);
          setLoading(false);
          return;
        }
      }

      setMessage("Cuenta creada correctamente. Ya puedes iniciar sesión.");
      setName("");
      setEmail("");
      setPassword("");
      setClubId("");
      setRole("athlete");
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      setErrorMsg("Error inesperado al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="absolute inset-0 tal-radial tal-grid-bg" />
      <div className="absolute -top-32 right-[-120px] h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-[-140px] left-[-120px] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-slate-950/70 shadow-[0_0_80px_rgba(34,211,238,0.18)] backdrop-blur-xl md:grid-cols-2">
        <div className="hidden border-r border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 p-10 md:block">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-cyan-300">
            TECH ARCHERY LAB
          </p>

          <h1 className="mt-8 text-5xl font-black leading-none tracking-tight">
            Registro
            <span className="block tal-text-glow text-cyan-300">
              TAL
            </span>
            Portal
          </h1>

          <p className="mt-6 text-sm leading-7 text-slate-300">
            Crea tu acceso para consultar entrenamientos, estadísticas,
            equipamiento, tuning y rendimiento deportivo.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-cyan-400/20 bg-white/5 p-4">
              <p className="text-xs font-black text-cyan-300">ATHLETE</p>
              <p className="mt-2 text-2xl font-black">Portal</p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-white/5 p-4">
              <p className="text-xs font-black text-cyan-300">COACH</p>
              <p className="mt-2 text-2xl font-black">Control</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRegister} className="p-8 md:p-10">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Nueva cuenta
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight">
              Crear cuenta
            </h2>

            <p className="mt-3 text-sm text-slate-400">
              Registra tu cuenta para acceder al portal TAL.
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-medium text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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
              placeholder="Contraseña mínimo 6 caracteres"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-medium text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 font-medium text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
              required
            >
              <option value="athlete">Atleta</option>
              <option value="coach">Entrenador</option>
            </select>

            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 font-medium text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
              required
            >
              <option value="">Selecciona club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>

            {message && (
              <p className="rounded-2xl border border-green-400/30 bg-green-500/10 p-3 text-sm font-bold text-green-300">
                {message}
              </p>
            )}

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
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            <Link
              href="/login"
              className="block rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-center text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}