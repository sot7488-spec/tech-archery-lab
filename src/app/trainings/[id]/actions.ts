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

async function assertCanConfigureTraining(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trainingSessionId: string
) {
  const currentUser = await assertCanMutateTraining(supabase, trainingSessionId);

  if (currentUser.role !== "admin" && currentUser.role !== "coach") {
    throw new Error("Solo admin o coach pueden editar la configuracion.");
  }

  return currentUser;
}

function nullableString(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function positiveNumber(value: FormDataEntryValue | null, fallback = 0) {
  const numberValue = Number(value || fallback);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
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

export async function updateTrainingConfiguration(formData: FormData) {
  const supabase = await createClient();
  const trainingSessionId = String(formData.get("training_session_id") || "");

  if (!trainingSessionId) throw new Error("Falta el entrenamiento.");

  await assertCanConfigureTraining(supabase, trainingSessionId);

  const { error: trainingError } = await supabase
    .from("training_sessions")
    .update({
      training_date: String(formData.get("training_date") || "") || null,
      equipment_profile_id:
        String(formData.get("equipment_profile_id") || "") || null,
      brace_height_cm: nullableNumber(formData.get("brace_height_cm")),
      location: nullableString(formData.get("location")),
      session_type: nullableString(formData.get("session_type")),
      weather: String(formData.get("weather") || "otro"),
      wind_speed_kmh: nullableNumber(formData.get("wind_speed_kmh")),
      temperature_c: nullableNumber(formData.get("temperature_c")),
      objective: nullableString(formData.get("objective")),
      coach_notes: nullableString(formData.get("coach_notes")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", trainingSessionId);

  if (trainingError) throw new Error(trainingError.message);

  const roundsCount = positiveNumber(formData.get("rounds_count"), 0);
  const submittedRoundIds: string[] = [];

  const { data: existingRounds } = await supabase
    .from("training_rounds")
    .select("id")
    .eq("training_session_id", trainingSessionId);

  for (let index = 0; index < roundsCount; index += 1) {
    const roundNumber = index + 1;
    const roundId = String(formData.get(`round_id_${roundNumber}`) || "");
    const payload = {
      round_number: roundNumber,
      distance_meters: positiveNumber(
        formData.get(`round_distance_meters_${roundNumber}`)
      ),
      target_size_cm: positiveNumber(
        formData.get(`round_target_size_cm_${roundNumber}`)
      ),
      total_series: positiveNumber(formData.get(`round_total_series_${roundNumber}`)),
      arrows_per_series: positiveNumber(
        formData.get(`round_arrows_per_series_${roundNumber}`),
        6
      ),
      scoring_enabled:
        String(formData.get(`round_scoring_enabled_${roundNumber}`) || "") ===
        "on",
      session_type: nullableString(formData.get(`round_session_type_${roundNumber}`)),
      objective: nullableString(formData.get(`round_objective_${roundNumber}`)),
      updated_at: new Date().toISOString(),
    };

    if (
      !payload.distance_meters ||
      !payload.target_size_cm ||
      !payload.total_series ||
      !payload.arrows_per_series
    ) {
      throw new Error("Completa distancia, diana, series y flechas de cada ronda.");
    }

    if (roundId) {
      submittedRoundIds.push(roundId);
      const { error } = await supabase
        .from("training_rounds")
        .update(payload)
        .eq("id", roundId)
        .eq("training_session_id", trainingSessionId);

      if (error) throw new Error(error.message);
    } else {
      const { data: insertedRound, error } = await supabase
        .from("training_rounds")
        .insert({
          ...payload,
          training_session_id: trainingSessionId,
          status: "active",
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      if (insertedRound?.id) submittedRoundIds.push(insertedRound.id);
    }
  }

  const removedRoundIds =
    existingRounds
      ?.map((round) => round.id)
      .filter((roundId) => !submittedRoundIds.includes(roundId)) || [];

  if (removedRoundIds.length > 0) {
    const { data: removedSeries } = await supabase
      .from("series")
      .select("id")
      .in("training_round_id", removedRoundIds);

    const removedSeriesIds = removedSeries?.map((serie) => serie.id) || [];

    if (removedSeriesIds.length > 0) {
      const { error: arrowsError } = await supabase
        .from("arrows")
        .delete()
        .in("series_id", removedSeriesIds);

      if (arrowsError) throw new Error(arrowsError.message);

      const { error: seriesError } = await supabase
        .from("series")
        .delete()
        .in("id", removedSeriesIds);

      if (seriesError) throw new Error(seriesError.message);
    }

    const { error: roundsDeleteError } = await supabase
      .from("training_rounds")
      .delete()
      .in("id", removedRoundIds);

    if (roundsDeleteError) throw new Error(roundsDeleteError.message);
  }

  const routinesCount = positiveNumber(formData.get("routines_count"), 0);
  const submittedRoutineIds: string[] = [];

  const { data: existingRoutines } = await supabase
    .from("training_routine_blocks")
    .select("id")
    .eq("training_session_id", trainingSessionId);

  for (let index = 0; index < routinesCount; index += 1) {
    const routineNumber = index + 1;
    const routineId = String(formData.get(`routine_id_${routineNumber}`) || "");
    const routineType =
      String(formData.get(`routine_type_${routineNumber}`) || "strength") ===
      "spt"
        ? "spt"
        : "strength";
    const payload = {
      routine_number: routineNumber,
      routine_type: routineType,
      title: nullableString(formData.get(`routine_title_${routineNumber}`)),
      focus_area: nullableString(formData.get(`routine_focus_area_${routineNumber}`)),
      objective: nullableString(formData.get(`routine_objective_${routineNumber}`)),
      duration_minutes: nullableNumber(
        formData.get(`routine_duration_minutes_${routineNumber}`)
      ),
      intensity: nullableString(formData.get(`routine_intensity_${routineNumber}`)),
      exercises: nullableString(formData.get(`routine_exercises_${routineNumber}`)),
      sets: nullableString(formData.get(`routine_sets_${routineNumber}`)),
      reps: nullableString(formData.get(`routine_reps_${routineNumber}`)),
      load: nullableString(formData.get(`routine_load_${routineNumber}`)),
      rest_seconds: nullableNumber(
        formData.get(`routine_rest_seconds_${routineNumber}`)
      ),
      tempo: nullableString(formData.get(`routine_tempo_${routineNumber}`)),
      technical_cue: nullableString(
        formData.get(`routine_technical_cue_${routineNumber}`)
      ),
      spt_drill: nullableString(formData.get(`routine_spt_drill_${routineNumber}`)),
      spt_volume: nullableString(formData.get(`routine_spt_volume_${routineNumber}`)),
      bow_load: nullableString(formData.get(`routine_bow_load_${routineNumber}`)),
      hold_seconds: nullableNumber(
        formData.get(`routine_hold_seconds_${routineNumber}`)
      ),
      updated_at: new Date().toISOString(),
    };

    if (routineId) {
      submittedRoutineIds.push(routineId);
      const { error } = await supabase
        .from("training_routine_blocks")
        .update(payload)
        .eq("id", routineId)
        .eq("training_session_id", trainingSessionId);

      if (error) throw new Error(error.message);
    } else {
      const { data: insertedRoutine, error } = await supabase
        .from("training_routine_blocks")
        .insert({
          ...payload,
          training_session_id: trainingSessionId,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      if (insertedRoutine?.id) submittedRoutineIds.push(insertedRoutine.id);
    }
  }

  const removedRoutineIds =
    existingRoutines
      ?.map((routine) => routine.id)
      .filter((routineId) => !submittedRoutineIds.includes(routineId)) || [];

  if (removedRoutineIds.length > 0) {
    const { error } = await supabase
      .from("training_routine_blocks")
      .delete()
      .in("id", removedRoutineIds);

    if (error) throw new Error(error.message);
  }

  await syncTrainingTotalsAndStatus(supabase, trainingSessionId);

  revalidatePath(`/trainings/${trainingSessionId}`);
  revalidatePath("/trainings");
  revalidatePath("/agenda");
}

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
