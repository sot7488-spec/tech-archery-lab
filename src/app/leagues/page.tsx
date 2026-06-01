export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Crosshair,
  ShieldCheck,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import IndoorLeagueCreateForm from "./IndoorLeagueCreateForm";

function badgeClass(status: string) {
  if (status === "open") return "border-emerald-300/25 bg-emerald-400/10 text-emerald-200";
  if (status === "closed") return "border-slate-300/20 bg-slate-400/10 text-slate-300";
  return "border-yellow-300/25 bg-yellow-400/10 text-yellow-200";
}

function label(value: string) {
  const labels: Record<string, string> = {
    iniciacion: "Iniciacion",
    infantil: "Infantil",
    juvenil: "Juvenil",
    abierta: "Abierta",
    recurvo: "Recurvo",
    compuesto: "Compuesto",
    barebow: "Barebow",
  };

  return labels[value] || value;
}

export default async function LeaguesPage() {
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

  const { data: athleteProfile } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let visibleLeagueIds: string[] | null = null;

  if (profile.role === "coach") {
    const { data: invites } = await supabase
      .from("indoor_league_coaches")
      .select("league_id")
      .eq("coach_id", user.id);

    visibleLeagueIds = (invites || []).map((invite) => invite.league_id);
  }

  if (profile.role === "athlete") {
    const { data: enrollments } = athleteProfile?.id
      ? await supabase
          .from("indoor_league_athletes")
          .select("league_id")
          .eq("athlete_id", athleteProfile.id)
      : { data: [] };

    visibleLeagueIds = (enrollments || []).map(
      (enrollment) => enrollment.league_id
    );
  }

  let leaguesQuery = supabase
    .from("indoor_leagues")
    .select(`
      *,
      indoor_league_clubs (
        id,
        club_id
      ),
      indoor_league_rounds (
        id,
        round_date
      ),
      indoor_league_coaches (
        id,
        coach_id
      ),
      indoor_league_athletes (
        id,
        athlete_id
      ),
      indoor_league_results (
        id,
        status
      )
    `)
    .order("start_date", { ascending: false });

  if (visibleLeagueIds !== null) {
    leaguesQuery =
      visibleLeagueIds.length > 0
        ? leaguesQuery.in("id", visibleLeagueIds)
        : leaguesQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: leaguesRaw, error } = await leaguesQuery;

  const leagues = leaguesRaw || [];

  const openCount = leagues.filter((league: any) => league.status === "open").length;
  const clubsCount = new Set(
    leagues.flatMap((league: any) =>
      (league.indoor_league_clubs || []).map((club: any) => club.club_id)
    )
  ).size;
  const resultsCount = leagues.reduce(
    (sum: number, league: any) => sum + (league.indoor_league_results?.length || 0),
    0
  );

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 tal-grid-bg opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Indoor Virtual League
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Liga indoor interclubs
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Competencia virtual mixta a 18 metros para iniciacion, infantil,
                juvenil y abierta en recurvo, compuesto y barebow.
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Ligas</p>
              <p className="text-5xl font-black">{leagues.length}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric icon={Trophy} title="Abiertas" value={openCount} />
          <Metric icon={Users} title="Clubes" value={clubsCount} />
          <Metric icon={ShieldCheck} title="Resultados" value={resultsCount} />
          <Metric icon={Target} title="Distancia" value={18} suffix="m" />
        </section>

        {profile.role === "admin" && (
          <IndoorLeagueCreateForm />
        )}

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {JSON.stringify(error)}
          </div>
        )}

        <section className="space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Ligas registradas
          </p>

          {leagues.map((league: any) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="group block rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/[0.06]"
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${badgeClass(league.status)}`}>
                      {league.status}
                    </span>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                      {label(league.category)} / {label(league.bow_type)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                      Mixta
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{league.name}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-400">
                    {league.description || "Liga indoor virtual interclubs"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm font-black text-slate-200">
                  <span className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2">
                    <CalendarDays className="mb-1 text-cyan-300" size={16} />
                    {league.start_date} / {league.end_date}
                  </span>
                  <span className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2">
                    <Crosshair className="mb-1 text-cyan-300" size={16} />
                    {league.rounds_count || league.indoor_league_rounds?.length || 0} jornadas / {league.arrows_count} flechas
                  </span>
                </div>

                <div className="flex justify-end">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 transition group-hover:translate-x-1 group-hover:bg-cyan-300">
                    <ArrowRight size={20} />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {leagues.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm font-bold text-slate-500">
              Aun no hay ligas indoor registradas.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
  suffix = "",
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="tal-metric-card">
      <span className="tal-metric-icon">
        <Icon size={20} />
      </span>
      <p className="tal-metric-label">{title}</p>
      <p className="tal-metric-value">
        {value}
        {suffix && <span className="text-xl text-slate-400">{suffix}</span>}
      </p>
    </div>
  );
}
