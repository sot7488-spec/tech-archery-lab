export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Crosshair,
  Medal,
  ShieldCheck,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  closeIndoorLeague,
  enrollIndoorLeagueAthlete,
  enrollIndoorLeagueClub,
  validateIndoorLeagueResult,
} from "../actions";
import ScorecardSubmitForm from "./ScorecardSubmitForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

const BASE_POINTS = [10, 8, 6, 5, 4, 3, 2, 1];

function todayInMexico() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getName(relation: any, fallback = "Sin nombre") {
  if (Array.isArray(relation)) return relation[0]?.name || fallback;
  return relation?.name || fallback;
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
    pending: "Pendiente",
    validated: "Validado",
    rejected: "Rechazado",
    open: "Abierta",
    closed: "Terminada",
    draft: "Borrador",
  };

  return labels[value] || value;
}

function resultBadge(status: string) {
  if (status === "validated") return "border-emerald-300/25 bg-emerald-400/10 text-emerald-200";
  if (status === "rejected") return "border-red-300/25 bg-red-500/10 text-red-200";
  return "border-yellow-300/25 bg-yellow-400/10 text-yellow-200";
}

function rankResults(results: any[]) {
  return [...results].sort(
    (a, b) =>
      Number(b.total_score || 0) - Number(a.total_score || 0) ||
      Number(b.x_count || 0) - Number(a.x_count || 0) ||
      Number(b.tens_count || 0) - Number(a.tens_count || 0)
  );
}

function computeStandings(rounds: any[]) {
  const standings = new Map<string, any>();
  const roundTables = rounds.map((round: any) => {
    const validated = rankResults(
      (round.indoor_league_results || []).filter(
        (result: any) => result.status === "validated"
      )
    );
    const maxX = Math.max(0, ...validated.map((result: any) => Number(result.x_count || 0)));

    const rows = validated.map((result: any, index: number) => {
      const basePoints = BASE_POINTS[index] || 1;
      const xBonus = maxX > 0 && Number(result.x_count || 0) === maxX ? 1 : 0;
      const points = basePoints + xBonus;
      const athleteId = result.athlete_id;
      const current = standings.get(athleteId) || {
        athleteId,
        athleteName: getName(result.athlete_profiles?.users, "Atleta"),
        clubName: result.clubs?.name || "Club",
        totalPoints: 0,
        totalScore: 0,
        totalX: 0,
        rounds: 0,
      };

      current.totalPoints += points;
      current.totalScore += Number(result.total_score || 0);
      current.totalX += Number(result.x_count || 0);
      current.rounds += 1;
      standings.set(athleteId, current);

      return {
        ...result,
        position: index + 1,
        basePoints,
        xBonus,
        points,
      };
    });

    return { ...round, ranking: rows };
  });

  const overall = Array.from(standings.values()).sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.totalScore - a.totalScore ||
      b.totalX - a.totalX
  );

  return { overall, roundTables };
}

