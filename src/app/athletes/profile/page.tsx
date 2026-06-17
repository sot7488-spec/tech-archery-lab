"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AthleteProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileId, setProfileId] = useState("");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [bowType, setBowType] = useState("recurvo");
  const [dominantHand, setDominantHand] = useState("");
  const [curp, setCurp] = useState("");
  const [associationId, setAssociationId] = useState("");
  const [federationId, setFederationId] = useState("");
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setErrorMsg("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      window.location.assign("/login");
      return;
    }

    const { data, error } = await supabase
      .from("athlete_profiles")
      .select(`
        id,
        birthdate,
        gender,
        category,
        bow_type,
        dominant_hand,
        curp,
        association_id,
        federation_id,
        notes,
        users:user_id (
          name
        )
      `)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      setErrorMsg("No se encontró el perfil del atleta.");
      setLoading(false);
      return;
    }

    setProfileId(data.id);
    setBirthdate(data.birthdate || "");
    setGender(data.gender || "");
    setCategory(data.category || "");
    setBowType(data.bow_type || "recurvo");
    setDominantHand(data.dominant_hand || "");
    setCurp(data.curp || "");
    setAssociationId(data.association_id || "");
    setFederationId(data.federation_id || "");
    setNotes(data.notes || "");

    const userData = Array.isArray(data.users) ? data.users[0] : data.users;
    setName(userData?.name || "");

    setLoading(false);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMsg("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.assign("/login");
      return;
    }

    const { error: userError } = await supabase
      .from("users")
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (userError) {
      setErrorMsg(userError.message);
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("athlete_profiles")
      .update({
        birthdate: birthdate || null,
        gender: gender || null,
        category: category || null,
        bow_type: bowType,
        dominant_hand: dominantHand || null,
        curp: curp || null,
        association_id: associationId || null,
        federation_id: federationId || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (profileError) {
      setErrorMsg(profileError.message);
      setSaving(false);
      return;
    }

    setMessage("Perfil actualizado correctamente.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-cyan-300 font-black">Cargando perfil...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <section className="mx-auto max-w-4xl">
        <Link href="/portal/atleta" className="text-sm font-bold text-cyan-300">
          ← Volver al portal
        </Link>

        <div className="mt-6 rounded-[2rem] border border-cyan-400/20 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Athlete Profile
          </p>

          <h1 className="mt-3 text-4xl font-black">Completar perfil</h1>

          <p className="mt-2 text-sm text-slate-400">
            Actualiza tus datos deportivos y personales para personalizar tu portal.
          </p>

          <form onSubmit={handleSave} className="mt-8 grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Nombre completo"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="date"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-400"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option value="">Género</option>
              <option value="femenil">Femenil</option>
              <option value="varonil">Varonil</option>
            </select>

            <input
              type="text"
              placeholder="Categoría, ejemplo: Sub 14"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <select
              value={bowType}
              onChange={(e) => setBowType(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option value="recurvo">Recurvo</option>
              <option value="compuesto">Compuesto</option>
              <option value="barebow">Barebow</option>
            </select>

            <select
              value={dominantHand}
              onChange={(e) => setDominantHand(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option value="">Mano dominante</option>
              <option value="diestro">Diestra</option>
              <option value="zurdo">Zurda</option>
            </select>

            <input
              type="text"
              placeholder="CURP"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 uppercase text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase())}
            />

            <input
              type="text"
              placeholder="ID Asociación"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              value={associationId}
              onChange={(e) => setAssociationId(e.target.value)}
            />

            <input
              type="text"
              placeholder="ID Federación"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 md:col-span-2"
              value={federationId}
              onChange={(e) => setFederationId(e.target.value)}
            />

            <textarea
              placeholder="Notas del atleta"
              className="min-h-32 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 md:col-span-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {message && (
              <p className="rounded-2xl border border-green-400/20 bg-green-500/10 p-3 text-sm font-bold text-green-300 md:col-span-2">
                {message}
              </p>
            )}

            {errorMsg && (
              <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-300 md:col-span-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:opacity-50 md:col-span-2"
            >
              {saving ? "Guardando..." : "Guardar perfil"}
            </button>
          </form>
        </div>

        {/*
        <div className="mt-6 rounded-[2rem] border border-emerald-400/20 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(16,185,129,0.10)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <Video size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
                TAL Coach Review
              </p>
              <h2 className="text-2xl font-black">Retroalimentacion tecnica</h2>
            </div>
          </div>

          {videoFeedback.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {videoFeedback.map((item) => {
                const coachInfo = Array.isArray(item.users)
                  ? item.users[0]
                  : item.users;
                const seconds = Number(item.video_time_seconds || 0);

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/60"
                  >
                    <img
                      src={item.snapshot_data_url}
                      alt={item.title || "Retroalimentacion tecnica"}
                      className="aspect-video w-full bg-black object-contain"
                    />
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                            Analisis tecnico
                          </p>
                          <h3 className="mt-1 text-lg font-black">
                            {item.title || "Analisis tecnico"}
                          </h3>
                        </div>
                        <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-slate-300">
                          {Math.floor(seconds / 60)}:
                          {String(Math.floor(seconds % 60)).padStart(2, "0")}
                        </span>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
                        {item.feedback}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                        <MessageSquare size={14} />
                        <span>{coachInfo?.name || "Coach"}</span>
                        <span>Â·</span>
                        <span>
                          {new Date(item.created_at).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-400">
              Aun no tienes retroalimentacion tecnica por video.
            </p>
          )}
        </div>
        */}
      </section>
    </main>
  );
}
