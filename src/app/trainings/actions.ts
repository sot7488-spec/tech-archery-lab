"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createTraining(formData: FormData) {
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

  const distance_meters = Number(formData.get("distance_meters") || 0);
  const target_size_cm = Number(formData.get("target_size_cm") || 0);
  const total_series = Number(formData.get("total_series") || 0);

  if (!athlete_id || !training_date || !distance_meters || !total_series) {
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

  const { data: training, error: trainingError } = await supabase
    .from("training_sessions")
    .insert({
      athlete_id,
      club_id: athleteProfile?.club_id || null,
      coach_id: athleteProfile?.coach_id || null,
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

  const { error: roundError } = await supabase.from("training_rounds").insert({
    training_session_id: training.id,
    round_number: 1,
    distance_meters,
    target_size_cm,
    total_series,
    arrows_per_series: 6,
  });

  if (roundError) {
    console.error(roundError);
    throw new Error("Error creando configuración de ronda");
  }

  revalidatePath("/trainings");
}