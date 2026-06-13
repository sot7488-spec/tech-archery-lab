"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ImagePlus,
  Trash2,
  Lock,
  ArrowLeft,
  Edit3,
  X,
  MessageSquare,
  Video,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/40 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.02] disabled:text-slate-400 disabled:opacity-70";

export default function AthleteProfilePage() {
  const params = useParams();
  const athleteId = params.id as string;

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [currentUserId, setCurrentUserId] = useState("");
  const [role, setRole] = useState("");

  const [userId, setUserId] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [curp, setCurp] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [bowType, setBowType] = useState("recurvo");
  const [dominantHand, setDominantHand] = useState("");
  const [clubId, setClubId] = useState("");
  const [associationId, setAssociationId] = useState("");
  const [federationId, setFederationId] = useState("");
  const [notes, setNotes] = useState("");
  const [videoFeedback, setVideoFeedback] = useState<any[]>([]);

  const [clubs, setClubs] = useState<any[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.assign("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(currentUser?.role || "");

    const { data: clubsData } = await supabase
      .from("clubs")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    setClubs(clubsData || []);

    const { data: athlete, error } = await supabase
      .from("athlete_profiles")
      .select(`
        id,
        user_id,
        photo_url,
        curp,
        birthdate,
        gender,
        category,
        bow_type,
        dominant_hand,
        club_id,
        association_id,
        federation_id,
        notes,
        users!athlete_profiles_user_id_fkey (
          name,
          email
        )
      `)
      .eq("id", athleteId)
      .single();

    if (error || !athlete) {
      setErrorMsg("No se encontró el perfil del atleta.");
      setLoading(false);
      return;
    }

    if (currentUser?.role === "athlete" && athlete.user_id !== user.id) {
      const { data: ownAthlete } = await supabase
        .from("athlete_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (ownAthlete?.id) {
        window.location.assign(`/athletes/profile/${ownAthlete.id}`);
        return;
      }
    }

    const userInfo = Array.isArray(athlete.users)
      ? athlete.users[0]
      : athlete.users;

    setUserId(athlete.user_id);
    setPhotoPreview(athlete.photo_url || null);

    setName(userInfo?.name || "");
    setEmail(userInfo?.email || "");

    setCurp(athlete.curp || "");
    setBirthdate(athlete.birthdate || "");
    setGender(athlete.gender || "");
    setCategory(athlete.category || "");
    setBowType(athlete.bow_type || "recurvo");
    setDominantHand(athlete.dominant_hand || "");
    setClubId(athlete.club_id || "");
    setAssociationId(athlete.association_id || "");
    setFederationId(athlete.federation_id || "");
    setNotes(athlete.notes || "");

    const { data: feedbackData } = await supabase
      .from("video_analysis_feedback")
      .select(
        `
        id,
        title,
        feedback,
        snapshot_data_url,
        video_time_seconds,
        analysis_mode,
        created_at,
        users!video_analysis_feedback_coach_id_fkey (
          name
        )
      `
      )
      .eq("athlete_id", athlete.id)
      .order("created_at", { ascending: false })
      .limit(6);

    setVideoFeedback(feedbackData || []);

    setLoading(false);
  }

  function cancelEditing() {
    setEditing(false);
    setMessage("");
    setErrorMsg("");
    loadProfile();
  }

  function removePhoto() {
    if (!editing) return;

    setPhotoPreview(null);

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  async function uploadPhotoIfNeeded() {
    const file = photoInputRef.current?.files?.[0];

    if (!file || file.size === 0) {
      return photoPreview;
    }

    const extension = file.name.split(".").pop();
    const fileName = `${athleteId}-${Date.now()}.${extension}`;
    const filePath = `athletes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("athlete-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("athlete-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMsg("");

    try {
      const photoUrl = await uploadPhotoIfNeeded();

      const { error: userError } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (userError) throw new Error(userError.message);

      const { error: athleteError } = await supabase
        .from("athlete_profiles")
        .update({
          photo_url: photoUrl,
          curp: curp || null,
          birthdate: birthdate || null,
          gender: gender || null,
          category: category || null,
          bow_type: bowType,
          dominant_hand: dominantHand || null,
          association_id: associationId || null,
          federation_id: federationId || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", athleteId);

      if (athleteError) throw new Error(athleteError.message);

      if (currentUserId === userId && email.trim().toLowerCase()) {
        const { error: authEmailError } = await supabase.auth.updateUser({
          email: email.trim().toLowerCase(),
        });

        if (authEmailError) throw new Error(authEmailError.message);
      }

      setEditing(false);
      setMessage("Perfil actualizado correctamente.");
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Ocurrió un error al guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setErrorMsg("");

    if (currentUserId !== userId) {
      setErrorMsg("Solo el dueño de la cuenta puede cambiar su password.");
      return;
    }

    if (!currentPassword) {
      setErrorMsg("Escribe tu password actual.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("El nuevo password debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Los passwords no coinciden.");
      return;
    }

    setSaving(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (loginError) {
      setErrorMsg("El password actual no es correcto.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password actualizado correctamente.");
    setSaving(false);
  }

  const clubName =
    clubs.find((club) => club.id === clubId)?.name || "Sin club asignado";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="font-black text-cyan-300">Cargando perfil...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 tal-grid-bg opacity-30" />
      <div className="absolute right-[-200px] top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-120px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/athletes/${athleteId}`}
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft size={16} />
            Volver a mi ficha
          </Link>

          {!editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage("");
                setErrorMsg("");
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
            >
              <Edit3 size={16} />
              Editar perfil
            </button>
          ) : (
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
            >
              <X size={16} />
              Cancelar edición
            </button>
          )}
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/30 p-8 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-300">
            TAL Athlete Profile
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight">
            Información de perfil
            <span className="block text-cyan-300 tal-text-glow">
              {name || "Atleta"}
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-slate-400">
            La información está bloqueada por seguridad. Presiona “Editar
            perfil” para actualizar tus datos.
          </p>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
            {message}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 gap-6 rounded-[2.5rem] border border-cyan-400/10 bg-white/[0.03] p-6 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:grid-cols-[280px_1fr]"
        >
          <div className="rounded-[1.8rem] border border-cyan-400/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <label className="mb-3 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Foto del atleta
            </label>

            <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Foto del atleta"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-slate-500">
                  <ImagePlus size={42} className="mb-3 text-cyan-300/70" />
                  <span className="text-sm font-bold">Sin fotografía</span>
                </div>
              )}
            </div>

            <label
              className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                editing
                  ? "cursor-pointer border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400 hover:text-slate-950"
                  : "cursor-not-allowed border-white/10 bg-white/5 text-slate-500"
              }`}
            >
              <ImagePlus size={18} />
              Cambiar foto

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!editing || saving}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file || file.size === 0) return;
                  setPhotoPreview(URL.createObjectURL(file));
                }}
              />
            </label>

            {photoPreview && (
              <button
                type="button"
                onClick={removePhoto}
                disabled={!editing || saving}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                Quitar foto
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input
              placeholder="Nombre completo"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!editing || saving}
            />

            <input
              type="email"
              placeholder="Correo electrónico"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!editing || saving}
            />

            <input
              placeholder="CURP"
              className={inputClass}
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase())}
              disabled={!editing || saving}
            />

            <input
              type="date"
              className={inputClass}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              disabled={!editing || saving}
            />

            <select
              className={inputClass}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={!editing || saving}
            >
              <option value="">Género</option>
              <option value="varonil">Varonil</option>
              <option value="femenil">Femenil</option>
            </select>

            <input
              placeholder="Categoría"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!editing || saving}
            />

            <select
              className={inputClass}
              value={bowType}
              onChange={(e) => setBowType(e.target.value)}
              disabled={!editing || saving}
            >
              <option value="recurvo">Recurvo</option>
              <option value="compuesto">Compuesto</option>
              <option value="barebow">Barebow</option>
              <option value="tradicional">Tradicional</option>
            </select>

            <select
              className={inputClass}
              value={dominantHand}
              onChange={(e) => setDominantHand(e.target.value)}
              disabled={!editing || saving}
            >
              <option value="">Mano dominante</option>
              <option value="diestro">Diestra</option>
              <option value="zurdo">Zurda</option>
            </select>

            <input
              value={clubName}
              className={inputClass}
              disabled
              readOnly
            />

            <input
              placeholder="Asociación"
              className={inputClass}
              value={associationId}
              onChange={(e) => setAssociationId(e.target.value)}
              disabled={!editing || saving}
            />

            <input
              placeholder="ID Federación"
              className={inputClass}
              value={federationId}
              onChange={(e) => setFederationId(e.target.value)}
              disabled={!editing || saving}
            />

            <textarea
              placeholder="Notas"
              rows={4}
              className="min-h-[120px] rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/40 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.02] disabled:text-slate-400 disabled:opacity-70 md:col-span-2 xl:col-span-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!editing || saving}
            />

            {editing && (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-3"
              >
                <Save size={16} />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
          </div>
        </form>

        <section className="rounded-[2.5rem] border border-emerald-400/10 bg-white/[0.03] p-6 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <Video size={24} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">
                TAL Coach Review
              </p>
              <h2 className="mt-1 text-3xl font-black">
                Retroalimentacion tecnica
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Capturas del analisis de video con observaciones del coach.
              </p>
            </div>
          </div>

          {videoFeedback.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
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
        </section>

        {currentUserId === userId && (
          <form
            onSubmit={handlePasswordChange}
            className="rounded-[2.5rem] border border-cyan-400/10 bg-white/[0.03] p-6 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Lock size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                  Seguridad
                </p>
                <h2 className="mt-1 text-3xl font-black">Cambiar password</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Para actualizarlo debes validar primero tu password actual.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input
                type="password"
                placeholder="Password actual"
                className={inputClass}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={saving}
              />

              <input
                type="password"
                placeholder="Nuevo password"
                className={inputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={saving}
              />

              <input
                type="password"
                placeholder="Confirmar nuevo password"
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={saving}
              />

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-3"
              >
                <Lock size={16} />
                {saving ? "Actualizando..." : "Actualizar password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
