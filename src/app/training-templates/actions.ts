"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

function getRounds(formData: FormData) {
  const count = positiveNumber(formData.get("rounds_count"), 1);

  return Array.from({ length: count }, (_, index) => {
    const roundNumber = index + 1;

    return {
      round_number: roundNumber,
      session_type: nullableString(formData.get(`round_session_type_${roundNumber}`)),
      objective: nullableString(formData.get(`round_objective_${roundNumber}`)),
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
    };
  });
}

export async function createTrainingTemplate(formData: FormData) {
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
    throw new Error("No tienes permiso para crear plantillas.");
  }

  const name = nullableString(formData.get("name"));
  if (!name) throw new Error("Agrega un nombre para la plantilla.");

  const clubId =
    currentUser.role === "coach"
      ? currentUser.club_id
      : nullableString(formData.get("club_id")) || currentUser.club_id;

  if (!clubId) throw new Error("Selecciona un club para la plantilla.");

  const rounds = getRounds(formData);
  const invalidRound = rounds.find(
    (round) =>
      !round.distance_meters ||
      !round.target_size_cm ||
      !round.total_series ||
      !round.arrows_per_series
  );

  if (invalidRound) {
    throw new Error("Completa distancia, diana, series y flechas por ronda.");
  }

  const { error } = await supabase.from("training_templates").insert({
    club_id: clubId,
    created_by: user.id,
    name,
    description: nullableString(formData.get("description")),
    session_type: nullableString(formData.get("session_type")),
    location: nullableString(formData.get("location")),
    weather: nullableString(formData.get("weather")),
    objective: nullableString(formData.get("objective")),
    brace_height_cm: nullableNumber(formData.get("brace_height_cm")),
    wind_speed_kmh: nullableNumber(formData.get("wind_speed_kmh")),
    temperature_c: nullableNumber(formData.get("temperature_c")),
    rounds,
    routines: [],
  });

  if (error) throw new Error(error.message);

  revalidatePath("/training-templates");
  revalidatePath("/trainings");
}

export async function deleteTrainingTemplate(formData: FormData) {
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
    throw new Error("No tienes permiso para eliminar plantillas.");
  }

  const templateId = String(formData.get("template_id") || "");
  if (!templateId) throw new Error("Falta la plantilla.");

  let query = supabase.from("training_templates").delete().eq("id", templateId);

  if (currentUser.role === "coach") {
    query = query.eq("club_id", currentUser.club_id);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);

  revalidatePath("/training-templates");
  revalidatePath("/trainings");
}
