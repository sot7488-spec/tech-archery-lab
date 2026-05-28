export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Calendar, Medal, Target, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageProps = {
  searchParams?: Promise<{
    mark_id?: string;
  }>;
};

export default async function ClasificadosConadePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const markId = params?.mark_id || "";

  const { data: mark, error: markError } = await supabase
    .from("conade_marks")
    .select("*")
    .eq("id", markId)
    .single();

  if (markError || !mark) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-7 text-white">
        <div className="mx-auto max-w-7xl">
          <Link href="/conade" className="text-cyan-300">
            ← Regresar a CONADE
          </Link>

          <div className="mt-8 rounded-[2rem] border border-red-400/20 bg-red-500/10 p-6 text-red-200">
            No se encontró la marca CONADE seleccionada.
          </div>
        </div>
      </main>
    );
  }

  const yearStart = `${mark.year}-01-01`;
  const yearEnd = `${mark.year}-12-31`;

  const { data: trainings } = await supabase
    .from("training_sessions")
    .select(`
      id,
      athlete_id,
      training_date,
      total_score,
      total_arrows,
      athlete_profiles (
        id,
        category,
        bow_type,
        photo_url,
        dominant_hand,
        association_id,
        federation_id,
        users!athlete_profiles_user_id_fkey (
          name,
          email
        ),
        clubs (
          id,
          name
        )
      )
    `)
    .eq("athlete_profiles.category", mark.category)
    .eq("athlete_profiles.bow_type", mark.bow_type)
    .gte("total_score", mark.minimum_score)
    .gte("training_date", yearStart)
    .lte("training_date", yearEnd)
    .order("total_score", { ascending: false });

  const classifiedMap = new Map();

  trainings?.forEach((training: any) => {
    const athleteId = training.athlete_id;

    if (!training.athlete_profiles) return;

    if (!classifiedMap.has(athleteId)) {
      classifiedMap.set(athleteId, training);
      return;
    }

    const current = classifiedMap.get(athleteId);

    if (Number(training.total_score || 0) > Number(current.total_score || 0)) {
      classifiedMap.set(athleteId, training);
    }
  });

  const classified = Array.from(classifiedMap.values());

  const getUser = (athleteProfile: any) =>
    Array.isArray(athleteProfile?.users)
      ? athleteProfile.users[0]
      : athleteProfile?.users;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/conade"
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <ArrowLeft size={16} />
            CONADE
          </Link>
        </div>

        <section className="mb-6 overflow-hidden rounded-[2.2rem] border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-7 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL CONADE Ranking
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Atletas
                <span className="block text-cyan-300">Clasificados</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Atletas con score de entrenamiento igual o superior a la marca
                mínima CONADE seleccionada dentro del año correspondiente.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-yellow-300/20 bg-yellow-300/10 px-6 py-4 text-yellow-300 shadow-[0_0_35px_rgba(250,204,21,0.12)]">
              <p className="text-xs font-black uppercase">Marca mínima</p>
              <p className="text-5xl font-black">{mark.minimum_score}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <Target className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Categoría
            </p>
            <p className="mt-2 text-2xl font-black">{mark.category}</p>
          </div>

          <div className="rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <Trophy className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Modalidad
            </p>
            <p className="mt-2 text-2xl font-black text-cyan-300">
              {mark.bow_type}
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <Medal className="mb-3 text-yellow-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Clasificados
            </p>
            <p className="mt-2 text-4xl font-black text-yellow-300">
              {classified.length}
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <Calendar className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Año
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {mark.year}
            </p>
          </div>
        </section>

        {classified.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
            Ningún atleta ha superado esta marca todavía.
          </div>
        ) : (
          <section className="space-y-4">
            {classified.map((training: any, index: number) => {
              const athlete = training.athlete_profiles;
              const user = getUser(athlete);

              return (
                <Link
                  href={`/athletes/${athlete.id}`}
                  key={training.id}
                  className="group relative block overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-4 shadow-[0_0_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/[0.06]"
                >
                  <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[80px_1.4fr_1fr_auto] md:items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-cyan-400/15 bg-slate-900 text-3xl font-black text-cyan-300">
                      #{index + 1}
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                          {athlete?.bow_type}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {athlete?.category}
                        </span>
                      </div>

                      <h2 className="text-2xl font-black text-white">
                        {user?.name || "Sin nombre"}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {user?.email || "Sin correo"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-xs font-bold text-slate-500">
                          Fecha
                        </p>
                        <p className="mt-1 font-black text-white">
                          {training.training_date}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-xs font-bold text-slate-500">
                          Flechas
                        </p>
                        <p className="mt-1 font-black text-white">
                          {training.total_arrows || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-yellow-300/20 bg-yellow-300/10 p-4 text-center">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">
                        Mejor score
                      </p>
                      <p className="mt-1 text-4xl font-black text-yellow-300">
                        {training.total_score}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}