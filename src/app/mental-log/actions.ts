"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const positiveEmotions = new Set(["confianza", "tranquilidad", "motivacion"]);
const positiveBodyStates = new Set([
  "respiracion",
  "estabilidad",
  "energia",
]);

function clampScore(value: FormDataEntryValue | null) {
  const score = Number(value || 3);
  return Math.max(1, Math.min(5, Number.isFinite(score) ? score : 3));
}

function profileLabel(score: number) {
  if (score >= 85) return "Optimo";
  if (score >= 70) return "Funcional";
  if (score >= 50) return "Atencion";
  return "Reforzar";
}

function dimensionScore(key: string, intensity: number, positiveSet: Set<string>) {
  return positiveSet.has(key) ? intensity : 6 - intensity;
}

export async function saveMentalTrainingLog(formData: FormData) {
  const trainingSessionId = String(formData.get("training_session_id") || "");
  const athleteId = String(formData.get("athlete_id") || "");
  const emotionKey = String(formData.get("emotion_key") || "confianza");
  const bodyKey = String(formData.get("body_key") || "respiracion");
  const emotionIntensity = clampScore(formData.get("emotion_intensity"));
  const bodyIntensity = clampScore(formData.get("body_intensity"));
  const processFocusScore = clampScore(formData.get("process_focus_score"));
  const emotionalControlScore = clampScore(
    formData.get("emotional_control_score")
  );
  const errorRecoveryScore = clampScore(formData.get("error_recovery_score"));

  if (!trainingSessionId || !athleteId) {
    throw new Error("Selecciona un entrenamiento.");
  }

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

  const { data: training } = await supabase
    .from("training_sessions")
    .select("id, athlete_id, club_id, training_date")
    .eq("id", trainingSessionId)
    .eq("athlete_id", athleteId)
    .single();

  if (!training?.id) throw new Error("Entrenamiento no encontrado.");

  if (profile.role === "athlete") {
    const { data: athlete } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("id", athleteId)
      .eq("user_id", user.id)
      .single();

    if (!athlete?.id) {
      throw new Error("Solo puedes registrar tu propia bitacora mental.");
    }
  } else if (
    profile.role === "coach" ||
    profile.role === "sports_psychologist"
  ) {
    if (profile.club_id !== training.club_id) {
      throw new Error("Solo puedes registrar atletas de tu club.");
    }
  } else if (profile.role !== "admin") {
    throw new Error("No tienes permiso para registrar bitacora mental.");
  }

  const emotionScore = dimensionScore(
    emotionKey,
    emotionIntensity,
    positiveEmotions
  );
  const bodyScore = dimensionScore(bodyKey, bodyIntensity, positiveBodyStates);
  const executionScore =
    (processFocusScore + emotionalControlScore + errorRecoveryScore) / 3;
  const mentalScore = Math.round(
    (emotionScore / 5) * 30 +
      (bodyScore / 5) * 30 +
      (executionScore / 5) * 40
  );

  const { error } = await supabase.from("mental_training_logs").upsert(
    {
      training_session_id: training.id,
      athlete_id: athleteId,
      club_id: training.club_id,
      log_date: training.training_date || new Date().toISOString().slice(0, 10),
      emotion_key: emotionKey,
      emotion_intensity: emotionIntensity,
      body_key: bodyKey,
      body_intensity: bodyIntensity,
      process_focus_score: processFocusScore,
      emotional_control_score: emotionalControlScore,
      error_recovery_score: errorRecoveryScore,
      mental_score: mentalScore,
      profile_label: profileLabel(mentalScore),
      sport_note: String(formData.get("sport_note") || "") || null,
      cue_word: String(formData.get("cue_word") || "") || null,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "training_session_id,athlete_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/mental-log");
  revalidatePath("/mind");
  revalidatePath("/psychology");
}
