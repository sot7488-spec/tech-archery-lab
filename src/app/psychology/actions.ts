"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  role: string;
  club_id: string | null;
};

async function getAuthorizedContext(
  athleteId: string,
  staffId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Perfil no encontrado.");

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("id, club_id")
    .eq("id", athleteId)
    .single();

  if (!athlete?.id || !athlete.club_id) {
    throw new Error("Atleta no encontrado.");
  }

  let resolvedStaffId = staffId || null;

  if (profile.role === "sports_psychologist") {
    const { data: staff } = await supabase
      .from("performance_staff")
      .select("id, club_id, staff_type")
      .eq("user_id", user.id)
      .eq("staff_type", "sports_psychologist")
      .single();

    if (!staff?.id) {
      throw new Error("Tu usuario no esta vinculado a un perfil de psicologia deportiva.");
    }

    if (staff.club_id !== athlete.club_id) {
      throw new Error("Solo puedes trabajar con atletas de tu club.");
    }

    resolvedStaffId = staff.id;
  } else if (profile.role === "coach") {
    if (profile.club_id !== athlete.club_id) {
      throw new Error("Solo puedes trabajar con atletas de tu club.");
    }
  } else if (profile.role !== "admin") {
    throw new Error("No tienes permiso para registrar psicologia deportiva.");
  }

  return {
    supabase,
    userId: user.id,
    profile: profile as Profile,
    athlete,
    staffId: resolvedStaffId,
  };
}

function scoreValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) || 3);
  return Math.max(1, Math.min(5, value));
}

export async function createSportPsychologySession(formData: FormData) {
  const athleteId = String(formData.get("athlete_id") || "");
  const staffId = String(formData.get("staff_id") || "") || null;
  const techniqueId = String(formData.get("technique_id") || "") || null;

  const { supabase, userId, athlete, staffId: resolvedStaffId } =
    await getAuthorizedContext(athleteId, staffId);

  const { error } = await supabase.from("psychology_sessions").insert({
    athlete_id: athlete.id,
    staff_id: resolvedStaffId,
    club_id: athlete.club_id,
    technique_id: techniqueId,
    session_date:
      String(formData.get("session_date") || "") ||
      new Date().toISOString().slice(0, 10),
    session_type: String(formData.get("session_type") || "sport_checkin"),
    focus_area: String(formData.get("focus_area") || "") || null,
    sport_feeling: String(formData.get("sport_feeling") || "") || null,
    confidence_score: scoreValue(formData, "confidence_score"),
    focus_score: scoreValue(formData, "focus_score"),
    pressure_score: scoreValue(formData, "pressure_score"),
    breathing_control_score: scoreValue(formData, "breathing_control_score"),
    routine_clarity_score: scoreValue(formData, "routine_clarity_score"),
    error_recovery_score: scoreValue(formData, "error_recovery_score"),
    stress_score: scoreValue(formData, "stress_score"),
    notes: String(formData.get("notes") || "") || null,
    recommendation: String(formData.get("recommendation") || "") || null,
    private_notes: String(formData.get("private_notes") || "") || null,
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/psychology");
  revalidatePath(`/athletes/${athlete.id}`);
}

export async function assignMentalTechnique(formData: FormData) {
  const athleteId = String(formData.get("athlete_id") || "");
  const staffId = String(formData.get("staff_id") || "") || null;
  const techniqueId = String(formData.get("technique_id") || "");

  if (!techniqueId) throw new Error("Selecciona una tecnica.");

  const { supabase, userId, athlete, staffId: resolvedStaffId } =
    await getAuthorizedContext(athleteId, staffId);

  const { error } = await supabase
    .from("athlete_mental_technique_assignments")
    .insert({
      athlete_id: athlete.id,
      staff_id: resolvedStaffId,
      club_id: athlete.club_id,
      technique_id: techniqueId,
      objective: String(formData.get("objective") || "") || null,
      assigned_by: userId,
    });

  if (error) throw new Error(error.message);

  revalidatePath("/psychology");
  revalidatePath(`/athletes/${athlete.id}`);
}
