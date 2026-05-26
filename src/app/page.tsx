import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScoreChart from "@/components/ScoreChart";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

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

  return (
    <main className="min-h-screen tal-radial tal-grid-bg px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              Panel principal
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Sesión: {profile.name} · {profile.role}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/athletes"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
            >
              Atletas
            </Link>

            <Link
              href="/trainings"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
            >
              Entrenamientos
            </Link>

            <LogoutButton />
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900/95 via-slate-950 to-cyan-950/40 p-8 shadow-[0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-xl">
          <div className="absolute right-[-120px] top-[-120px] h-[340px] w-[340px] rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-cyan-300">
                TECH ARCHERY LAB
              </p>

              <h1 className="mt-5 text-5xl font-black tracking-tight text-white md:text-7xl">
                Archery
                <span className="block tal-text-glow text-cyan-300">
                  Performance Lab
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                Plataforma avanzada de análisis, entrenamiento y telemetría para
                arqueros de alto rendimiento.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="tal-card tal-glow p-5">
                <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                  ATHLETES
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {athletesCount || 0}
                </p>
              </div>

              <div className="tal-card tal-glow p-5">
                <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                  TRAININGS
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {trainingsCount || 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="tal-card tal-glow p-5">
            <p className="text-sm font-bold text-slate-400">Atletas</p>
            <p className="mt-2 text-4xl font-black text-white">
              {athletesCount || 0}
            </p>
          </div>

          <div className="tal-card tal-glow p-5">
            <p className="text-sm font-bold text-slate-400">
              Entrenamientos
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {trainingsCount || 0}
            </p>
          </div>

          <div className="tal-card tal-glow p-5">
            <p className="text-sm font-bold text-slate-400">
              Últimos score
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {totalScore}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-white shadow-xl shadow-cyan-500/20 backdrop-blur-xl">
            <p className="text-sm font-bold text-cyan-300">
              Prom. últimos
            </p>
            <p className="mt-2 text-4xl font-black">{avgLatestScore}</p>
          </div>
        </section>

        <section className="tal-panel tal-glow p-6">
          <ScoreChart data={scoreChartData} />
        </section>
      </div>
    </main>
  );
}