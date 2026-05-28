import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardAnalytics } from "@/components/dashboard-analytics";
import { AnalyticsInsights } from "@/components/analytics-insights";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
    searchParams?: Promise<{
  athlete_id?: string;
  date_from?: string;
  date_to?: string;
}>;
}) {
  const supabase = await createClient();

  const params = await searchParams;
  const selectedAthleteId = params?.athlete_id || "";
    const dateFrom = params?.date_from || "";
const dateTo = params?.date_to || "";
  const { data: athletes } = await supabase
    .from("athlete_profiles")
    .select(`
      id,
      users!athlete_profiles_user_id_fkey (
        name
      )
    `);

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
    .order("training_date", { ascending: true });

  if (selectedAthleteId) {
    query = query.eq("athlete_id", selectedAthleteId);
  }

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

  const selectedAthlete = athletes?.find(
    (athlete: any) => athlete.id === selectedAthleteId
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Analytics Center
            </p>

            <h1 className="mt-2 text-5xl font-black tracking-tight">
              Performance
              <span className="block text-cyan-300">Analytics Engine</span>
            </h1>

            <p className="mt-4 max-w-2xl text-slate-400">
              {selectedAthlete
                ? `Analíticas de ${
                    (selectedAthlete.users as any)?.name || "atleta"
                  }`
                : "Analíticas generales de precisión, score, distribución de impactos y rendimiento."}
            </p>
          </div>

          <Link
            href="/"
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
          >
            ← Dashboard
          </Link>
        </div>

        <section className="mb-8 rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-2xl">
          <h2 className="mb-4 text-xl font-black">Filtrar por atleta</h2>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/analytics"
              className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                !selectedAthleteId
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              Todos
            </Link>

            {athletes?.map((athlete: any) => (
              <Link
                key={athlete.id}
                href={`/analytics?athlete_id=${athlete.id}`}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  selectedAthleteId === athlete.id
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {athlete.users?.name}
              </Link>
            ))}
          </div>
        </section>

        <form
  method="GET"
  className="mb-8 grid grid-cols-1 gap-4 rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-2xl md:grid-cols-4"
>
  <input type="hidden" name="athlete_id" value={selectedAthleteId} />

  <input
    name="date_from"
    type="date"
    defaultValue={dateFrom}
    className="h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none focus:border-cyan-400"
  />

  <input
    name="date_to"
    type="date"
    defaultValue={dateTo}
    className="h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none focus:border-cyan-400"
  />

  <button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300">
    Aplicar fechas
  </button>

  <Link
    href={selectedAthleteId ? `/analytics?athlete_id=${selectedAthleteId}` : "/analytics"}
    className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
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