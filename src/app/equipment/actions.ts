"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createEquipment(formData: FormData) {
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
    throw new Error("No tienes permiso para crear equipamiento.");
  }

  const athleteId = String(formData.get("athlete_id"));

  if (!athleteId || athleteId === "null") {
    throw new Error("Selecciona un atleta para registrar el equipamiento.");
  }

  if (currentUser.role === "coach") {
    const { data: athlete } = await supabase
      .from("athlete_profiles")
      .select("club_id")
      .eq("id", athleteId)
      .single();

    if (!athlete || athlete.club_id !== currentUser.club_id) {
      throw new Error("Solo puedes crear equipamiento para atletas de tu club.");
    }
  }

  const payload = {
    athlete_id: athleteId,
    name: String(formData.get("name") || "Equipo principal"),
    bow_type: String(formData.get("bow_type") || "recurvo"),

    bow_brand: String(formData.get("bow_brand") || ""),
    bow_model: String(formData.get("bow_model") || ""),

    riser_brand: String(formData.get("riser_brand") || ""),
    riser_model: String(formData.get("riser_model") || ""),
    riser_length_inches: Number(formData.get("riser_length_inches") || 0),

    limb_brand: String(formData.get("limb_brand") || ""),
    limbs_model: String(formData.get("limbs_model") || ""),
    limb_length: String(formData.get("limb_length") || ""),
    draw_weight_lbs: Number(formData.get("draw_weight_lbs") || 0),
    draw_length_inches: Number(formData.get("draw_length_inches") || 0),

    bow_length_inches: Number(formData.get("bow_length_inches") || 0),

    arrow_brand: String(formData.get("arrow_brand") || ""),
    arrow_model: String(formData.get("arrow_model") || ""),
    spine: String(formData.get("spine") || ""),
    arrow_length_inches: Number(formData.get("arrow_length_inches") || 0),
    point_weight_grains: Number(formData.get("point_weight_grains") || 0),

    sight_brand: String(formData.get("sight_brand") || ""),
    sight_model: String(formData.get("sight_model") || ""),

    rest_brand: String(formData.get("rest_brand") || ""),
    rest_model: String(formData.get("rest_model") || ""),

    plunger_brand: String(formData.get("plunger_brand") || ""),
    plunger_model: String(formData.get("plunger_model") || ""),

    stabilizer_brand: String(formData.get("stabilizer_brand") || ""),
    stabilizer_setup: String(formData.get("stabilizer_setup") || ""),

    string_material: String(formData.get("string_material") || ""),
    string_strands: Number(formData.get("string_strands") || 0),

    brace_height_cm: Number(formData.get("brace_height_cm") || 0),
    tiller_top_cm: Number(formData.get("tiller_top_cm") || 0),
    tiller_bottom_cm: Number(formData.get("tiller_bottom_cm") || 0),
    nocking_point_mm: Number(formData.get("nocking_point_mm") || 0),

    notes: String(formData.get("notes") || ""),
    is_active: true,
  };

  const { error } = await supabase.from("equipment_profiles").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/equipment");
}
