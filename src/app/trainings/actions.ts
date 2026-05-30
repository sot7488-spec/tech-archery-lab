"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
