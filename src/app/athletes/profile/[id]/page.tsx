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
  Building2,
  Camera,
  CalendarDays,
  Crosshair,
  Flame,
  Hash,
  Mail,
  Medal,
  ShieldCheck,
  Star,
  Tag,
  Target,
  Trophy,
  User,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/40 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.02] disabled:text-slate-400 disabled:opacity-70";

type PlayerStats = {
  level: number;
  xp: number;
  currentLevelXp: number;
  totalArrows: number;
  totalX: number;
  completedTrainings: number;
  achievementEffectiveness: number;
  skills: PlayerSkill[];
  records: PlayerRecord[];
};

type PlayerSkill = {
  title: string;
  value: number;
  suffix: string;
  level: number;
  progress: number;
  nextTargetLabel: string;
  icon: LucideIcon;
  tone: "cyan" | "emerald" | "yellow" | "rose";
};

type PlayerRecord = {
  title: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
};

type ClubOption = {
  id: string;
  name: string;
};

type TrainingArrow = {
  score: number | string | null;
  is_x: boolean | null;
};

type TrainingSeries = {
  id: string;
  series_number: number | null;
  total_score: number | string | null;
  average_score: number | string | null;
  arrows?: TrainingArrow[] | null;
};

type TrainingRound = {
  distance_meters: number | null;
  scoring_enabled?: boolean | null;
  series?: TrainingSeries[] | null;
};

type TrainingSessionStats = {
  id: string;
  training_date: string | null;
  status: string | null;
  total_score: number | string | null;
  total_arrows: number | string | null;
  average_score: number | string | null;
  training_rounds?: TrainingRound[] | null;
};

type TrainingWithXCount = TrainingSessionStats & {
  xCount: number;
};

const emptyPlayerStats: PlayerStats = {
  level: 1,
  xp: 0,
  currentLevelXp: 0,
  totalArrows: 0,
  totalX: 0,
  completedTrainings: 0,
  achievementEffectiveness: 0,
  skills: [],
  records: [],
};

