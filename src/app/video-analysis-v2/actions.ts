"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveVideoAnalysisV2(formData: FormData) {
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
  const viewType = String(formData.get("view_type") || "").trim();
  const score = Number(formData.get("score") || 0);
  const metrics = JSON.parse(String(formData.get("metrics") || "[]"));
  const observations = JSON.parse(String(formData.get("observations") || "[]"));
  const recommendations = JSON.parse(
    String(formData.get("recommendations") || "[]")
  );

  if (!athleteId) throw new Error("Selecciona un atleta.");
  if (!["frontal", "lateral", "superior"].includes(viewType)) {
    throw new Error("Selecciona un tipo de toma valido.");
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
    .from("video_analysis")
    .insert({
      athlete_id: athleteId,
      coach_id: currentUser.role === "coach" || currentUser.role === "admin" ? user.id : null,
      club_id: athlete.club_id,
      video_url: null,
      view_type: viewType,
      score: Math.max(0, Math.min(100, Math.round(score))),
      metrics,
      observations,
      recommendations,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/video-analysis-v2");
  revalidatePath(`/athletes/${athleteId}`);

  if (data?.id) redirect(`/video-analysis-v2/${data.id}`);
}