export default async function LeagueDetailPage({ params }: PageProps) {
  const { id } = await params;
  const today = todayInMexico();
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
    .select("id, club_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: league, error } = await supabase
    .from("indoor_leagues")
    .select(`
      *,
      indoor_league_clubs (
        id,
        club_id,
        clubs (
          name
        )
      ),
      indoor_league_coaches (
        id,
        coach_id
      ),
      indoor_league_athletes (
        id,
        athlete_id,
        club_id,
        athlete_profiles (
          id,
          users!athlete_profiles_user_id_fkey (
            name
          )
        )
      ),
      indoor_league_rounds (
        id,
        round_number,
        round_date,
        indoor_league_results (
          *,
          clubs (
            name
          ),
          athlete_profiles (
            id,
            club_id,
            users!athlete_profiles_user_id_fkey (
              name
            )
          ),
          indoor_league_result_arrows (
            arrow_number,
            score,
            is_x
          )
        )
      )
    `)
    .eq("id", id)
    .single();

  if (!league) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8">
          <h1 className="text-3xl font-black text-red-300">Liga no encontrada</h1>
          <Link href="/leagues" className="mt-5 inline-block text-sm font-black text-cyan-300">
            Volver a ligas
          </Link>
        </div>
      </main>
    );
  }

  const { data: coachInvite } =
    profile.role === "coach"
      ? await supabase
          .from("indoor_league_coaches")
          .select("id")
          .eq("league_id", id)
          .eq("coach_id", user.id)
          .maybeSingle()
      : { data: null };

  const { data: athleteEnrollment } =
    profile.role === "athlete" && athleteProfile?.id
      ? await supabase
          .from("indoor_league_athletes")
          .select("id")
          .eq("league_id", id)
          .eq("athlete_id", athleteProfile.id)
          .maybeSingle()
      : { data: null };

  const coachWasInvited = profile.role === "coach" && Boolean(coachInvite);
  const athleteIsEnrolled =
    profile.role === "athlete" && Boolean(athleteEnrollment);

  if (profile.role === "coach" && !coachWasInvited) redirect("/leagues");
  if (profile.role === "athlete" && !athleteIsEnrolled) redirect("/leagues");

  const rounds = [...(league.indoor_league_rounds || [])].sort(
    (a: any, b: any) => Number(a.round_number) - Number(b.round_number)
  );
  const { overall, roundTables } = computeStandings(rounds);
  const activeRound = rounds.find((round: any) => round.round_date === today);
  const printableRound =
    activeRound ||
    rounds.find((round: any) => String(round.round_date) >= today) ||
    rounds[0];
  const athleteResultForToday = activeRound?.indoor_league_results?.find(
    (result: any) => result.athlete_id === athleteProfile?.id
  );
  const canAthleteSubmit =
    profile.role === "athlete" &&
    league.status === "open" &&
    activeRound &&
    athleteProfile?.id &&
    athleteIsEnrolled &&
    !athleteResultForToday;

  const { data: clubAthletesRaw } =
    profile.role === "coach" && profile.club_id
      ? await supabase
          .from("athlete_profiles")
          .select(`
            id,
            club_id,
            users!athlete_profiles_user_id_fkey (
              name
            )
          `)
          .eq("club_id", profile.club_id)
          .order("created_at", { ascending: false })
      : { data: [] };

  const enrolledAthleteIds = new Set(
    (league.indoor_league_athletes || []).map((enrollment: any) => enrollment.athlete_id)
  );
  const availableClubAthletes = (clubAthletesRaw || []).filter(
    (athlete: any) => !enrolledAthleteIds.has(athlete.id)
  );

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 tal-grid-bg opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            href="/leagues"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <ArrowLeft size={16} />
            Ligas
          </Link>

          {profile.role === "admin" && league.status !== "closed" && (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/leagues/${league.id}/edit`}
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
              >
                Editar liga
              </Link>
              <form action={closeIndoorLeague}>
                <input type="hidden" name="league_id" value={league.id} />
                <button className="rounded-2xl border border-yellow-300/20 bg-yellow-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-200">
                  Terminar liga
                </button>
              </form>
            </div>
          )}
        </div>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            Indoor 18 m / Mixta / {label(league.status)}
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                {league.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                {label(league.category)} / {label(league.bow_type)} / {rounds.length}
                jornadas. Los atletas solo pueden cargar su scorecard en la
                fecha de cada jornada.
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-yellow-300/20 bg-yellow-300 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(250,204,21,0.22)]">
              <p className="text-xs font-black uppercase">Lider</p>
              <p className="text-4xl font-black">{overall[0]?.totalPoints || 0}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric icon={Target} title="Distancia" value="18 m" />
          <Metric icon={CalendarDays} title="Jornadas" value={rounds.length} />
          <Metric icon={Crosshair} title="Flechas" value={league.arrows_count} />
          <Metric icon={ShieldCheck} title="Atletas" value={overall.length} />
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {JSON.stringify(error)}
          </div>
        )}

        {printableRound && (
          <section className="tal-chart-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Scorecard imprimible
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Hoja oficial TAL / Jornada {printableRound.round_number}
                </h2>
                <p className="mt-2 text-sm font-bold text-slate-400">
                  Imprime la hoja, marca las burbujas y despues sube la foto para prellenar la captura.
                </p>
              </div>

              {profile.role === "athlete" && athleteProfile?.id ? (
                <Link
                  href={`/leagues/${league.id}/scorecard?round=${printableRound.id}`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-2xl bg-yellow-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-200"
                >
                  Abrir PDF imprimible
                </Link>
              ) : (
                <div className="flex max-w-xl flex-wrap gap-2">
                  {(league.indoor_league_athletes || []).slice(0, 8).map((enrollment: any) => (
                    <Link
                      key={enrollment.id}
                      href={`/leagues/${league.id}/scorecard?round=${printableRound.id}&athlete=${enrollment.athlete_id}`}
                      target="_blank"
                      className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-2 text-xs font-black text-yellow-100 transition hover:bg-yellow-300 hover:text-slate-950"
                    >
                      {getName(enrollment.athlete_profiles?.users, "Atleta")}
                    </Link>
                  ))}
                  {(league.indoor_league_athletes || []).length === 0 && (
                    <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-400">
                      Inscribe atletas para generar sus hojas.
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {profile.role === "athlete" && (
          <section className="tal-chart-card">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Captura del atleta
                </p>
                <h2 className="text-2xl font-black">Scorecard oficial indoor</h2>
              </div>
              <Medal className="text-yellow-300" size={26} />
            </div>

            {canAthleteSubmit ? (
              <ScorecardSubmitForm
                leagueId={league.id}
                roundId={activeRound.id}
                arrowsCount={Number(league.arrows_count || 60)}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm font-bold text-slate-400">
                {athleteResultForToday
                  ? "Ya cargaste tu puntuacion de la jornada de hoy."
                  : activeRound
                    ? "No puedes cargar puntuacion en este momento."
                    : "Hoy no hay jornada programada para esta liga."}
              </div>
            )}
          </section>
        )}

        {profile.role === "coach" && coachWasInvited && (
          <section className="tal-chart-card">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Inscripcion del club
              </p>
              <h2 className="text-2xl font-black">Atletas participantes</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <form action={enrollIndoorLeagueAthlete} className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input type="hidden" name="league_id" value={league.id} />
                <select
                  name="athlete_id"
                  className="h-12 rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none"
                  required
                >
                  <option className="bg-slate-900 text-white" value="">Selecciona atleta</option>
                  {availableClubAthletes.map((athlete: any) => (
                    <option className="bg-slate-900 text-white" key={athlete.id} value={athlete.id}>
                      {getName(athlete.users, "Atleta")}
                    </option>
                  ))}
                </select>
                <button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">
                  Inscribir atleta
                </button>
              </form>

              <form action={enrollIndoorLeagueClub}>
                <input type="hidden" name="league_id" value={league.id} />
                <button className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950">
                  Inscribir todo mi club
                </button>
              </form>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(league.indoor_league_athletes || [])
                .filter((enrollment: any) => enrollment.club_id === profile.club_id)
                .map((enrollment: any) => (
                  <span
                    key={enrollment.id}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-slate-300"
                  >
                    {getName(enrollment.athlete_profiles?.users, "Atleta")}
                  </span>
                ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="tal-chart-card">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Tabla general
              </p>
              <h2 className="text-2xl font-black">Puntos acumulados</h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <TableHeader columns={["#", "Atleta / club", "Pts", "Score", "X"]} />
              {overall.map((row, index) => (
                <div key={row.athleteId} className="grid grid-cols-[54px_1fr_70px_90px_70px] gap-2 border-t border-white/10 px-4 py-4 text-sm font-bold text-slate-200">
                  <span className="flex items-center gap-2 font-black text-white">
                    {index === 0 ? <Award size={18} className="text-yellow-300" /> : null}
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-black text-white">{row.athleteName}</span>
                    <span className="block truncate text-xs text-slate-500">{row.clubName}</span>
                  </span>
                  <span className="font-black text-yellow-300">{row.totalPoints}</span>
                  <span className="font-black text-cyan-300">{row.totalScore}</span>
                  <span>{row.totalX}</span>
                </div>
              ))}
              {overall.length === 0 && <EmptyRow text="Aun no hay resultados validados." />}
            </div>
          </div>

          <div className="tal-chart-card">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Sistema de puntos
              </p>
              <h2 className="text-2xl font-black">Bonificaciones por jornada</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {["1o: 10 pts", "2o: 8 pts", "3o: 6 pts", "4o: 5 pts", "5o: 4 pts", "6o: 3 pts", "7o: 2 pts", "8o+: 1 pt"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black text-slate-200">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-100">
              Bonificacion: +1 punto al atleta con mas X en cada jornada. Si hay empate, todos los empatados reciben el bonus.
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Jornadas
          </p>
          {roundTables.map((round: any) => (
            <details key={round.id} className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Jornada {round.round_number}
                  </p>
                  <h3 className="mt-1 text-2xl font-black">{round.round_date}</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-slate-300">
                  {round.ranking.length} validados
                </span>
              </summary>

              <div className="border-t border-white/10 p-5">
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <TableHeader columns={["#", "Atleta / club", "Score", "X", "10s", "Pts", "Estado"]} wide />
                  {rankResults(round.indoor_league_results || []).map((result: any, index: number) => {
                    const scored = round.ranking.find((row: any) => row.id === result.id);
                    return (
                      <div key={result.id} className="grid grid-cols-[54px_1fr_90px_70px_70px_70px_120px] gap-2 border-t border-white/10 px-4 py-4 text-sm font-bold text-slate-200">
                        <span>{index + 1}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-black text-white">{getName(result.athlete_profiles?.users, "Atleta")}</span>
                          <span className="block truncate text-xs text-slate-500">{result.clubs?.name || "Club"}</span>
                        </span>
                        <span className="font-black text-cyan-300">{result.total_score}</span>
                        <span>{result.x_count}</span>
                        <span>{result.tens_count}</span>
                        <span className="font-black text-yellow-300">{scored?.points || 0}</span>
                        <span>
                          <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase ${resultBadge(result.status)}`}>
                            {label(result.status)}
                          </span>
                          {profile.role === "admin" && result.status === "pending" && (
                            <span className="mt-2 flex gap-1">
                              <ValidateButton leagueId={league.id} resultId={result.id} status="validated" />
                              <ValidateButton leagueId={league.id} resultId={result.id} status="rejected" />
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {(round.indoor_league_results || []).length === 0 && <EmptyRow text="Sin capturas en esta jornada." />}
                </div>
              </div>
            </details>
          ))}
        </section>
      </div>
    </main>
  );
}

