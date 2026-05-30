import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  MapPin,
  Users,
  Activity,
  Mail,
  CalendarDays,
  ShieldCheck,
  Target,
  Trophy,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClubDashboardPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "coach" && profile.club_id !== id) {
    if (profile.club_id) redirect(`/clubs/${profile.club_id}`);
    redirect("/");
  }

  const isCoach = profile.role === "coach";
  const backHref = isCoach ? "/" : "/clubs";
  const backLabel = isCoach ? "Dashboard" : "Clubs";

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", id)
    .single();

  if (clubError || !club) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-6">
          <h1 className="text-3xl font-black text-red-300">
            Error cargando club
          </h1>

          <p className="mt-4 text-slate-300">ID recibido:</p>

          <pre className="mt-2 overflow-auto rounded-2xl bg-black/40 p-4 text-cyan-300">
            {id}
          </pre>

          <p className="mt-4 text-slate-300">Error Supabase:</p>

          <pre className="mt-2 overflow-auto rounded-2xl bg-black/40 p-4 text-red-200">
            {JSON.stringify(clubError, null, 2)}
          </pre>

          <Link
            href={backHref}
            className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
          >
            Volver a {backLabel}
          </Link>
        </div>
      </main>
    );
  }

  const { data: athleteProfilesRaw, error: athletesError } = await supabase
    .from("athlete_profiles")
    .select("*")
    .eq("club_id", id)
    .order("created_at", { ascending: false });

  const athleteProfiles = athleteProfilesRaw || [];
  const athleteUserIds = athleteProfiles.map((athlete: any) => athlete.user_id);

  const { data: athleteUsersRaw } =
    athleteUserIds.length > 0
      ? await supabase
          .from("users")
          .select("id, name, email, role")
          .in("id", athleteUserIds)
      : { data: [] };

  const athleteUsers = athleteUsersRaw || [];

  const athletes = athleteProfiles.map((athlete: any) => {
    const userData = athleteUsers.find(
      (athleteUser: any) => athleteUser.id === athlete.user_id
    );

    return {
      ...athlete,
      name: userData?.name || "Atleta sin nombre",
      email: userData?.email || "",
      role: userData?.role || "",
    };
  });

  const { data: usersRaw } = await supabase
    .from("users")
    .select("id, name, email, role, club_id")
    .eq("club_id", id);

  const { data: sessionsRaw } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("club_id", id)
    .order("training_date", { ascending: false });

  const users = usersRaw || [];

  const staffUsers = users.filter((member: any) =>
    ["admin", "coach", "trainer", "staff"].includes(
      String(member.role || "").toLowerCase()
    )
  );

  const sessions = sessionsRaw || [];

  const recurvoCount = athletes.filter(
    (athlete: any) => athlete.bow_type === "recurvo"
  ).length;

  const compuestoCount = athletes.filter(
    (athlete: any) => athlete.bow_type === "compuesto"
  ).length;

  const latestSessions = sessions.slice(0, 5);

  const statCardClass =
    "tal-metric-card";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>

          <span
            className={
              club.is_active
                ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-300"
                : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-red-300"
            }
          >
            {club.is_active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <section className="mb-6 overflow-hidden rounded-[2.2rem] border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-7 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[150px_1fr_auto] md:items-center">
            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-900 text-6xl font-black text-cyan-300">
              {club.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={club.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                club.name?.charAt(0) || "C"
              )}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                TAL Club Dashboard
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
                {club.name}
              </h1>

              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-400">
                <MapPin size={17} className="text-cyan-300" />
                {club.city || "Sin ciudad"}, {club.state || "Sin estado"},{" "}
                {club.country || "Sin país"}
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Atletas</p>
              <p className="text-5xl font-black">{athletes.length}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className={statCardClass}>
            <Users className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Atletas
            </p>
            <p className="mt-2 text-4xl font-black">{athletes.length}</p>
          </div>

          <div className={statCardClass}>
            <ShieldCheck className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Staff
            </p>
            <p className="mt-2 text-4xl font-black">{staffUsers.length}</p>
          </div>

          <div className={statCardClass}>
            <Activity className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Sesiones
            </p>
            <p className="mt-2 text-4xl font-black">{sessions.length}</p>
          </div>

          <div className={statCardClass}>
            <Target className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Recurvo
            </p>
            <p className="mt-2 text-4xl font-black">{recurvoCount}</p>
          </div>

          <div className={statCardClass}>
            <Trophy className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Compuesto
            </p>
            <p className="mt-2 text-4xl font-black">{compuestoCount}</p>
          </div>
        </section>

        {athletesError && (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {JSON.stringify(athletesError)}
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                  Roster
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Atletas del club
                </h2>
              </div>

              <Users className="text-cyan-300" size={28} />
            </div>

            {athletes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-center text-slate-400">
                Este club todavía no tiene atletas registrados.
              </div>
            ) : (
              <div className="space-y-4">
                {athletes.map((athlete: any) => (
                  <div
                    key={athlete.id}
                    className="grid grid-cols-1 gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/[0.06] md:grid-cols-[70px_1fr_auto] md:items-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-900 text-2xl font-black text-cyan-300">
                      {athlete.photo_url ? (
                        <img
                          src={athlete.photo_url}
                          alt={athlete.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        athlete.name?.charAt(0) || "A"
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white">
                        {athlete.name || "Atleta sin nombre"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-300">
                          {athlete.category || "Sin categoría"}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                          {athlete.bow_type || "Sin arco"}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                          {athlete.dominant_hand || "Sin mano"}
                        </span>
                      </div>

                      {athlete.email && (
                        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={13} />
                          {athlete.email}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                    Staff
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Usuarios</h2>
                </div>

                <ShieldCheck className="text-cyan-300" size={26} />
              </div>

              {staffUsers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay usuarios asociados.
                </p>
              ) : (
                <div className="space-y-3">
                  {staffUsers.map((member: any) => (
                    <div
                      key={member.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                    >
                      <p className="font-black text-white">
                        {member.name || "Usuario sin nombre"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {member.email}
                      </p>

                      <p className="mt-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                        {member.role || "Sin rol"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                    Actividad
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Entrenamientos
                  </h2>
                </div>

                <CalendarDays className="text-cyan-300" size={26} />
              </div>

              {latestSessions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay sesiones registradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {latestSessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                    >
                      <p className="font-black text-white">
                        {session.title || "Entrenamiento"}
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays size={13} />
                        {session.training_date || "Sin fecha"}
                      </p>

                      {session.location && (
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <MapPin size={13} />
                          {session.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
