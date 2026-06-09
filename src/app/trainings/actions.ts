"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getPositiveNumber(value: FormDataEntryValue | null, fallback = 0) {
  const numberValue = Number(value || fallback);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

function getTrainingRoundsPayload(formData: FormData, trainingId: string) {
  const roundsCount = getPositiveNumber(formData.get("rounds_count"), 0);

  if (!roundsCount) {
    return [
      {
        training_session_id: trainingId,
        round_number: 1,
        distance_meters: getPositiveNumber(formData.get("distance_meters")),
        target_size_cm: getPositiveNumber(formData.get("target_size_cm")),
        total_series: getPositiveNumber(formData.get("total_series")),
        arrows_per_series: 6,
        scoring_enabled: true,
        session_type: String(formData.get("session_type") || "") || null,
        objective: String(formData.get("objective") || "") || null,
        status: "active",
      },
    ];
  }

  return Array.from({ length: roundsCount }, (_, index) => {
    const roundNumber = index + 1;

    return {
      training_session_id: trainingId,
      round_number: roundNumber,
      distance_meters: getPositiveNumber(
        formData.get(`round_distance_meters_${roundNumber}`)
      ),
      target_size_cm: getPositiveNumber(
        formData.get(`round_target_size_cm_${roundNumber}`)
      ),
      total_series: getPositiveNumber(
        formData.get(`round_total_series_${roundNumber}`)
      ),
      arrows_per_series: getPositiveNumber(
        formData.get(`round_arrows_per_series_${roundNumber}`),
        6
      ),
      scoring_enabled:
        String(formData.get(`round_scoring_enabled_${roundNumber}`) || "") ===
        "on",
      session_type:
        String(formData.get(`round_session_type_${roundNumber}`) || "") || null,
      objective:
        String(formData.get(`round_objective_${roundNumber}`) || "") || null,
      notes: String(formData.get(`round_notes_${roundNumber}`) || "") || null,
      status: "active",
    };
  });
}

