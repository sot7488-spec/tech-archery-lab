"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createVideoAnalysisFeedback(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, role, club_id, name")
    .eq("id", user.id)
    .single();

  if (currentUser?.role !== "admin" && currentUser?.role !== "coach") {
    throw new Error("Solo admin o coach pueden registrar retroalimentacion.");
  }

  const athleteId = String(formData.get("athlete_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const feedback = String(formData.get("feedback") || "").trim();
  const snapshotDataUrl = String(formData.get("snapshot_data_url") || "").trim();
  const videoTimeSeconds = Number(formData.get("video_time_seconds") || 0);
  const analysisMode = String(formData.get("analysis_mode") || "").trim();

  if (!athleteId) throw new Error("Selecciona un atleta.");
  if (!feedback) throw new Error("Escribe la retroalimentacion del coach.");
  if (!snapshotDataUrl.startsWith("data:image/")) {
    throw new Error("No se pudo generar la captura del analisis.");
  }
  if (snapshotDataUrl.length > 6_000_000) {
    throw new Error("La captura es demasiado grande. Reduce el tamano del video o intenta otra pausa.");
  }

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("id, club_id, user_id")
    .eq("id", athleteId)
    .single();

  if (!athlete) throw new Error("Atleta no encontrado.");

  if (currentUser.role === "coach" && athlete.club_id !== currentUser.club_id) {
    throw new Error("Solo puedes retroalimentar atletas de tu club.");
  }

  const { error } = await supabase.from("video_analysis_feedback").insert({
    athlete_id: athleteId,
    coach_id: user.id,
    club_id: athlete.club_id,
    title: title || "Analisis tecnico",
    feedback,
    snapshot_data_url: snapshotDataUrl,
    video_time_seconds: Number.isFinite(videoTimeSeconds) ? videoTimeSeconds : null,
    analysis_mode: analysisMode || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/athletes/${athleteId}`);
  revalidatePath(`/athletes/profile/${athleteId}`);
  revalidatePath("/video-analysis");
}
