"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateTrainingAthleteResponse(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const trainingId = String(formData.get("training_id") || "");
  const response = String(formData.get("response") || "");

  if (!trainingId || !["accepted", "rejected"].includes(response)) {
    throw new Error("Respuesta inválida.");
  }

  const { data: athleteProfile } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!athleteProfile?.id) {
    throw new Error("No se encontró el perfil de atleta.");
  }

  const { data: training } = await supabase
    .from("training_sessions")
    .select("id, athlete_id")
    .eq("id", trainingId)
    .single();

  if (!training || training.athlete_id !== athleteProfile.id) {
    throw new Error("Solo puedes responder a entrenamientos asignados a tu perfil.");
  }

  const { error } = await supabase
    .from("training_sessions")
    .update({
      athlete_response_status: response,
      athlete_responded_at: new Date().toISOString(),
    })
    .eq("id", trainingId);

  if (error) {
    console.error(error);
    throw new Error("No se pudo guardar la respuesta del atleta.");
  }

  revalidatePath("/agenda");
  revalidatePath(`/trainings/${trainingId}`);
}
