import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ScoreChart from "@/components/ScoreChart";
export const dynamic = "force-dynamic";



export default async function DashboardPage() {
  const { count: athletesCount } = await supabase
    .from("athlete_profiles")
    .select("*", { count: "exact", head: true });

  const { count: trainingsCount } = await supabase
    .from("training_sessions")
    .select("*", { count: "exact", head: true });

  const { data: latestTrainings } = await supabase
    .from("training_sessions")
    .select(`
      id,
      training_date,
      location,
      session_type,
      total_score,
      status,
      athlete_profiles (
        users!athlete_profiles_user_id_fkey (
          name
        )
      )
    `)
    .order("training_date", { ascending: false })
    .limit(5);

const scoreChartData =
  latestTrainings?.map((training: any) => ({
    date: training.training_date,
    score: Number(training.total_score || 0),
  })) || [];

  const totalScore =
    latestTrainings?.reduce(
      (sum: number, training: any) => sum + Number(training.total_score || 0),
      0
    ) || 0;

  const avgLatestScore =
    latestTrainings && latestTrainings.length > 0
      ? Math.round(totalScore / latestTrainings.length)
      : 0;

      const now = new Date();

const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  .toISOString()
  .split("T")[0];

const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  .toISOString()
  .split("T")[0];

const { data: monthTrainings } = await supabase
  .from("training_sessions")
  .select(`
    id,
    athlete_id,
    total_score,
    training_date,
    athlete_profiles (
      id,
      category,
      bow_type,
      users!athlete_profiles_user_id_fkey (
        name
      )
    )
  `)
  .gte("training_date", startOfMonth)
  .lte("training_date", endOfMonth);

const athleteRanking =
  monthTrainings?.reduce((acc: any, training: any) => {
    const athleteId = training.athlete_id;

    if (!acc[athleteId]) {
      acc[athleteId] = {
        athlete: training.athlete_profiles,
        totalScore: 0,
        trainings: 0,
      };
    }

    acc[athleteId].totalScore += Number(training.total_score || 0);
    acc[athleteId].trainings += 1;

    return acc;
  }, {}) || {};

const archerOfMonth = Object.values(athleteRanking).sort(
  (a: any, b: any) => b.totalScore - a.totalScore
)[0] as any;


  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-8 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-300">
            Tech Archery Lab
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">
            Archery
            <span className="block text-cyan-300">Performance Lab</span>
          </h1>

          <p className="mt-4 max-w-2xl text-slate-300">
            Dashboard general de atletas, entrenamientos y rendimiento.
          </p>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Atletas</p>
            <p className="mt-2 text-4xl font-black">{athletesCount || 0}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Entrenamientos</p>
            <p className="mt-2 text-4xl font-black">{trainingsCount || 0}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <p className="text-sm font-bold text-slate-500">Últimos score</p>
            <p className="mt-2 text-4xl font-black">{totalScore}</p>
          </div>

          <div className="rounded-3xl bg-cyan-400 p-5 text-slate-950 shadow-xl shadow-cyan-500/20">
            <p className="text-sm font-bold">Prom. últimos</p>
            <p className="mt-2 text-4xl font-black">{avgLatestScore}</p>
          </div>
        </section>

        <section className="mb-8 rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400 to-cyan-200 p-6 text-slate-950 shadow-2xl shadow-cyan-500/20">
  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-sm font-black uppercase tracking-[0.25em]">
        Arquero del mes
      </p>

      <h2 className="mt-2 text-4xl font-black">
        {archerOfMonth?.athlete?.users?.name || "Sin datos"}
      </h2>

      <p className="mt-2 font-bold text-slate-700">
        {archerOfMonth
          ? `${archerOfMonth.trainings} entrenamientos registrados este mes`
          : "Aún no hay entrenamientos este mes"}
      </p>
    </div>

    <div className="rounded-3xl bg-slate-950 px-6 py-5 text-white">
      <p className="text-xs font-black uppercase text-cyan-300">
        Score mensual
      </p>

      <p className="text-5xl font-black">
        {archerOfMonth?.totalScore || 0}
      </p>
    </div>
  </div>
</section>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Link
            href="/athletes"
            className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:text-slate-950"
          >
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Módulo
            </p>
            <h2 className="mt-3 text-3xl font-black">Atletas</h2>
            <p className="mt-3 text-slate-400">
              Registro y perfil técnico de arqueros.
            </p>
          </Link>

          <Link
            href="/trainings"
            className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:bg-white hover:text-slate-950"
          >
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Módulo
            </p>
            <h2 className="mt-3 text-3xl font-black">Entrenamientos</h2>
            <p className="mt-3 text-slate-400">
              Control de sesiones, objetivos y resultados.
            </p>
          </Link>

          <Link
            href="/conade"
            className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400 p-6 text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:bg-cyan-300"
          >
            <p className="text-sm font-black uppercase tracking-[0.25em]">
              Ranking
            </p>
            <h2 className="mt-3 text-3xl font-black">CONADE</h2>
            <p className="mt-3 font-medium text-slate-800">
              Control de marcas y comparativo competitivo.
            </p>
          </Link>
        </section>

        <section className="rounded-[2rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 p-6 text-white shadow-2xl">
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
        Training Log
      </p>

      <h2 className="mt-2 text-2xl font-black">
        Últimos entrenamientos
      </h2>

      <p className="mt-1 text-sm font-medium text-slate-400">
        Registro reciente de sesiones capturadas.
      </p>
    </div>

    <Link
      href="/trainings"
      className="w-fit rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
    >
      Ver todos
    </Link>
  </div>

  <div className="space-y-3">
    {latestTrainings?.map((training: any, index: number) => (
      <Link
        key={training.id}
        href={`/trainings/${training.id}`}
        className="group grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-400/10 md:grid-cols-12 md:items-center"
      >
        <div className="flex items-center gap-4 md:col-span-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            #{index + 1}
          </div>

          <div>
            <p className="font-black text-white">
              {training.athlete_profiles?.users?.name || "Atleta"}
            </p>

            <p className="text-sm text-slate-400">
              {training.training_date}
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Tipo
          </p>
          <p className="text-sm font-black text-slate-200">
            {training.session_type || "Entrenamiento"}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Lugar
          </p>
          <p className="text-sm font-black text-slate-200">
            {training.location || "Sin ubicación"}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Score
          </p>
          <p className="text-2xl font-black text-cyan-300">
            {training.total_score || 0}
            <span className="ml-1 text-xs text-slate-500">pts</span>
          </p>
        </div>

        <div className="flex items-center justify-start gap-3 md:col-span-2 md:justify-end">
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase text-cyan-300">
            {training.status || "draft"}
          </span>

          <span className="text-lg font-black text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300">
            →
          </span>
        </div>
      </Link>
    ))}

    {latestTrainings?.length === 0 && (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-400">
        Aún no hay entrenamientos registrados.
      </div>
    )}
  </div>
</section>
      </div>
    </main>
  );
}