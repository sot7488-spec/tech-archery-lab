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
  const [role, setRole] = useState("athlete");
  const [clubId, setClubId] = useState("");
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

      if (!error && data) {
        setClubs(data);
      }
    }

    loadClubs();
  }, []);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMsg("");
    setLoading(true);

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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const authUser = data.user;

    if (!authUser) {
      setErrorMsg("No se pudo crear el usuario.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("users").insert({
      id: authUser.id,
      name,
      email: email.trim(),
      role,
      club_id: clubId,
      is_active: true,
    });

    if (profileError) {
      setErrorMsg(profileError.message);
      setLoading(false);
      return;
    }

    setMessage("Usuario creado correctamente. Ya puedes iniciar sesión.");
    setName("");
    setEmail("");
    setPassword("");
    setRole("athlete");
    setClubId("");
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl"
      >
        <h1 className="text-3xl font-bold text-white">Crear usuario</h1>

        <p className="mt-2 text-sm text-slate-300">
          Registra tu cuenta como atleta o entrenador.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Nombre completo"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            required
          >
            <option value="athlete">Atleta</option>
            <option value="coach">Entrenador</option>
          </select>

          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
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
            <p className="rounded-xl bg-green-500/10 p-3 text-sm text-green-300">
              {message}
            </p>
          )}

          {errorMsg && (
            <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>

          <Link
            href="/login"
            className="block text-center text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            Volver al login
          </Link>
        </div>
      </form>
    </main>
  );
}