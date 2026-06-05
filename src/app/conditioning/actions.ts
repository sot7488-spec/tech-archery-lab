"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createConditioningRoutine(formData: FormData) {
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
  if (profile.role !== "admin" && profile.role !== "coach") {
    throw new Error("No tienes permiso para crear rutinas.");
  }

  const staffId = String(formData.get("staff_id") || "");
  const athleteId = String(formData.get("athlete_id") || "");
  const goalId = String(formData.get("goal_id") || "");

  const { data: staff } = await supabase
    .from("performance_staff")
    .select("id, club_id, staff_type")
    .eq("id", staffId)
    .eq("staff_type", "physical_trainer")
    .single();

  if (!staff?.id) throw new Error("Preparador fisico no encontrado.");

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("id, club_id")
    .eq("id", athleteId)
    .single();

  if (!athlete?.id || !athlete.club_id) {
    throw new Error("Atleta no encontrado.");
  }

  if (profile.role === "coach") {
    if (profile.club_id !== athlete.club_id || profile.club_id !== staff.club_id) {
      throw new Error("Solo puedes crear rutinas para atletas y staff de tu club.");
    }
  }

  if (staff.club_id && staff.club_id !== athlete.club_id) {
    throw new Error("El preparador fisico debe pertenecer al club del atleta.");
  }

  const { data: routine, error } = await supabase
    .from("conditioning_routines")
    .insert({
      athlete_id: athlete.id,
      staff_id: staff.id,
      goal_id: goalId || null,
      club_id: athlete.club_id,
      title: String(formData.get("title") || ""),
      objective: String(formData.get("objective") || "") || null,
      phase: String(formData.get("phase") || "") || null,
      frequency_per_week: Number(formData.get("frequency_per_week") || 3),
      duration_weeks: Number(formData.get("duration_weeks") || 4),
      start_date: String(formData.get("start_date") || new Date().toISOString().slice(0, 10)),
      status: "active",
      notes: String(formData.get("notes") || "") || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const exercises = [1, 2, 3, 4, 5]
    .map((index) => ({
      routine_id: routine.id,
      exercise_order: index,
      name: String(formData.get(`exercise_name_${index}`) || "").trim(),
      focus_area: String(formData.get(`exercise_focus_${index}`) || "").trim() || null,
      sets: String(formData.get(`exercise_sets_${index}`) || "").trim() || null,
      reps: String(formData.get(`exercise_reps_${index}`) || "").trim() || null,
      load: String(formData.get(`exercise_load_${index}`) || "").trim() || null,
      rest: String(formData.get(`exercise_rest_${index}`) || "").trim() || null,
      notes: String(formData.get(`exercise_notes_${index}`) || "").trim() || null,
    }))
    .filter((exercise) => exercise.name);

  if (exercises.length > 0) {
    const { error: exercisesError } = await supabase
      .from("conditioning_routine_exercises")
      .insert(exercises);

    if (exercisesError) throw new Error(exercisesError.message);
  }

  revalidatePath("/conditioning");
  revalidatePath(`/conditioning/${staff.id}`);
}