function nullableString(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function nullablePositiveNumber(value: FormDataEntryValue | null) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function getTrainingRoutineBlocksPayload(formData: FormData, trainingId: string) {
  const routinesCount = getPositiveNumber(formData.get("routines_count"), 0);

  if (!routinesCount) return [];

  return Array.from({ length: routinesCount }, (_, index) => {
    const routineNumber = index + 1;
    const routineType =
      String(formData.get(`routine_type_${routineNumber}`) || "strength") ===
      "spt"
        ? "spt"
        : "strength";

    return {
      training_session_id: trainingId,
      routine_number: routineNumber,
      routine_type: routineType,
      title: nullableString(formData.get(`routine_title_${routineNumber}`)),
      focus_area: nullableString(formData.get(`routine_focus_area_${routineNumber}`)),
      objective: nullableString(formData.get(`routine_objective_${routineNumber}`)),
      duration_minutes: nullablePositiveNumber(
        formData.get(`routine_duration_minutes_${routineNumber}`)
      ),
      intensity: nullableString(formData.get(`routine_intensity_${routineNumber}`)),
      exercises: nullableString(formData.get(`routine_exercises_${routineNumber}`)),
      sets: nullableString(formData.get(`routine_sets_${routineNumber}`)),
      reps: nullableString(formData.get(`routine_reps_${routineNumber}`)),
      load: nullableString(formData.get(`routine_load_${routineNumber}`)),
      rest_seconds: nullablePositiveNumber(
        formData.get(`routine_rest_seconds_${routineNumber}`)
      ),
      tempo: nullableString(formData.get(`routine_tempo_${routineNumber}`)),
      technical_cue: nullableString(
        formData.get(`routine_technical_cue_${routineNumber}`)
      ),
      spt_drill: nullableString(formData.get(`routine_spt_drill_${routineNumber}`)),
      spt_volume: nullableString(formData.get(`routine_spt_volume_${routineNumber}`)),
      bow_load: nullableString(formData.get(`routine_bow_load_${routineNumber}`)),
      hold_seconds: nullablePositiveNumber(
        formData.get(`routine_hold_seconds_${routineNumber}`)
      ),
    };
  });
}

export async function createTraining(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (currentUser?.role !== "admin" && currentUser?.role !== "coach") {
    throw new Error("No tienes permiso para crear entrenamientos.");
  }

  const athlete_id = String(formData.get("athlete_id") || "");
  const training_date = String(formData.get("training_date") || "");
  const location = String(formData.get("location") || "");
  const session_type = String(formData.get("session_type") || "");
  const weather = String(formData.get("weather") || "otro");

  const equipment_profile_id =
    String(formData.get("equipment_profile_id") || "") || null;

  const brace_height_cm = formData.get("brace_height_cm")
    ? Number(formData.get("brace_height_cm"))
    : null;

  const wind_speed_kmh = formData.get("wind_speed_kmh")
    ? Number(formData.get("wind_speed_kmh"))
    : null;

  const temperature_c = formData.get("temperature_c")
    ? Number(formData.get("temperature_c"))
    : null;

  const objective = String(formData.get("objective") || "");
  const coach_notes = String(formData.get("coach_notes") || "");

  if (!athlete_id || !training_date) {
    throw new Error("Faltan datos obligatorios para crear el entrenamiento");
  }

  const { data: athleteProfile, error: athleteError } = await supabase
    .from("athlete_profiles")
    .select("club_id, coach_id")
    .eq("id", athlete_id)
    .single();

  if (athleteError) {
    console.error(athleteError);
    throw new Error("No se pudo obtener la información del atleta");
  }

  if (
    currentUser.role === "coach" &&
    athleteProfile?.club_id !== currentUser.club_id
  ) {
    throw new Error("Solo puedes crear entrenamientos para atletas de tu club.");
  }

  const { data: training, error: trainingError } = await supabase
    .from("training_sessions")
    .insert({
      athlete_id,
      club_id: athleteProfile?.club_id || null,
      coach_id:
        currentUser.role === "coach"
          ? user.id
          : athleteProfile?.coach_id || null,
      equipment_profile_id,
      brace_height_cm,
      training_date,
      location,
      session_type,
      weather,
      wind_speed_kmh,
      temperature_c,
      objective,
      coach_notes,
      status: "active",
    })
    .select("id")
    .single();

  if (trainingError || !training) {
    console.error(trainingError);
    throw new Error("Error creando entrenamiento");
  }

  const rounds = getTrainingRoundsPayload(formData, training.id);
  const invalidRound = rounds.find(
    (round) =>
      !round.distance_meters ||
      !round.target_size_cm ||
      !round.total_series ||
      !round.arrows_per_series
  );

  if (invalidRound) {
    throw new Error("Completa distancia, diana, series y flechas de cada ronda.");
  }

  const { error: roundError } = await supabase
    .from("training_rounds")
    .insert(rounds);

  if (roundError) {
    console.error(roundError);
    throw new Error("Error creando configuración de ronda");
  }

  const routineBlocks = getTrainingRoutineBlocksPayload(formData, training.id);

  if (routineBlocks.length > 0) {
    const { error: routineError } = await supabase
      .from("training_routine_blocks")
      .insert(routineBlocks);

    if (routineError) {
      console.error(routineError);
      throw new Error(
        routineError.message || "Error creando rutinas del entrenamiento"
      );
    }
  }

  revalidatePath("/trainings");
}

export async function deleteTraining(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (currentUser?.role !== "admin" && currentUser?.role !== "coach") {
    throw new Error("No tienes permiso para eliminar entrenamientos.");
  }

  const trainingId = String(formData.get("training_id") || "");
  const redirectTo = String(formData.get("redirect_to") || "/trainings");

  if (!trainingId) throw new Error("Falta el entrenamiento.");

  const { data: training } = await supabase
    .from("training_sessions")
    .select("id, club_id")
    .eq("id", trainingId)
    .single();

  if (!training) throw new Error("Entrenamiento no encontrado.");

  if (
    currentUser.role === "coach" &&
    training.club_id !== currentUser.club_id
  ) {
    throw new Error("Solo puedes eliminar entrenamientos de atletas de tu club.");
  }

  const { error } = await supabase.rpc("delete_training_session", {
    p_training_id: trainingId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/trainings");
  revalidatePath(`/trainings/${trainingId}`);
  redirect(redirectTo);
}
