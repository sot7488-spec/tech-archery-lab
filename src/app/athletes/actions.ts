"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createAthlete(formData: FormData) {
  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const category = String(formData.get("category"));
  const bow_type = String(formData.get("bow_type"));
  const dominant_hand = String(formData.get("dominant_hand"));
  const draw_weight_lbs = Number(formData.get("draw_weight_lbs"));

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      name,
      email,
      role: "athlete",
    })
    .select()
    .single();

  if (userError) {
    console.error(userError);
    throw new Error("Error creando usuario");
  }

  const { error: athleteError } = await supabase
    .from("athlete_profiles")
    .insert({
      user_id: user.id,
      category,
      bow_type,
      dominant_hand,
      draw_weight_lbs,
    });

  if (athleteError) {
    console.error(athleteError);
    throw new Error("Error creando atleta");
  }

  revalidatePath("/athletes");
}