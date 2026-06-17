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
  Flame,
  Gauge,
  Mail,
  Medal,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  Video,
  Zap,
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

  if (
    (currentUser?.role === "coach" ||
      currentUser?.role === "sports_psychologist") &&
    athlete.club_id !== currentUser.club_id
  ) {
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

  const { data: videoFeedbackRaw } = await supabase
    .from("video_analysis_feedback")
    .select(
      `
      id,
      title,
      feedback,
      snapshot_data_url,
      video_time_seconds,
      analysis_mode,
      created_at,
      users!video_analysis_feedback_coach_id_fkey (
        name
      )
    `
    )
    .eq("athlete_id", athlete.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const videoFeedback = videoFeedbackRaw || [];

  const { data: psychologySessionsRaw } = await supabase
    .from("psychology_sessions")
    .select(
      `
      id,
      session_date,
      session_type,
      focus_area,
      sport_feeling,
      confidence_score,
      focus_score,
      breathing_control_score,
      routine_clarity_score,
      error_recovery_score,
      recommendation,
      notes,
      mental_techniques (
        name,
        category
      ),
      performance_staff (
        name
      )
    `
    )
    .eq("athlete_id", athlete.id)
    .order("session_date", { ascending: false })
    .limit(4);

  const psychologySessions = psychologySessionsRaw || [];

  const { data: mentalTechniqueAssignmentsRaw } = await supabase
    .from("athlete_mental_technique_assignments")
    .select(
      `
      id,
      objective,
      assigned_at,
      mental_techniques (
        name,
        category,
        instructions,
        duration_minutes
      )
    `
    )
    .eq("athlete_id", athlete.id)
    .eq("status", "active")
    .order("assigned_at", { ascending: false })
    .limit(4);

  const mentalTechniqueAssignments = mentalTechniqueAssignmentsRaw || [];

  const { data: mentalRoutinesRaw } = await supabase
    .from("athlete_mental_routines")
    .select("*")
    .eq("athlete_id", athlete.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(2);

  const mentalRoutines = mentalRoutinesRaw || [];

  const { data: mentalPracticeLogsRaw } = await supabase
    .from("athlete_mental_practice_logs")
    .select(
      `
      id,
      practiced_at,
      usefulness_score,
      worked_status,
      sport_comment,
      athlete_mental_technique_assignments (
        mental_techniques (
          name
        )
      )
    `
    )
    .eq("athlete_id", athlete.id)
    .order("practiced_at", { ascending: false })
    .limit(3);

  const mentalPracticeLogs = mentalPracticeLogsRaw || [];

  const { data: mentalSeasonPlansRaw } = await supabase
    .from("athlete_mental_season_plans")
    .select("*")
    .eq("athlete_id", athlete.id)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(2);

  const mentalSeasonPlans = mentalSeasonPlansRaw || [];

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

  const trainingAverages = trainingChartData
    .map((item: any) => Number(item.average || 0))
    .filter((average: number) => average > 0);
  const averageOfAverages =
    trainingAverages.length > 0
      ? trainingAverages.reduce((sum: number, value: number) => sum + value, 0) /
        trainingAverages.length
      : 0;
  const averageVariance =
    trainingAverages.length > 1
      ? trainingAverages.reduce(
          (sum: number, value: number) =>
            sum + Math.pow(value - averageOfAverages, 2),
          0
        ) / trainingAverages.length
      : 0;
  const averageDeviation = Math.sqrt(averageVariance);
  const consistencyScore =
    trainingAverages.length >= 3
      ? Math.max(0, Math.min(100, Math.round(100 - averageDeviation * 28)))
      : Math.min(55, trainingAverages.length * 18);
  const completionRate =
    totalTrainings > 0 ? Math.round((completedTrainings / totalTrainings) * 100) : 0;

  const gamificationSkills: GamificationSkill[] = [
    buildSkill({
      title: "Precision",
      description: `Flechas dentro de zona ${achievementZoneLabel}.`,
      value: achievementZoneEffectiveness,
      suffix: "%",
      thresholds: [25, 40, 55, 70, 82],
      icon: Crosshair,
      tone: "cyan",
    }),
    buildSkill({
      title: "Consistencia",
      description: "Estabilidad del promedio entre entrenamientos.",
      value: consistencyScore,
      suffix: "%",
      thresholds: [25, 45, 62, 78, 90],
      icon: ShieldCheck,
      tone: "emerald",
    }),
    buildSkill({
      title: "Volumen",
      description: "Flechas puntuadas registradas.",
      value: totalArrows,
      suffix: "",
      thresholds: [100, 300, 750, 1500, 3000],
      icon: Zap,
      tone: "yellow",
    }),
    buildSkill({
      title: "Disciplina",
      description: "Entrenamientos finalizados.",
      value: completedTrainings,
      suffix: "",
      thresholds: [1, 3, 8, 15, 30],
      icon: Flame,
      tone: "rose",
    }),
    buildSkill({
      title: "Tecnica",
      description: "Retroalimentaciones tecnicas recibidas.",
      value: videoFeedback.length,
      suffix: "",
      thresholds: [1, 3, 6, 10, 20],
      icon: Video,
      tone: "violet",
    }),
  ];

  const gamificationBadges: GamificationBadge[] = [
    {
      title: "Primer entrenamiento",
      description: "Registro inicial completado.",
      unlocked: totalTrainings >= 1,
      icon: Activity,
    },
    {
      title: "100 flechas",
      description: "Base de volumen construida.",
      unlocked: totalArrows >= 100,
      icon: Crosshair,
    },
    {
      title: "Zona caliente",
      description: "50% o mas dentro de zona de logro.",
      unlocked: achievementZoneEffectiveness >= 50 && totalArrows >= 30,
      icon: Target,
    },
    {
      title: "Cazador de X",
      description: "10 o mas X registradas.",
      unlocked: totalX >= 10,
      icon: X,
    },
    {
      title: "Tecnica revisada",
      description: "Cuenta con feedback tecnico por video.",
      unlocked: videoFeedback.length >= 1,
      icon: Video,
    },
    {
      title: "Constancia",
      description: "3 entrenamientos finalizados.",
      unlocked: completedTrainings >= 3,
      icon: Flame,
    },
  ];

  const athleteXp =
    gamificationSkills.reduce((sum, skill) => sum + skill.level * 120, 0) +
    gamificationBadges.filter((badge) => badge.unlocked).length * 75 +
    completedTrainings * 20 +
    Math.floor(totalArrows / 10);
  const athleteLevel = Math.max(1, Math.floor(athleteXp / 500) + 1);
  const currentLevelXp = athleteXp % 500;
  const nextSkill =
    [...gamificationSkills].sort((a, b) => a.progress - b.progress)[0] ||
    gamificationSkills[0];

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

      <GamificationPanel
        level={athleteLevel}
        xp={athleteXp}
        currentLevelXp={currentLevelXp}
        completionRate={completionRate}
        skills={gamificationSkills}
        badges={gamificationBadges}
        nextSkill={nextSkill}
      />

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

      <section className="tal-chart-card mb-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="flex items-center gap-3 text-2xl font-black text-white tal-text-glow">
            <span className="tal-metric-icon mb-0">
              <Video size={20} />
            </span>
            Retroalimentacion tecnica
          </h3>

          {canManageAthlete && (
            <Link
              href="/video-analysis"
              className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-100 transition hover:bg-emerald-300 hover:text-slate-950"
            >
              Nuevo analisis
            </Link>
          )}
        </div>

        {videoFeedback.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {videoFeedback.map((item: any) => {
              const coachInfo = Array.isArray(item.users)
                ? item.users[0]
                : item.users;
              const seconds = Number(item.video_time_seconds || 0);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04]"
                >
                  <img
                    src={item.snapshot_data_url}
                    alt={item.title || "Retroalimentacion tecnica"}
                    className="aspect-video w-full bg-black object-contain"
                  />

                  <div className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                          Analisis tecnico
                        </p>
                        <h4 className="mt-1 text-xl font-black text-white">
                          {item.title || "Analisis tecnico"}
                        </h4>
                      </div>

                      <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-slate-300">
                        {Math.floor(seconds / 60)}:
                        {String(Math.floor(seconds % 60)).padStart(2, "0")}
                      </span>
                    </div>

                    <p className="whitespace-pre-line text-sm font-medium leading-6 text-slate-300">
                      {item.feedback}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <MessageSquare size={14} />
                      <span>{coachInfo?.name || "Coach"}</span>
                      <span>Â·</span>
                      <span>
                        {new Date(item.created_at).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm font-bold text-slate-400">
            Aun no hay retroalimentacion tecnica por video para este atleta.
          </div>
        )}
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

      <section className="tal-chart-card mb-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="flex items-center gap-3 text-2xl font-black text-white tal-text-glow">
            <span className="tal-metric-icon mb-0">
              <Brain size={20} />
            </span>
            Preparacion mental deportiva
          </h3>

          {canManageAthlete && (
            <Link
              href="/psychology"
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
            >
              Abrir psicologia
            </Link>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm font-bold leading-6 text-yellow-100">
          Esta informacion esta enfocada en rendimiento deportivo: foco,
          respiracion, confianza, rutina y manejo de presion competitiva. No
          sustituye atencion psicologica clinica.
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              Rutina pre-tiro
            </p>
            {mentalRoutines[0] ? (
              <div className="mt-3 text-sm font-bold leading-6 text-cyan-50">
                <h4 className="text-lg font-black text-white">
                  {mentalRoutines[0].title}
                </h4>
                {mentalRoutines[0].breathing_step && (
                  <p className="mt-2">Respiracion: {mentalRoutines[0].breathing_step}</p>
                )}
                {mentalRoutines[0].cue_word && (
                  <p>Palabra clave: {mentalRoutines[0].cue_word}</p>
                )}
                {mentalRoutines[0].reset_action && (
                  <p>Reset: {mentalRoutines[0].reset_action}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm font-bold text-cyan-100/70">
                Sin rutina activa.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
              Plan de temporada
            </p>
            {mentalSeasonPlans[0] ? (
              <div className="mt-3 text-sm font-bold leading-6 text-emerald-50">
                <h4 className="text-lg font-black text-white">
                  {mentalSeasonPlans[0].title}
                </h4>
                <p className="mt-2">
                  {mentalSeasonPlans[0].season_phase} - {mentalSeasonPlans[0].start_date}
                </p>
                {mentalSeasonPlans[0].objective && (
                  <p>{mentalSeasonPlans[0].objective}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm font-bold text-emerald-100/70">
                Sin plan activo.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">
              Bitacora mental
            </p>
            <div className="mt-3 grid gap-2">
              {mentalPracticeLogs.map((log: any) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm font-bold text-slate-300">
                  <p className="text-white">
                    {log.athlete_mental_technique_assignments?.mental_techniques?.name || "Tecnica mental"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {log.practiced_at} - utilidad {log.usefulness_score || "-"}/5
                  </p>
                </div>
              ))}
              {mentalPracticeLogs.length === 0 && (
                <p className="text-sm font-bold text-slate-500">
                  Sin practicas registradas.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Tecnicas activas
            </p>
            <div className="grid gap-3">
              {mentalTechniqueAssignments.map((assignment: any) => (
                <article
                  key={assignment.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {assignment.mental_techniques?.category || "tecnica"} ·{" "}
                    {assignment.mental_techniques?.duration_minutes || 3} min
                  </p>
                  <h4 className="mt-1 text-lg font-black text-white">
                    {assignment.mental_techniques?.name || "Tecnica mental"}
                  </h4>
                  {assignment.objective && (
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
                      {assignment.objective}
                    </p>
                  )}
                  {assignment.mental_techniques?.instructions && (
                    <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold leading-6 text-slate-400">
                      {assignment.mental_techniques.instructions}
                    </p>
                  )}
                </article>
              ))}

              {mentalTechniqueAssignments.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm font-bold text-slate-500">
                  Aun no hay tecnicas mentales deportivas asignadas.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Ultimos check-ins
            </p>
            <div className="grid gap-3">
              {psychologySessions.map((session: any) => (
                <article
                  key={session.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        {session.session_date}
                      </p>
                      <h4 className="mt-1 text-lg font-black text-white">
                        {session.focus_area || "Check-in deportivo"}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-black text-slate-300">
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1">
                        Conf {session.confidence_score || "-"}
                      </span>
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1">
                        Foco {session.focus_score || "-"}
                      </span>
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1">
                        Resp {session.breathing_control_score || "-"}
                      </span>
                    </div>
                  </div>

                  {session.sport_feeling && (
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
                      {session.sport_feeling}
                    </p>
                  )}
                  {session.recommendation && (
                    <p className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-3 text-sm font-bold leading-6 text-emerald-100">
                      {session.recommendation}
                    </p>
                  )}
                </article>
              ))}

              {psychologySessions.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm font-bold text-slate-500">
                  Aun no hay check-ins deportivos registrados.
                </p>
              )}
            </div>
          </div>
        </div>
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

function GamificationPanel({
  level,
  xp,
  currentLevelXp,
  completionRate,
  skills,
  badges,
  nextSkill,
}: {
  level: number;
  xp: number;
  currentLevelXp: number;
  completionRate: number;
  skills: GamificationSkill[];
  badges: GamificationBadge[];
  nextSkill: GamificationSkill;
}) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <ViewReveal>
      <section className="tal-chart-card mb-6 overflow-hidden">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Skill Path
            </p>
            <h3 className="mt-2 flex items-center gap-3 text-3xl font-black text-white tal-text-glow">
              <span className="tal-metric-icon mb-0">
                <Star size={20} />
              </span>
              Progreso y skills
            </h3>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-400">
              Nivel calculado con entrenamientos, flechas, zona de logro,
              constancia y retroalimentacion tecnica.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <GamificationSummaryCard label="Nivel TAL" value={level} icon={Trophy} />
            <GamificationSummaryCard label="XP total" value={xp} icon={Zap} />
            <GamificationSummaryCard
              label="Badges"
              value={`${unlockedCount}/${badges.length}`}
              icon={Medal}
            />
          </div>
        </div>

        <div className="mb-6 rounded-[1.4rem] border border-cyan-300/15 bg-slate-950/60 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">
              Camino al nivel {level + 1}
            </p>
            <p className="text-sm font-black text-cyan-200">
              <AnimatedNumber value={currentLevelXp} /> / 500 XP
            </p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-yellow-200 shadow-[0_0_24px_rgba(34,211,238,0.45)]"
              style={{ width: `${Math.min(100, (currentLevelXp / 500) * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              Finalizacion: {completionRate}%
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              Siguiente foco: {nextSkill.title}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {skills.map((skill) => (
            <SkillCard key={skill.title} skill={skill} />
          ))}
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-xl font-black text-white">Insignias</h4>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              {unlockedCount} desbloqueadas
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <BadgeCard key={badge.title} badge={badge} />
            ))}
          </div>
        </div>
      </section>
    </ViewReveal>
  );
}

function GamificationSummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[1.2rem] border border-cyan-300/15 bg-cyan-300/10 p-4">
      <Icon className="mb-3 text-cyan-200" size={20} />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-white">
        <AnimatedMetricValue value={value} />
      </p>
    </div>
  );
}

function SkillCard({ skill }: { skill: GamificationSkill }) {
  const Icon = skill.icon;

  return (
    <article className={`rounded-[1.4rem] border p-4 ${skillToneClass(skill.tone)}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50">
          <Icon size={19} />
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black">
          Lv {skill.level}
        </span>
      </div>
      <h4 className="text-lg font-black text-white">{skill.title}</h4>
      <p className="mt-1 min-h-[40px] text-xs font-bold leading-5 text-slate-400">
        {skill.description}
      </p>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <span>
            {skill.value}
            {skill.suffix}
          </span>
          <span>{skill.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-current shadow-[0_0_18px_currentColor]"
            style={{ width: `${skill.progress}%` }}
          />
        </div>
      </div>
      <p className="mt-3 text-xs font-bold text-slate-500">
        Proximo: {skill.nextTargetLabel}
      </p>
    </article>
  );
}

function BadgeCard({ badge }: { badge: GamificationBadge }) {
  const Icon = badge.icon;

  return (
    <article
      className={
        badge.unlocked
          ? "rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-4 text-yellow-100"
          : "rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-slate-500"
      }
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/45">
          <Icon size={18} />
        </span>
        <div>
          <h4 className="font-black text-white">{badge.title}</h4>
          <p className="mt-1 text-xs font-bold leading-5">{badge.description}</p>
        </div>
      </div>
    </article>
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

type SkillTone = "cyan" | "emerald" | "yellow" | "rose" | "violet";

type GamificationSkill = {
  title: string;
  description: string;
  value: number;
  suffix: string;
  thresholds: number[];
  level: number;
  progress: number;
  nextTargetLabel: string;
  icon: LucideIcon;
  tone: SkillTone;
};

type GamificationBadge = {
  title: string;
  description: string;
  unlocked: boolean;
  icon: LucideIcon;
};

function buildSkill({
  title,
  description,
  value,
  suffix,
  thresholds,
  icon,
  tone,
}: {
  title: string;
  description: string;
  value: number;
  suffix: string;
  thresholds: number[];
  icon: LucideIcon;
  tone: SkillTone;
}): GamificationSkill {
  const level = thresholds.reduce(
    (currentLevel, threshold) => (value >= threshold ? currentLevel + 1 : currentLevel),
    0
  );
  const cappedLevel = Math.min(5, level);
  const previousThreshold = cappedLevel > 0 ? thresholds[cappedLevel - 1] : 0;
  const nextThreshold = thresholds[cappedLevel] || thresholds[thresholds.length - 1];
  const rawProgress =
    cappedLevel >= 5
      ? 100
      : ((value - previousThreshold) /
          Math.max(1, nextThreshold - previousThreshold)) *
        100;
  const progress = Math.max(0, Math.min(100, Math.round(rawProgress)));

  return {
    title,
    description,
    value: Number.isInteger(value) ? value : Number(value.toFixed(1)),
    suffix,
    thresholds,
    level: Math.max(1, cappedLevel || 1),
    progress,
    nextTargetLabel:
      cappedLevel >= 5 ? "Dominado" : `${nextThreshold}${suffix || ""}`,
    icon,
    tone,
  };
}

function skillToneClass(tone: SkillTone) {
  const classes: Record<SkillTone, string> = {
    cyan: "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200",
    emerald: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200",
    yellow: "border-yellow-300/20 bg-yellow-300/[0.08] text-yellow-100",
    rose: "border-rose-300/20 bg-rose-300/[0.08] text-rose-100",
    violet: "border-violet-300/20 bg-violet-300/[0.08] text-violet-100",
  };

  return classes[tone];
}
