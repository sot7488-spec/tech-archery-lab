export const dynamic = "force-dynamic";

import { TargetHeatmap } from "@/components/target-heatmap";
import { AthleteCharts } from "@/components/athlete-charts";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function AthleteProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    distance?: string;
  }>;
}) {
  const { id } = await params;
  const filters = await searchParams;

  const from = filters.from || "";
  const to = filters.to || "";
  const distance = filters.distance || "";

  const { data: athlete, error } = await supabase
    .from("athlete_profiles")
    .select(`
      *,
      users!athlete_profiles_user_id_fkey (
        name,
        email,
        phone,
        profile_photo_url
      ),
      training_sessions (
        *,
        training_rounds (
          *,
          series (
            *,
            arrows (
              *
            )
          )
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !athlete) {
    return (
      <main className="min-h-screen p-8 text-white">
        <Link href="/athletes" className="text-cyan-300">
          ← Volver a atletas
        </Link>

        <div className="mt-6 rounded-[32px] border border-red-400/20 bg-red-500/10 p-6 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-black text-red-300">
            Atleta no encontrado
          </h1>

          <pre className="mt-4 text-sm text-red-300">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const trainings = athlete.training_sessions || [];

  const filteredTrainings = trainings.filter((training: any) => {
    const trainingDate = training.training_date;

    const matchFrom = from ? trainingDate >= from : true;
    const matchTo = to ? trainingDate <= to : true;

    const hasDistance = distance
      ? training.training_rounds?.some(
          (round: any) => Number(round.distance_meters) === Number(distance)
        )
      : true;

    return matchFrom && matchTo && hasDistance;
  });

  const allSeries = filteredTrainings.flatMap(
    (training: any) =>
      training.training_rounds?.flatMap(
        (round: any) => round.series || []
      ) || []
  );

  const allArrows = allSeries.flatMap((serie: any) => serie.arrows || []);

  const totalTrainings = filteredTrainings.length;
  const totalSeries = allSeries.length;
  const totalArrows = allArrows.length;

  const totalScore = allArrows.reduce(
    (sum: number, arrow: any) => sum + Number(arrow.score),
    0
  );

  const averageScore =
    totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : "0.00";

  const totalX = allArrows.filter((arrow: any) => arrow.is_x).length;

  const bestSeries = [...allSeries].sort(
    (a: any, b: any) => Number(b.total_score) - Number(a.total_score)
  )[0];

  const completedTrainings = filteredTrainings.filter(
    (training: any) => training.status === "completed"
  ).length;

  const activeTrainings = filteredTrainings.filter(
    (training: any) => training.status !== "completed"
  ).length;

  const trainingChartData = filteredTrainings
    .map((training: any) => {
      const trainingSeries =
        training.training_rounds?.flatMap(
          (round: any) => round.series || []
        ) || [];

      const trainingArrows =
        trainingSeries.flatMap((serie: any) => serie.arrows || []) || [];

      const trainingScore = trainingArrows.reduce(
        (sum: number, arrow: any) => sum + Number(arrow.score),
        0
      );

      const average =
        trainingArrows.length > 0
          ? Number((trainingScore / trainingArrows.length).toFixed(2))
          : 0;

      return {
        date: training.training_date,
        average,
        score: trainingScore,
      };
    })
    .reverse();

  const xChartData = filteredTrainings
    .map((training: any) => {
      const trainingSeries =
        training.training_rounds?.flatMap(
          (round: any) => round.series || []
        ) || [];

      const trainingArrows =
        trainingSeries.flatMap((serie: any) => serie.arrows || []) || [];

      const xCount = trainingArrows.filter(
        (arrow: any) => arrow.is_x === true
      ).length;

      return {
        date: training.training_date,
        xCount,
      };
    })
    .reverse();

  const distanceMap = new Map();

  filteredTrainings.forEach((training: any) => {
    training.training_rounds?.forEach((round: any) => {
      const roundDistance = Number(round.distance_meters);

      if (!roundDistance) return;

      round.series?.forEach((serie: any) => {
        serie.arrows?.forEach((arrow: any) => {
          if (!distanceMap.has(roundDistance)) {
            distanceMap.set(roundDistance, {
              distance: `${roundDistance} m`,
              totalScore: 0,
              totalArrows: 0,
            });
          }

          const item = distanceMap.get(roundDistance);

          item.totalScore += Number(arrow.score);
          item.totalArrows += 1;
        });
      });
    });
  });

  const distanceChartData = Array.from(distanceMap.values())
    .map((item: any) => ({
      distance: item.distance,
      average: Number((item.totalScore / item.totalArrows).toFixed(2)),
      arrows: item.totalArrows,
    }))
    .sort(
      (a: any, b: any) =>
        Number(a.distance.replace(" m", "")) -
        Number(b.distance.replace(" m", ""))
    );

  const bestScoreTraining = [...filteredTrainings]
    .filter((training: any) => Number(training.total_score) > 0)
    .sort(
      (a: any, b: any) =>
        Number(b.total_score) - Number(a.total_score)
    )[0];

  const mostXTraining = filteredTrainings
    .map((training: any) => {
      const trainingSeries =
        training.training_rounds?.flatMap(
          (round: any) => round.series || []
        ) || [];

      const trainingArrows =
        trainingSeries.flatMap((serie: any) => serie.arrows || []) || [];

      return {
        ...training,
        xCount: trainingArrows.filter((arrow: any) => arrow.is_x).length,
      };
    })
    .sort((a: any, b: any) => b.xCount - a.xCount)[0];

  const bestDistanceAverage = [...distanceChartData]
    .filter((item: any) => item.arrows > 0)
    .sort((a: any, b: any) => b.average - a.average)[0];

  const insights = [];

  if (Number(averageScore) >= 9) {
    insights.push(
      "Rendimiento alto: el promedio general está por encima de 9 puntos por flecha."
    );
  } else if (Number(averageScore) >= 8) {
    insights.push(
      "Rendimiento sólido: el promedio general está entre 8 y 9 puntos por flecha."
    );
  } else if (totalArrows > 0) {
    insights.push(
      "Área de mejora: el promedio general está por debajo de 8 puntos por flecha."
    );
  }

  if (bestDistanceAverage) {
    insights.push(
      `Mejor rendimiento por distancia: ${bestDistanceAverage.distance} con promedio de ${bestDistanceAverage.average}.`
    );
  }

  if (distanceChartData.length > 1) {
    const sortedDistances = [...distanceChartData].sort(
      (a: any, b: any) =>
        Number(a.distance.replace(" m", "")) -
        Number(b.distance.replace(" m", ""))
    );

    const shortest = sortedDistances[0];
    const longest = sortedDistances[sortedDistances.length - 1];

    if (shortest.average - longest.average >= 1) {
      insights.push(
        `El rendimiento baja en distancias largas: de ${shortest.average} en ${shortest.distance} a ${longest.average} en ${longest.distance}.`
      );
    }
  }

  if (totalArrows >= 30) {
    const xRate = totalX / totalArrows;

    if (xRate >= 0.2) {
      insights.push(
        `Buen porcentaje de X: ${Math.round(
          xRate * 100
        )}% de las flechas registradas son X.`
      );
    } else {
      insights.push(
        `Oportunidad de precisión: solo ${Math.round(
          xRate * 100
        )}% de las flechas registradas son X.`
      );
    }
  }

  if (completedTrainings > 0 && activeTrainings > 0) {
    insights.push(
      "Hay entrenamientos activos pendientes de finalizar. Conviene cerrarlos para congelar estadísticas."
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Aún se necesitan más entrenamientos registrados para generar análisis automático."
    );
  }

  return (
    <main className="min-h-screen p-8 text-white">
      <Link href="/athletes" className="text-cyan-300 hover:text-cyan-200">
        ← Volver a atletas
      </Link>

      <section className="mb-6 mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-blue-500/10 p-6 shadow-2xl backdrop-blur md:p-8">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex flex-col gap-5 md:flex-row md:items-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-[28px] bg-cyan-400/30 blur-xl" />

        <img
          src={athlete.photo_url || "/tal.png"}
          alt={athlete.users?.name || "Atleta"}
          className="relative h-28 w-28 rounded-[28px] border border-cyan-400/40 bg-slate-950 object-cover p-1 shadow-xl md:h-36 md:w-36"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">
          Athlete Performance
        </p>

        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          {athlete.users?.name}
        </h1>

        <p className="mt-2 text-slate-300">{athlete.users?.email}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/20 px-4 py-2 text-sm font-bold text-cyan-300">
            {athlete.bow_type || "Arco"}
          </span>

          <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">
            {athlete.category || "Sin categoría"}
          </span>

          <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">
            {athlete.dominant_hand || "Sin dominante"}
          </span>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
      <Link
        href={`/trainings?athlete_id=${athlete.id}`}
        className="rounded-2xl bg-cyan-400 px-5 py-3 text-center font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:bg-cyan-300"
      >
        Ver entrenamientos
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Libras
        </p>
        <p className="text-2xl font-black text-white">
          {athlete.draw_weight_lbs || "-"}
        </p>
      </div>
    </div>
  </div>
</section>
      <section className="mb-6 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <h3 className="mb-5 text-2xl font-black text-white">Filtros</h3>

        <form className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />

          <input
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />

          <select
            name="distance"
            defaultValue={distance}
            className="rounded-2xl border border-white/10 bg-[#020617]/60 p-4 text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="">Todas las distancias</option>
            <option value="18">18 m</option>
            <option value="30">30 m</option>
            <option value="40">40 m</option>
            <option value="50">50 m</option>
            <option value="60">60 m</option>
            <option value="70">70 m</option>
          </select>

          <button className="rounded-2xl bg-cyan-400 p-4 font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300">
            Aplicar filtros
          </button>
        </form>

        <div className="mt-4">
          <a href={`/athletes/${id}`} className="text-sm text-cyan-300">
            Limpiar filtros
          </a>
        </div>
      </section>

     

      <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <StatCard title="Entrenamientos" value={totalTrainings} />
        <StatCard title="Series" value={totalSeries} />
        <StatCard title="Flechas" value={totalArrows} />
        <StatCard title="Promedio" value={averageScore} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <StatCard title="Score acumulado" value={totalScore} />
        <StatCard title="Total X" value={totalX} />
        <StatCard title="Activos" value={activeTrainings} />
        <StatCard title="Finalizados" value={completedTrainings} />
      </section>

      <AthleteCharts
        trainingChartData={trainingChartData}
        xChartData={xChartData}
        distanceChartData={distanceChartData}
      />

      <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <h3 className="mb-5 text-2xl font-black text-white">
            PRs / Récords personales
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RecordCard
              title="Mejor serie"
              value={bestSeries ? bestSeries.total_score : "-"}
              detail={
                bestSeries ? `Serie #${bestSeries.series_number}` : "Sin series"
              }
            />

            <RecordCard
              title="Mejor score"
              value={bestScoreTraining ? bestScoreTraining.total_score : "-"}
              detail={
                bestScoreTraining
                  ? bestScoreTraining.training_date
                  : "Sin entrenamientos"
              }
            />

            <RecordCard
              title="Más X"
              value={mostXTraining ? mostXTraining.xCount : "-"}
              detail={mostXTraining ? mostXTraining.training_date : "Sin datos"}
            />

            <RecordCard
              title="Mejor promedio por distancia"
              value={bestDistanceAverage ? bestDistanceAverage.average : "-"}
              detail={
                bestDistanceAverage
                  ? bestDistanceAverage.distance
                  : "Sin distancia"
              }
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <h3 className="mb-5 text-2xl font-black text-white">
            Análisis automático
          </h3>

          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-sm text-slate-200"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur lg:col-span-2">
          <h3 className="mb-5 text-2xl font-black text-white">
            Entrenamientos recientes
          </h3>

          <div className="space-y-3">
            {filteredTrainings.slice(0, 6).map((training: any) => (
              <Link
                key={training.id}
                href={`/trainings/${training.id}`}
                className="flex justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div>
                  <p className="font-bold text-white">
                    {training.training_date}
                  </p>

                  <p className="text-sm text-slate-400">
                    {training.location || "Sin ubicación"} ·{" "}
                    {training.session_type || "Entrenamiento"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-white">
                    {training.total_score || 0} pts
                  </p>

                  <p className="text-sm text-slate-400">
                    {training.total_arrows || 0} flechas
                  </p>
                </div>
              </Link>
            ))}

            {filteredTrainings.length === 0 && (
              <p className="text-slate-400">
                Este atleta no tiene entrenamientos con los filtros aplicados.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <h3 className="mb-5 text-2xl font-black text-white">Mejor serie</h3>

          {bestSeries ? (
            <div>
              <p className="text-6xl font-black text-white">
                {bestSeries.total_score}
              </p>

              <p className="mt-3 text-slate-400">
                Serie #{bestSeries.series_number}
              </p>

              <p className="mt-4 text-sm text-slate-400">
                Promedio: {Number(bestSeries.average_score || 0).toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-slate-400">Aún no hay series registradas.</p>
          )}
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <InfoCard title="Categoría" value={athlete.category || "-"} />
        <InfoCard title="Mano dominante" value={athlete.dominant_hand || "-"} />
        <InfoCard title="Libras" value={athlete.draw_weight_lbs || "-"} />
        <InfoCard title="Tipo de arco" value={athlete.bow_type || "-"} />
      </section>

      <section className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <TargetHeatmap arrows={allArrows} />
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>

      <h2 className="mt-3 text-5xl font-black text-white">{value}</h2>
    </div>
  );
}

function RecordCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-5 shadow-xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
        {title}
      </p>

      <h4 className="mt-3 text-5xl font-black text-white">{value}</h4>

      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>

      <h2 className="mt-3 text-2xl font-black text-white">{value}</h2>
    </div>
  );
}