"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function optionalNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  return Number(value);
}

export async function createTuningLog(formData: FormData) {
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
    throw new Error("No tienes permiso para registrar tuning.");
  }

  const athleteId = String(formData.get("athlete_id") || "");
  const equipmentProfileId = String(formData.get("equipment_profile_id") || "");

  if (!athleteId || !equipmentProfileId) {
    throw new Error("Selecciona atleta y equipo para registrar el ajuste.");
  }

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("club_id")
    .eq("id", athleteId)
    .single();

  if (!athlete) throw new Error("Atleta no encontrado.");

  if (currentUser.role === "coach" && athlete.club_id !== currentUser.club_id) {
    throw new Error("Solo puedes registrar tuning para atletas de tu club.");
  }

  const { data: equipment } = await supabase
    .from("equipment_profiles")
    .select("athlete_id")
    .eq("id", equipmentProfileId)
    .single();

  if (!equipment || equipment.athlete_id !== athleteId) {
    throw new Error("El equipo seleccionado no pertenece al atleta.");
  }

  const payload = {
    equipment_profile_id: equipmentProfileId,
    athlete_id: athleteId,
    coach_id: user.id,
    tuning_date: String(formData.get("tuning_date") || new Date().toISOString().slice(0, 10)),
    brace_height_cm: optionalNumber(formData.get("brace_height_cm")),
    tiller_top_cm: optionalNumber(formData.get("tiller_top_cm")),
    tiller_bottom_cm: optionalNumber(formData.get("tiller_bottom_cm")),
    nocking_point_mm: optionalNumber(formData.get("nocking_point_mm")),
    button_settings: String(formData.get("button_settings") || ""),
    sight_settings: String(formData.get("sight_settings") || ""),
    change_description: String(formData.get("change_description") || ""),
    observed_result: String(formData.get("observed_result") || ""),
  };

  const { error } = await supabase.from("equipment_tuning_logs").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tuning");
  revalidatePath("/equipment");
}