export default function AthleteProfilePage() {
  const params = useParams();
  const athleteId = params.id as string;

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [currentUserId, setCurrentUserId] = useState("");

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
  const [playerStats, setPlayerStats] =
    useState<PlayerStats>(emptyPlayerStats);

  const [clubs, setClubs] = useState<ClubOption[]>([]);

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

    await loadPlayerStats(athlete.id);

    setLoading(false);
  }

  async function loadPlayerStats(profileAthleteId: string) {
    const { data: trainingsRaw } = await supabase
      .from("training_sessions")
      .select(
        `
        id,
        training_date,
        status,
        total_score,
        total_arrows,
        average_score,
        training_rounds (
          distance_meters,
          scoring_enabled,
          series (
            id,
            series_number,
            total_score,
            average_score,
            arrows (
              score,
              is_x
            )
          )
        )
      `
      )
      .eq("athlete_id", profileAthleteId)
      .order("training_date", { ascending: false });

    const trainings = (trainingsRaw || []) as TrainingSessionStats[];
    const scoringSeries = trainings.flatMap((training) =>
      (training.training_rounds || []).flatMap((round) =>
        round.scoring_enabled === false ? [] : round.series || []
      )
    );
    const arrows = scoringSeries.flatMap((series) => series.arrows || []);
    const totalArrows = arrows.length;
    const totalX = arrows.filter((arrow) => arrow.is_x).length;
    const completedTrainings = trainings.filter(
      (training) => training.status === "completed"
    ).length;
    const achievementHits = arrows.filter(
      (arrow) => Number(arrow.score) >= 9
    ).length;
    const achievementEffectiveness =
      totalArrows > 0 ? Math.round((achievementHits / totalArrows) * 100) : 0;

    const trainingAverages = trainings
      .map((training) => Number(training.average_score || 0))
      .filter((average: number) => average > 0);
    const averageOfAverages =
      trainingAverages.length > 0
        ? trainingAverages.reduce((sum: number, value: number) => sum + value, 0) /
          trainingAverages.length
        : 0;
    const averageDeviation =
      trainingAverages.length > 1
        ? Math.sqrt(
            trainingAverages.reduce(
              (sum: number, value: number) =>
                sum + Math.pow(value - averageOfAverages, 2),
              0
            ) / trainingAverages.length
          )
        : 0;
    const consistencyScore =
      trainingAverages.length >= 3
        ? Math.max(0, Math.min(100, Math.round(100 - averageDeviation * 28)))
        : Math.min(55, trainingAverages.length * 18);

    const bestSeries = [...scoringSeries].sort(
      (a, b) => Number(b.total_score || 0) - Number(a.total_score || 0)
    )[0];
    const bestScoreTraining = [...trainings].sort(
      (a, b) => Number(b.total_score || 0) - Number(a.total_score || 0)
    )[0];
    const mostXTraining = trainings
      .map<TrainingWithXCount>((training) => ({
        ...training,
        xCount: (training.training_rounds || [])
          .flatMap((round) => round.series || [])
          .flatMap((series) => series.arrows || [])
          .filter((arrow) => arrow.is_x).length,
      }))
      .sort((a, b) => b.xCount - a.xCount)[0];

    const skills = [
      buildPlayerSkill("Precision", achievementEffectiveness, "%", [25, 40, 55, 70, 82], Crosshair, "cyan"),
      buildPlayerSkill("Consistencia", consistencyScore, "%", [25, 45, 62, 78, 90], ShieldCheck, "emerald"),
      buildPlayerSkill("Volumen", totalArrows, "", [100, 300, 750, 1500, 3000], Zap, "yellow"),
      buildPlayerSkill("Disciplina", completedTrainings, "", [1, 3, 8, 15, 30], Flame, "rose"),
    ];

    const xp =
      skills.reduce((sum, skill) => sum + skill.level * 120, 0) +
      completedTrainings * 20 +
      Math.floor(totalArrows / 10) +
      totalX * 5;

    setPlayerStats({
      level: Math.max(1, Math.floor(xp / 500) + 1),
      xp,
      currentLevelXp: xp % 500,
      totalArrows,
      totalX,
      completedTrainings,
      achievementEffectiveness,
      skills,
      records: [
        {
          title: "Mejor serie",
          value: bestSeries ? Number(bestSeries.total_score || 0) : "-",
          detail: bestSeries ? `Serie #${bestSeries.series_number}` : "Sin series",
          icon: Medal,
        },
        {
          title: "Mejor score",
          value: bestScoreTraining ? Number(bestScoreTraining.total_score || 0) : "-",
          detail: bestScoreTraining?.training_date || "Sin entrenamientos",
          icon: Trophy,
        },
        {
          title: "Mas X",
          value: mostXTraining ? mostXTraining.xCount : "-",
          detail: mostXTraining?.training_date || "Sin datos",
          icon: Star,
        },
        {
          title: "Zona de logro",
          value: `${achievementEffectiveness}%`,
          detail: "Flechas 9-10",
          icon: Target,
        },
      ],
    });
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
    } catch (error) {
      console.error(error);
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar el perfil."
      );
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

        <form
          onSubmit={handleSave}
          className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/30 p-8 shadow-[0_0_60px_rgba(34,211,238,0.08)]"
        >
          <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
            <div className="relative mx-auto w-full max-w-[220px]">
              <div className="absolute inset-0 rounded-[2rem] bg-cyan-400/30 blur-2xl" />
              <img
                src={photoPreview || "/tal.png"}
                alt={name || "Atleta"}
                className="relative aspect-square w-full rounded-[2rem] border border-cyan-300/35 bg-slate-950 object-cover p-1 shadow-2xl"
              />

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={!editing || saving}
                title={
                  editing
                    ? "Cambiar foto"
                    : "Activa editar perfil para cambiar la foto"
                }
                className={`absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-[0_0_28px_rgba(34,211,238,0.35)] transition ${
                  editing
                    ? "border-cyan-200/40 bg-cyan-300 text-slate-950 hover:scale-105"
                    : "cursor-not-allowed border-white/10 bg-slate-950/80 text-slate-500"
                }`}
              >
                <Camera size={20} />
              </button>

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

              {editing && photoPreview && (
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={saving}
                  className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-red-300/30 bg-red-500/90 text-white shadow-[0_0_24px_rgba(239,68,68,0.35)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Quitar foto"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-300">
                    TAL Player Card
                  </p>

                  <h1 className="mt-4 text-5xl font-black tracking-tight">
                    {name || "Atleta"}
                    <span className="block text-cyan-300 tal-text-glow">
                      Lv. {playerStats.level} Arquero
                    </span>
                  </h1>
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-[1.5rem] border border-cyan-300/15 bg-slate-950/55 px-5 py-4 xl:min-w-56">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                    <Target size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-2xl font-black text-white">
                      {category || "Sin categoria"}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">
                      {bowType || "Sin arco"} / {dominantHand || "Sin mano"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniStat label="XP" value={playerStats.xp} />
                <MiniStat label="Flechas" value={playerStats.totalArrows} />
                <MiniStat label="X" value={playerStats.totalX} />
              </div>

              <div className="mt-5 h-4 overflow-hidden rounded-full border border-white/10 bg-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-yellow-200 shadow-[0_0_18px_rgba(34,211,238,0.5)]"
                  style={{
                    width: `${Math.min(
                      100,
                      (playerStats.currentLevelXp / 500) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {playerStats.currentLevelXp}/500 XP para el siguiente nivel
              </p>

              {editing ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <input
                    placeholder="Nombre completo"
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={saving}
                  />
                  <input
                    type="email"
                    placeholder="Correo electronico"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={saving}
                  />
                  <input
                    placeholder="CURP"
                    className={inputClass}
                    value={curp}
                    onChange={(e) => setCurp(e.target.value.toUpperCase())}
                    disabled={saving}
                  />
                  <input
                    type="date"
                    className={inputClass}
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    disabled={saving}
                  />
                  <select
                    className={inputClass}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Genero</option>
                    <option value="varonil">Varonil</option>
                    <option value="femenil">Femenil</option>
                  </select>
                  <input
                    placeholder="Categoria"
                    className={inputClass}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={saving}
                  />
                  <select
                    className={inputClass}
                    value={bowType}
                    onChange={(e) => setBowType(e.target.value)}
                    disabled={saving}
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
                    disabled={saving}
                  >
                    <option value="">Mano dominante</option>
                    <option value="diestro">Diestra</option>
                    <option value="zurdo">Zurda</option>
                  </select>
                  <input value={clubName} className={inputClass} disabled readOnly />
                  <input
                    placeholder="Asociacion"
                    className={inputClass}
                    value={associationId}
                    onChange={(e) => setAssociationId(e.target.value)}
                    disabled={saving}
                  />
                  <input
                    placeholder="ID Federacion"
                    className={inputClass}
                    value={federationId}
                    onChange={(e) => setFederationId(e.target.value)}
                    disabled={saving}
                  />
                  <textarea
                    placeholder="Notas"
                    rows={3}
                    className="min-h-[110px] rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/40 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.02] disabled:text-slate-400 disabled:opacity-70 md:col-span-2 xl:col-span-3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={saving}
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <ProfileDetail label="Correo" value={email} icon={Mail} />
                  <ProfileDetail label="CURP" value={curp} icon={Hash} />
                  <ProfileDetail
                    label="Fecha nacimiento"
                    value={birthdate}
                    icon={CalendarDays}
                  />
                  <ProfileDetail label="Genero" value={gender} icon={User} />
                  <ProfileDetail label="Categoria" value={category} icon={Tag} />
                  <ProfileDetail
                    label="Tipo de arco"
                    value={bowType}
                    icon={Crosshair}
                  />
                  <ProfileDetail
                    label="Mano dominante"
                    value={dominantHand}
                    icon={ShieldCheck}
                  />
                  <ProfileDetail label="Club" value={clubName} icon={Building2} />
                  <ProfileDetail
                    label="Asociacion"
                    value={associationId}
                    icon={Medal}
                  />
                  <ProfileDetail
                    label="Federacion"
                    value={federationId}
                    icon={Trophy}
                  />
                </div>
              )}

              {editing && (
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <Save size={16} />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              )}
            </div>
          </div>

          <div className="hidden">
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
          </div>
        </form>

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

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.03] p-6 shadow-[0_0_60px_rgba(34,211,238,0.05)] backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <Zap size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                  Skill Tree
                </p>
                <h2 className="text-2xl font-black">Skills del atleta</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {playerStats.skills.map((skill) => (
                <SkillCard key={skill.title} skill={skill} />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-yellow-300/10 bg-white/[0.03] p-6 shadow-[0_0_60px_rgba(250,204,21,0.05)] backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-200">
                <Trophy size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-200">
                  Records
                </p>
                <h2 className="text-2xl font-black">Records personales</h2>
              </div>
            </div>

            <div className="grid gap-3">
              {playerStats.records.map((record) => (
                <RecordCard key={record.title} record={record} />
              ))}
            </div>
          </div>
        </section>

        {false && (
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
                  src={photoPreview || "/tal.png"}
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
        )}

        {/*
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
        */}

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

function buildPlayerSkill(
  title: string,
  value: number,
  suffix: string,
  thresholds: number[],
  icon: LucideIcon,
  tone: PlayerSkill["tone"]
): PlayerSkill {
  const level = thresholds.reduce(
    (count, target) => (value >= target ? count + 1 : count),
    0
  );
  const maxLevel = thresholds.length;
  const previousTarget = level > 0 ? thresholds[level - 1] || 0 : 0;
  const nextTarget =
    level >= maxLevel ? thresholds[maxLevel - 1] || 1 : thresholds[level] || 1;
  const progress =
    level >= maxLevel
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((value - previousTarget) /
                Math.max(1, nextTarget - previousTarget)) *
                100
            )
          )
        );

  return {
    title,
    value,
    suffix,
    level,
    progress,
    nextTargetLabel: level >= maxLevel ? "Max" : `${nextTarget}${suffix}`,
    icon,
    tone,
  };
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 shadow-inner shadow-cyan-950/30">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ProfileDetail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  icon: LucideIcon;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3"
      aria-label={label}
      title={label}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
        <Icon size={16} />
      </span>
      <p className="min-w-0 truncate text-sm font-black text-slate-100">
        {value || "Sin registro"}
      </p>
    </div>
  );
}

function SkillCard({ skill }: { skill: PlayerSkill }) {
  const Icon = skill.icon;
  const toneClass = skillToneClass(skill.tone);

  return (
    <article className="group rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${toneClass.badge}`}
          >
            <Icon size={19} />
          </span>
          <div>
            <h3 className="font-black">{skill.title}</h3>
            <p className="text-xs font-bold text-slate-500">
              Nivel {skill.level}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black">
            {skill.value}
            {skill.suffix}
          </p>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">
            meta {skill.nextTargetLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/10 bg-slate-900">
        <div
          className={`h-full rounded-full ${toneClass.bar}`}
          style={{ width: `${skill.progress}%` }}
        />
      </div>
    </article>
  );
}

function RecordCard({ record }: { record: PlayerRecord }) {
  const Icon = record.icon;

  return (
    <article className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/10 bg-slate-950/55 p-4 transition hover:border-yellow-200/30 hover:bg-white/[0.06]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-200/20 bg-yellow-200/10 text-yellow-100">
          <Icon size={19} />
        </span>
        <div>
          <h3 className="font-black">{record.title}</h3>
          <p className="text-xs font-bold text-slate-500">{record.detail}</p>
        </div>
      </div>

      <p className="text-2xl font-black text-white">{record.value}</p>
    </article>
  );
}

function skillToneClass(tone: PlayerSkill["tone"]) {
  if (tone === "emerald") {
    return {
      badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
      bar: "bg-gradient-to-r from-emerald-300 to-cyan-200 shadow-[0_0_16px_rgba(16,185,129,0.45)]",
    };
  }

  if (tone === "yellow") {
    return {
      badge: "border-yellow-200/20 bg-yellow-200/10 text-yellow-100",
      bar: "bg-gradient-to-r from-yellow-200 to-orange-300 shadow-[0_0_16px_rgba(250,204,21,0.45)]",
    };
  }

  if (tone === "rose") {
    return {
      badge: "border-rose-300/20 bg-rose-300/10 text-rose-200",
      bar: "bg-gradient-to-r from-rose-300 to-fuchsia-300 shadow-[0_0_16px_rgba(244,63,94,0.45)]",
    };
  }

  return {
    badge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
    bar: "bg-gradient-to-r from-cyan-300 to-blue-300 shadow-[0_0_16px_rgba(34,211,238,0.45)]",
  };
}
