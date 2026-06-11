export const dynamic = "force-dynamic";

import { TargetHeatmap } from "@/components/target-heatmap";
import { AthleteCharts } from "@/components/athlete-charts";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ViewReveal } from "@/components/ViewReveal";
import AthleteManageModal from "../AthleteManageModal";
import AchievementZoneEditButton from "./AchievementZoneEditButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarClock,
  Crosshair,
  Dumbbell,
  Filter,
  Gauge,
  Mail,
  Medal,
  Phone,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

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

  if (currentUser?.role === "coach" && athlete.club_id !== currentUser.club_id) {
    redirect("/athletes");
  }

  if (currentUser?.role === "athlete" && athlete.user_id !== user.id) {
    redirect("/athletes/profile");
  }

  const canManageAthlete =
    currentUser?.role === "admin" || currentUser?.role === "coach";

  const clubsForRelocationQuery = supabase
    .from("clubs")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (athlete.club_id) {
    clubsForRelocationQuery.neq("id", athlete.club_id);
  }

  const { data: clubsForRelocationRaw } = canManageAthlete
    ? await clubsForRelocationQuery
    : { data: [] };

  const { data: supportStaffRaw } = athlete.club_id
    ? await supabase
        .from("performance_staff")
        .select(
          "id, staff_type, name, email, phone, specialty, certification_level, certification_institution"
        )
        .eq("club_id", athlete.club_id)
        .eq("is_active", true)
        .order("staff_type", { ascending: true })
        .order("name", { ascending: true })
    : { data: [] };

  const supportStaff = supportStaffRaw || [];

  const trainings = athlete.training_sessions || [];
  const getScoringSeries = (training: any) =>
    training.training_rounds?.flatMap((round: any) =>
      round.scoring_enabled === false ? [] : round.series || []
    ) || [];
  const achievementZoneMin = Number(athlete.achievement_zone_min_score ?? 9);
  const achievementZoneMax = Number(athlete.achievement_zone_max_score ?? 10);
  const achievementZoneLabel = `${achievementZoneMin}-${achievementZoneMax}`;

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

  const allSeries = filteredTrainings.flatMap((training: any) =>
    getScoringSeries(training)
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
  const achievementZoneHits = allArrows.filter((arrow: any) => {
    const score = Number(arrow.score);

    return score >= achievementZoneMin && score <= achievementZoneMax;
  }).length;
  const achievementZoneEffectiveness =
    totalArrows > 0
      ? Number(((achievementZoneHits / totalArrows) * 100).toFixed(1))
      : 0;

  const bestSeries = [...allSeries].sort(
    (a: any, b: any) => Number(b.total_score) - Number(a.total_score)
  )[0];

  const completedTrainings = filteredTrainings.filter(
    (training: any) => training.status === "completed"
  ).length;

  const activeTrainings = filteredTrainings.filter(
    (training: any) => training.status !== "completed"
  ).length;

  const primaryStats: StatItem[] = [
    { title: "Entrenamientos", value: totalTrainings, icon: Activity },
    { title: "Series", value: totalSeries, icon: BarChart3 },
    { title: "Flechas", value: totalArrows, icon: Crosshair },
    { title: "Promedio", value: averageScore, icon: Gauge, accent: true },
  ];

  const secondaryStats: StatItem[] = [
    { title: "Score acumulado", value: totalScore, icon: Target },
    { title: "Total X", value: totalX, icon: X, tone: "text-yellow-300" },
    {
      title: "Efectividad zona",
      value: `${achievementZoneEffectiveness}%`,
      icon: Medal,
      tone: "text-emerald-300",
    },
    { title: "Activos", value: activeTrainings, icon: CalendarClock },
  ];

  const trainingChartData = filteredTrainings
    .map((training: any) => {
      const trainingSeries = getScoringSeries(training);

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
      const trainingSeries = getScoringSeries(training);

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
      if (round.scoring_enabled === false) return;

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
      const trainingSeries = getScoringSeries(training);

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
      

      <section className="tal-hero-panel mb-6 mt-6 p-6 md:p-8">
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
        <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          Athlete Performance
        </p>

        <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-5xl">
          {athlete.users?.name}
        </h1>

        <p className="mt-2 text-slate-300">{athlete.users?.email}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className="tal-chip">
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
        className="tal-button inline-flex items-center justify-center gap-2"
      >
        <ArrowRight size={18} />
        Ver entrenamientos
      </Link>

      <div className="tal-metric-card px-5 py-3 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Zona de logro
          </p>
          {canManageAthlete && (
            <AchievementZoneEditButton
              athleteId={athlete.id}
              minScore={achievementZoneMin}
              maxScore={achievementZoneMax}
            />
          )}
        </div>
        <p className="text-2xl font-black text-white">{achievementZoneLabel}</p>
        <p className="mt-1 text-xs font-bold text-emerald-300">
          <AnimatedNumber
            value={achievementZoneEffectiveness}
            suffix="%"
            decimals={achievementZoneEffectiveness % 1 === 0 ? 0 : 1}
          />{" "}
          efectividad
        </p>
      </div>
    </div>
  </div>
</section>

      {canManageAthlete && (
        <section className="mb-6 rounded-[1.6rem] border border-yellow-300/15 bg-yellow-300/[0.06] p-4 shadow-[0_0_40px_rgba(250,204,21,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-200">
                Administracion
              </p>
              <p className="mt-1 text-sm font-bold text-slate-400">
                Reubica este atleta a otro club o elimina su cuenta y registros
                relacionados.
              </p>
            </div>

            <AthleteManageModal
              athlete={{
                id: athlete.id,
                name: athlete.users?.name || null,
                club_id: athlete.club_id || null,
              }}
              clubs={clubsForRelocationRaw || []}
            />
          </div>
        </section>
      )}

      <section className="tal-chart-card mb-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="tal-metric-icon mb-0">
            <Filter size={20} />
          </span>
          <h3 className="text-2xl font-black text-white">Filtros</h3>
        </div>

        <form className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            name="from"
            type="date"
            defaultValue={from}
            className="tal-input"
          />

          <input
            name="to"
            type="date"
            defaultValue={to}
            className="tal-input"
          />

          <select
            name="distance"
            defaultValue={distance}
            className="tal-input"
          >
            <option value="">Todas las distancias</option>
            <option value="18">18 m</option>
            <option value="30">30 m</option>
            <option value="40">40 m</option>
            <option value="50">50 m</option>
            <option value="60">60 m</option>
            <option value="70">70 m</option>
          </select>

          <button className="tal-button">
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
        {primaryStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        {secondaryStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <AthleteCharts
        trainingChartData={trainingChartData}
        xChartData={xChartData}
        distanceChartData={distanceChartData}
      />

      <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="tal-chart-card">
          <h3 className="mb-5 flex items-center gap-3 text-2xl font-black text-white tal-text-glow">
            <span className="tal-metric-icon mb-0">
              <Trophy size={20} />
            </span>
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

        <div className="tal-chart-card">
          <h3 className="mb-5 flex items-center gap-3 text-2xl font-black text-white tal-text-glow">
            <span className="tal-metric-icon mb-0">
              <Sparkles size={20} />
            </span>
            Análisis automático
          </h3>

          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-sm text-slate-200 shadow-[0_0_28px_rgba(34,211,238,0.06)]"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="tal-chart-card lg:col-span-2">
          <h3 className="mb-5 flex items-center gap-3 text-2xl font-black text-white tal-text-glow">
            <span className="tal-metric-icon mb-0">
              <Activity size={20} />
            </span>
            Entrenamientos recientes
          </h3>

          <div className="space-y-3">
            {filteredTrainings.slice(0, 6).map((training: any) => (
              <Link
                key={training.id}
                href={`/trainings/${training.id}`}
                className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
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

        <div className="tal-chart-card">
          <h3 className="mb-5 flex items-center gap-3 text-2xl font-black text-white tal-text-glow">
            <span className="tal-metric-icon mb-0">
              <Medal size={20} />
            </span>
            Mejor serie
          </h3>

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

      <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SupportContactGroup
          title="Preparador fisico"
          icon={Dumbbell}
          staff={supportStaff.filter(
            (member: any) => member.staff_type === "physical_trainer"
          )}
        />

        <SupportContactGroup
          title="Psicologo deportivo"
          icon={Brain}
          staff={supportStaff.filter(
            (member: any) => member.staff_type === "sports_psychologist"
          )}
        />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <InfoCard title="Categoría" value={athlete.category || "-"} />
        <InfoCard title="Mano dominante" value={athlete.dominant_hand || "-"} />
        <InfoCard
          title="Zona de logro"
          value={achievementZoneLabel}
          icon={Crosshair}
        />
        <InfoCard title="Tipo de arco" value={athlete.bow_type || "-"} icon={Target} />
      </section>

      <section className="tal-chart-card mt-8">
        <TargetHeatmap arrows={allArrows} />
      </section>
    </main>
  );
}

function SupportContactGroup({
  title,
  icon: Icon,
  staff,
}: {
  title: string;
  icon: LucideIcon;
  staff: any[];
}) {
  return (
    <div className="tal-chart-card">
      <div className="mb-5 flex items-center gap-3">
        <span className="tal-metric-icon mb-0">
          <Icon size={20} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Contacto
          </p>
          <h3 className="text-2xl font-black text-white">{title}</h3>
        </div>
      </div>

      <div className="grid gap-3">
        {staff.map((member) => (
          <article
            key={member.id}
            className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
          >
            <h4 className="text-lg font-black text-white">{member.name}</h4>
            <p className="mt-1 text-sm font-bold text-slate-400">
              {member.specialty || member.certification_level || "Contacto del club"}
            </p>

            <div className="mt-4 grid gap-2 text-sm font-bold text-slate-300 sm:grid-cols-2">
              <ContactPill icon={Mail} value={member.email || "Sin correo"} />
              <ContactPill icon={Phone} value={member.phone || "Sin telefono"} />
            </div>

            {member.certification_institution && (
              <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-400">
                {member.certification_institution}
              </p>
            )}
          </article>
        ))}

        {staff.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm font-bold text-slate-500">
            Aun no hay contacto registrado para este club.
          </p>
        )}
      </div>
    </div>
  );
}

function ContactPill({
  icon: Icon,
  value,
}: {
  icon: LucideIcon;
  value: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <Icon size={15} className="shrink-0 text-cyan-300" />
      <span className="truncate">{value}</span>
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone = "text-white",
  accent = false,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: string;
  accent?: boolean;
}) {
  return (
    <ViewReveal>
      <div className={accent ? "tal-metric-card border-cyan-300/30 bg-cyan-400/10" : "tal-metric-card"}>
        <span className="tal-metric-icon">
          <Icon size={20} />
        </span>
        <p className="tal-metric-label">
          {title}
        </p>

        <h2 className={`tal-metric-value ${tone}`}>
          <AnimatedMetricValue value={value} />
        </h2>
      </div>
    </ViewReveal>
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
    <ViewReveal>
      <div className="tal-metric-card">
        <p className="tal-metric-label text-cyan-300">
          {title}
        </p>

        <h4 className="tal-metric-value">
          <AnimatedMetricValue value={value} />
        </h4>

        <p className="relative z-10 mt-2 text-sm text-slate-400">{detail}</p>
      </div>
    </ViewReveal>
  );
}

function InfoCard({
  title,
  value,
  icon: Icon = UserRound,
}: {
  title: string;
  value: string | number;
  icon?: LucideIcon;
}) {
  return (
    <ViewReveal>
      <div className="tal-metric-card">
        <span className="tal-metric-icon">
          <Icon size={20} />
        </span>
        <p className="tal-metric-label">
          {title}
        </p>

        <h2 className="relative z-10 mt-3 text-2xl font-black text-white">
          <AnimatedMetricValue value={value} />
        </h2>
      </div>
    </ViewReveal>
  );
}

function AnimatedMetricValue({ value }: { value: string | number }) {
  const textValue = String(value);
  const match = textValue.match(/^(-?\d+(?:\.\d+)?)(%)?$/);

  if (!match) return <>{value}</>;

  const numericValue = Number(match[1]);
  const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;

  return (
    <AnimatedNumber
      value={numericValue}
      suffix={match[2] || ""}
      decimals={decimals}
    />
  );
}

type StatItem = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: string;
  accent?: boolean;
};
