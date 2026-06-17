"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CameraViewV3 } from "@/lib/video-analysis-v3/biomechanics";

const CAMERA_VIEWS: CameraViewV3[] = ["lateral", "frontal", "superior"];

export async function saveVideoAnalysisV3(formData: FormData) {
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

  if (!currentUser) throw new Error("Perfil no encontrado.");

  const athleteId = String(formData.get("athlete_id") || "").trim();
  const cameraView = String(formData.get("camera_view") || "").trim() as CameraViewV3;
  const score = Number(formData.get("score") || 0);
  const anchorTimeSeconds = Number(formData.get("anchor_time_seconds") || 0);
  const framesAnalyzed = Number(formData.get("frames_analyzed") || 0);
  const phase = String(formData.get("phase") || "anchor").trim();
  const metrics = JSON.parse(String(formData.get("metrics") || "[]"));
  const errors = JSON.parse(String(formData.get("errors") || "[]"));

  if (!athleteId) throw new Error("Selecciona un atleta.");
  if (!CAMERA_VIEWS.includes(cameraView)) {
    throw new Error("Selecciona una vista valida.");
  }

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("id, club_id, user_id")
    .eq("id", athleteId)
    .single();

  if (!athlete) throw new Error("Atleta no encontrado.");

  if (currentUser.role === "coach" && athlete.club_id !== currentUser.club_id) {
    throw new Error("Solo puedes guardar analisis de atletas de tu club.");
  }

  if (currentUser.role === "athlete" && athlete.user_id !== user.id) {
    throw new Error("Solo puedes guardar analisis de tu propio perfil.");
  }

  const { data, error } = await supabase
    .from("video_analysis_v3")
    .insert({
      athlete_id: athleteId,
      coach_id: currentUser.role === "coach" || currentUser.role === "admin" ? user.id : null,
      club_id: athlete.club_id,
      camera_view: cameraView,
      anchor_time_seconds: Number.isFinite(anchorTimeSeconds) ? anchorTimeSeconds : 0,
      phase,
      score: Math.max(0, Math.min(100, Math.round(score))),
      metrics,
      errors,
      frames_analyzed: Number.isFinite(framesAnalyzed) ? Math.round(framesAnalyzed) : 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/video-analysis-v3");
  revalidatePath(`/athletes/${athleteId}`);

  if (data?.id) redirect(`/video-analysis-v3/${data.id}`);
}
