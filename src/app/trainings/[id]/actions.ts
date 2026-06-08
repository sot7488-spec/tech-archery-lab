"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertCanMutateTraining(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trainingSessionId: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (
    currentUser?.role !== "admin" &&
    currentUser?.role !== "coach" &&
    currentUser?.role !== "athlete"
  ) {
    throw new Error("No tienes permiso para modificar entrenamientos.");
  }

  const { data: training } = await supabase
    .from("training_sessions")
    .select(`
      club_id,
      athlete_profiles (
        user_id
      )
    `)
    .eq("id", trainingSessionId)
    .single();

  if (
    currentUser.role === "coach" &&
    training?.club_id !== currentUser.club_id
  ) {
    throw new Error("Solo puedes modificar entrenamientos de tu club.");
  }

  const athleteProfile = Array.isArray(training?.athlete_profiles)
    ? training.athlete_profiles[0]
    : training?.athlete_profiles;

  if (
    currentUser.role === "athlete" &&
    athleteProfile?.user_id !== user.id
  ) {
    throw new Error("Solo puedes modificar tu propio entrenamiento.");
  }

  return currentUser;
}

type SeriesActionState = {
  completed?: boolean;
  message?: string;
  trainingSessionId?: string;
  error?: string;
};

type RoundActionState = {
  success?: boolean;
  error?: string;
};

function calculateGroupSizeCm(
  positions: Array<{ x: number | null; y: number | null }>,
  targetSizeCm: number
) {
  const validPositions = positions.filter(
    (position): position is { x: number; y: number } =>
      typeof position.x === "number" &&
      typeof position.y === "number" &&
      !Number.isNaN(position.x) &&
      !Number.isNaN(position.y)
  );

  if (validPositions.length < 2 || !targetSizeCm) return null;

  let maxDistancePercent = 0;

  for (let i = 0; i < validPositions.length; i += 1) {
    for (let j = i + 1; j < validPositions.length; j += 1) {
      const dx = validPositions[i].x - validPositions[j].x;
      const dy = validPositions[i].y - validPositions[j].y;
      maxDistancePercent = Math.max(
        maxDistancePercent,
        Math.sqrt(dx * dx + dy * dy)
      );
    }
  }

  return Number(((maxDistancePercent / 100) * targetSizeCm).toFixed(1));
}

async function syncTrainingTotalsAndStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trainingSessionId: string
) {
  const { data: rounds } = await supabase
    .from("training_rounds")
    .select(`
      id,
      scoring_enabled,
      status,
      series (
        id,
        arrows (
          score
        )
      )
    `)
    .eq("training_session_id", trainingSessionId);

  const allArrows =
    rounds
      ?.filter((round: any) => round.scoring_enabled !== false)
      .flatMap((round: any) =>
        round.series?.flatMap((serie: any) => serie.arrows || []) || []
      ) || [];

  const totalArrows = allArrows.length;
  const totalScore = allArrows.reduce(
    (sum: number, arrow: any) => sum + Number(arrow.score || 0),
    0
  );
  const average = totalArrows > 0 ? totalScore / totalArrows : 0;
  const allRoundsCompleted =
    Boolean(rounds?.length) &&
    rounds?.every((round: any) => round.status === "completed");

  await supabase
    .from("training_sessions")
    .update({
      total_arrows: totalArrows,
      total_score: totalScore,
      average_score: average,
      status: allRoundsCompleted ? "completed" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", trainingSessionId);
}

export async function finishTraining(formData: FormData) {
  const supabase = await createClient();
  const training_session_id = String(formData.get("training_session_id"));

  await assertCanMutateTraining(supabase, training_session_id);

  const { error } = await supabase
    .from("training_sessions")
    .update({
      status: "completed",
    })
    .eq("id", training_session_id);

  if (error) {
    console.error(error);
    throw new Error("Error finalizando entrenamiento");
  }

  revalidatePath(`/trainings/${training_session_id}`);
  revalidatePath("/trainings");
}

export async function updateTrainingCloseNotes(formData: FormData) {
  const supabase = await createClient();
  const training_session_id = String(formData.get("training_session_id"));
  const round_id = String(formData.get("round_id") || "");
  const final_notes = String(formData.get("final_notes") || "");
  const brace_height_cm = formData.get("brace_height_cm")
    ? Number(formData.get("brace_height_cm"))
    : null;
  const wind_speed_kmh = formData.get("wind_speed_kmh")
    ? Number(formData.get("wind_speed_kmh"))
    : null;
  const temperature_c = formData.get("temperature_c")
    ? Number(formData.get("temperature_c"))
    : null;
  const distance_meters = Number(formData.get("distance_meters") || 0);
  const target_size_cm = Number(formData.get("target_size_cm") || 0);

  const currentUser = await assertCanMutateTraining(supabase, training_session_id);
  const notesPayload =
    currentUser.role === "athlete"
      ? { athlete_notes: final_notes }
      : { coach_notes: final_notes };

  const { error } = await supabase
    .from("training_sessions")
    .update({
      ...notesPayload,
      brace_height_cm,
      location: String(formData.get("location") || "") || null,
      session_type: String(formData.get("session_type") || "") || null,
      weather: String(formData.get("weather") || "otro"),
      wind_speed_kmh,
      temperature_c,
      objective: String(formData.get("objective") || "") || null,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", training_session_id);

  if (error) {
    console.error(error);
    throw new Error("Error guardando cierre del entrenamiento");
  }

  if (round_id && distance_meters && target_size_cm) {
    const { error: roundError } = await supabase
      .from("training_rounds")
      .update({
        distance_meters,
        target_size_cm,
      })
      .eq("id", round_id);

    if (roundError) {
      console.error(roundError);
      throw new Error("Error guardando parametros de ronda");
    }
  }

  revalidatePath(`/trainings/${training_session_id}`);
  revalidatePath("/trainings");
}

async function createSeriesWithArrowsInternal(formData: FormData) {
  const training_session_id = String(formData.get("training_session_id"));
  const round_id = String(formData.get("round_id") || "");
  const supabase = await createClient();
  await assertCanMutateTraining(supabase, training_session_id);
  const distance_meters = Number(formData.get("distance_meters"));
  const target_size_cm = Number(formData.get("target_size_cm"));
  const arrowsPerSeries = Math.max(1, Number(formData.get("arrows_per_series") || 6));
  const arrowNumbers = Array.from(
    { length: Math.min(arrowsPerSeries, 12) },
    (_, index) => index + 1
  );

  if (!round_id) {
    throw new Error("Falta la ronda para registrar la serie.");
  }

  const arrowValues = arrowNumbers.map((n) => {
    const raw = String(formData.get(`arrow_${n}`) || "0")
      .trim()
      .toUpperCase();

    if (raw === "X") {
      return { score: 10, is_x: true };
    }

    if (raw === "M") {
      return { score: 0, is_x: false };
    }

    const score = Number(raw);

    if (Number.isNaN(score) || score < 1 || score > 10) {
      throw new Error("Cada flecha debe ser X, M o un número del 1 al 10");
    }

    return { score, is_x: false };
  });

  const total_score = arrowValues.reduce(
    (sum, arrow) => sum + arrow.score,
    0
  );

  const average_score = total_score / arrowValues.length;
  const arrowPositions = arrowNumbers.map((arrowNumber) => {
    const position_x = formData.get(`position_x_${arrowNumber}`);
    const position_y = formData.get(`position_y_${arrowNumber}`);

    return {
      x:
        position_x === null || position_x === ""
          ? null
          : Number(position_x),
      y:
        position_y === null || position_y === ""
          ? null
          : Number(position_y),
    };
  });

  const { data: round } = await supabase
    .from("training_rounds")
    .select("*")
    .eq("id", round_id)
    .eq("training_session_id", training_session_id)
    .single();

  if (!round) {
    throw new Error("Ronda no encontrada.");
  }

  if (round.status === "completed") {
    throw new Error("Esta ronda ya fue finalizada.");
  }

  if (round.scoring_enabled === false) {
    throw new Error("Esta ronda solo permite retroalimentacion, no puntuacion.");
  }

  const { data: existingSeries } = await supabase
    .from("series")
    .select("id")
    .eq("training_round_id", round.id);

  const nextSeriesNumber = (existingSeries?.length || 0) + 1;
  const plannedSeries = Number(round.total_series || 0);

  if (plannedSeries > 0 && nextSeriesNumber > plannedSeries) {
    throw new Error("Ya registraste todas las series planeadas de esta ronda.");
  }

  const effectiveTargetSizeCm = Number(round.target_size_cm || target_size_cm);
  const group_size_cm = calculateGroupSizeCm(
    arrowPositions,
    effectiveTargetSizeCm
  );

  const { data: serie, error: seriesError } = await supabase
    .from("series")
    .insert({
      training_round_id: round.id,
      series_number: nextSeriesNumber,
      total_score,
      average_score,
      group_size_cm,
    })
    .select()
    .single();

  if (seriesError) throw new Error("Error creando serie");

  const arrowsToInsert = arrowValues.map((arrow, index) => {
    const arrowNumber = index + 1;

    const position_x = formData.get(`position_x_${arrowNumber}`);
    const position_y = formData.get(`position_y_${arrowNumber}`);

    return {
      series_id: serie.id,
      arrow_number: arrowNumber,
      score: arrow.score,
      is_x: arrow.is_x,
      position_x:
        position_x === null || position_x === ""
          ? null
          : Number(position_x),
      position_y:
        position_y === null || position_y === ""
          ? null
          : Number(position_y),
    };
  });

  const { error: arrowsError } = await supabase
    .from("arrows")
    .insert(arrowsToInsert);

  if (arrowsError) throw new Error("Error creando flechas");

  const shouldComplete =
    Number(round.total_series || 0) > 0 &&
    nextSeriesNumber >= Number(round.total_series || 0);

  await syncTrainingTotalsAndStatus(supabase, training_session_id);

  revalidatePath(`/trainings/${training_session_id}`);
  revalidatePath("/trainings");

  return {
    completed: shouldComplete,
    trainingSessionId: training_session_id,
    message: shouldComplete
      ? "Series completas. Ahora finaliza la ronda con retroalimentacion."
      : "Serie guardada.",
  };
}

export async function createSeriesWithArrows(formData: FormData) {
  await createSeriesWithArrowsInternal(formData);
}

export async function createSeriesWithArrowsState(
  _previousState: SeriesActionState,
  formData: FormData
): Promise<SeriesActionState> {
  try {
    return await createSeriesWithArrowsInternal(formData);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la serie.",
    };
  }
}

async function finishTrainingRoundInternal(formData: FormData) {
  const supabase = await createClient();
  const roundId = String(formData.get("round_id") || "");
  const feedback = String(formData.get("feedback") || "").trim();

  if (!roundId) throw new Error("Falta la ronda.");
  if (!feedback) throw new Error("Agrega retroalimentacion para cerrar la ronda.");

  const { data: round } = await supabase
    .from("training_rounds")
    .select("*, series(id)")
    .eq("id", roundId)
    .single();

  if (!round) throw new Error("Ronda no encontrada.");

  await assertCanMutateTraining(supabase, round.training_session_id);

  if (round.status === "completed") {
    throw new Error("Esta ronda ya fue finalizada.");
  }

  const seriesCount = Array.isArray(round.series) ? round.series.length : 0;

  if (
    round.scoring_enabled !== false &&
    Number(round.total_series || 0) > 0 &&
    seriesCount < Number(round.total_series || 0)
  ) {
    throw new Error("Registra todas las series antes de finalizar esta ronda.");
  }

  const { error } = await supabase
    .from("training_rounds")
    .update({
      status: "completed",
      feedback,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", roundId);

  if (error) throw new Error("No se pudo finalizar la ronda.");

  await syncTrainingTotalsAndStatus(supabase, round.training_session_id);

  revalidatePath(`/trainings/${round.training_session_id}`);
  revalidatePath("/trainings");

  return { success: true };
}

export async function finishTrainingRoundState(
  _previousState: RoundActionState,
  formData: FormData
): Promise<RoundActionState> {
  try {
    return await finishTrainingRoundInternal(formData);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo finalizar la ronda.",
    };
  }
}
