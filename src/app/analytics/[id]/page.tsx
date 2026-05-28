import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardAnalytics } from "@/components/dashboard-analytics";
import { AnalyticsInsights } from "@/components/analytics-insights";

export const dynamic = "force-dynamic";

export default async function AthleteAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    date_from?: string;
    date_to?: string;
  }>;
}) {
  const supabase = await createClient();

  const { id: athleteId } = await params;
  const queryParams = await searchParams;

  const dateFrom = queryParams?.date_from || "";
  const dateTo = queryParams?.date_to || "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Link
          href="/login"
          className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
        >
          Iniciar sesión
        </Link>
      </main>
    );
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select(`
      id,
      user_id,
      category,
      bow_type,
      users!athlete_profiles_user_id_fkey (
        name
      )
    `)
    .eq("id", athleteId)
    .single();

  if (!athlete) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8">
          <h1 className="text-3xl font-black text-red-300">
            Atleta no encontrado
          </h1>

          <Link
            href="/analytics"
            className="mt-5 inline-block text-sm font-black text-cyan-300"
          >
            ← Volver a analíticas
          </Link>
        </div>
      </main>
    );
  }

  if (currentUser?.role === "athlete" && athlete.user_id !== user.id) {
    const { data: ownAthlete } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (ownAthlete?.id) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8 text-center">
            <h1 className="text-2xl font-black text-red-300">
              No puedes ver analíticas de otro atleta.
            </h1>

            <Link
              href={`/analytics/${ownAthlete.id}`}
              className="mt-5 inline-block rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
            >
              Ir a mis analíticas
            </Link>
          </div>
        </main>
      );
    }
  }

  let query = supabase
    .from("training_sessions")
    .select(`
      id,
      training_date,
      total_score,
      total_arrows,
      average_score,
      athlete_id,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      ),
      training_rounds (
        id,
        series (
          id,
          series_number,
          total_score,
          arrows (
            id,
            score,
            is_x,
            position_x,
            position_y
          )
        )
      )
    `)
    .eq("athlete_id", athleteId)
    .order("training_date", { ascending: true });

  if (dateFrom) {
    query = query.gte("training_date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("training_date", dateTo);
  }

  const { data: trainings } = await query;

  const allSeries =
    trainings?.flatMap((training: any) =>
      training.training_rounds?.flatMap((round: any) => round.series || []) || []
    ) || [];

  const allArrows =
    allSeries?.flatMap((serie: any) => serie.arrows || []) || [];

  const totalScore =
    allSeries.reduce(
      (sum: number, serie: any) => sum + Number(serie.total_score || 0),
      0
    ) || 0;

  const totalArrows = allArrows.length;

  const averageScore =
    totalArrows > 0 ? Number((totalScore / totalArrows).toFixed(1)) : 0;

  const maxPossibleScore = totalArrows * 10;

  const accuracy =
    maxPossibleScore > 0
      ? Number(((totalScore / maxPossibleScore) * 100).toFixed(1))
      : 0;

  const xCount = allArrows.filter((arrow: any) => arrow.is_x).length;

  const monthlyScores =
    trainings?.map((training: any, index: number) => ({
      name: `E${index + 1}`,
      score: Number(training.total_score || 0),
    })) || [];

  const arrowDistribution = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(
    (score) => ({
      score: score === 0 ? "M" : String(score),
      count: allArrows.filter((arrow: any) => Number(arrow.score) === score)
        .length,
    })
  );

  const athleteUser = Array.isArray(athlete.users)
    ? athlete.users[0]
    : athlete.users;

  const athleteName = athleteUser?.name || "Atleta";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Athlete Analytics
            </p>

            <h1 className="mt-2 text-5xl font-black tracking-tight">
              Performance
              <span className="block text-cyan-300">Analytics Engine</span>
            </h1>

            <p className="mt-4 max-w-2xl text-slate-400">
              Analíticas de {athleteName}. Precisión, score, distribución de
              impactos y rendimiento por entrenamiento.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">
                {athlete.category || "Sin categoría"}
              </span>

              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">
                {athlete.bow_type || "Sin arco"}
              </span>
            </div>
          </div>

          <Link
            href={`/athletes/${athleteId}`}
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
          >
            ← Volver a ficha
          </Link>
        </div>

        <form
          method="GET"
          className="mb-8 grid grid-cols-1 gap-4 rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-2xl md:grid-cols-4"
        >
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Desde
            </label>

            <input
              name="date_from"
              type="date"
              defaultValue={dateFrom}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Hasta
            </label>

            <input
              name="date_to"
              type="date"
              defaultValue={dateTo}
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none focus:border-cyan-400"
            />
          </div>

          <button className="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300">
            Aplicar fechas
          </button>

          <Link
            href={`/analytics/${athleteId}`}
            className="mt-6 flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
          >
            Limpiar fechas
          </Link>
        </form>

        <div className="mb-8 grid grid-cols-2 gap-5 xl:grid-cols-4">
          <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <p className="text-sm font-bold text-slate-400">
              Accuracy promedio
            </p>

            <h2 className="mt-3 text-5xl font-black text-cyan-300">
              {accuracy}%
            </h2>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <p className="text-sm font-bold text-slate-400">
              Promedio general
            </p>

            <h2 className="mt-3 text-5xl font-black text-cyan-300">
              {averageScore}
            </h2>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <p className="text-sm font-bold text-slate-400">
              Flechas registradas
            </p>

            <h2 className="mt-3 text-5xl font-black text-cyan-300">
              {totalArrows}
            </h2>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <p className="text-sm font-bold text-slate-400">X Count</p>

            <h2 className="mt-3 text-5xl font-black text-yellow-300">
              {xCount}
            </h2>
          </div>
        </div>

        <AnalyticsInsights
          accuracy={accuracy}
          averageScore={averageScore}
          xCount={xCount}
          totalArrows={totalArrows}
          trainingsCount={trainings?.length || 0}
        />

        <DashboardAnalytics
          monthlyScores={monthlyScores}
          arrowDistribution={arrowDistribution}
          accuracy={accuracy}
        />
      </div>
    </main>
  );
}