function ValidateButton({
  leagueId,
  resultId,
  status,
}: {
  leagueId: string;
  resultId: string;
  status: "validated" | "rejected";
}) {
  const isValid = status === "validated";
  return (
    <form action={validateIndoorLeagueResult}>
      <input type="hidden" name="league_id" value={leagueId} />
      <input type="hidden" name="result_id" value={resultId} />
      <input type="hidden" name="status" value={status} />
      <button title={isValid ? "Validar" : "Rechazar"} className={`rounded-lg p-1 ${isValid ? "bg-emerald-400 text-slate-950" : "bg-red-500 text-white"}`}>
        {isValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      </button>
    </form>
  );
}

function TableHeader({ columns }: { columns: string[]; wide?: boolean }) {
  const grid =
    columns.length === 5
      ? "grid-cols-[54px_1fr_70px_90px_70px]"
      : "grid-cols-[54px_1fr_90px_70px_70px_70px_120px]";
  return (
    <div className={`grid ${grid} gap-2 bg-slate-950/80 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500`}>
      {columns.map((column) => (
        <span key={column}>{column}</span>
      ))}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm font-bold text-slate-500">{text}</div>;
}

function Metric({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  value: number | string;
}) {
  return (
    <div className="tal-metric-card">
      <span className="tal-metric-icon">
        <Icon size={20} />
      </span>
      <p className="tal-metric-label">{title}</p>
      <p className="tal-metric-value">{value}</p>
    </div>
  );
}
