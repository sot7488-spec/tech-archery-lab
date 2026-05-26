"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createTraining(formData: FormData) {
  const athlete_id = String(formData.get("athlete_id"));
  const training_date = String(formData.get("training_date"));
  const location = String(formData.get("location"));
  const session_type = String(formData.get("session_type"));
  const weather = String(formData.get("weather"));
  const wind_speed_kmh = Number(formData.get("wind_speed_kmh") || 0);
  const temperature_c = Number(formData.get("temperature_c") || 0);
  const objective = String(formData.get("objective"));
  const coach_notes = String(formData.get("coach_notes"));

  const { error } = await supabase
    .from("training_sessions")
    .insert({
      athlete_id,
      training_date,
      location,
      session_type,
      weather,
      wind_speed_kmh,
      temperature_c,
      objective,
      coach_notes,
      equipment_profile_id:
      String(formData.get("equipment_profile_id") || "") || null,
      brace_height_cm: Number(formData.get("brace_height_cm") || 0),
    });

  if (error) {
    console.error(error);
    throw new Error("Error creando entrenamiento");
  }

  revalidatePath("/trainings");
}