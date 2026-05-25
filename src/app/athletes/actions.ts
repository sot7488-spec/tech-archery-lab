"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createAthlete(formData: FormData) {
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const category = String(formData.get("category") || "");
  const bow_type = String(formData.get("bow_type") || "");
  const dominant_hand = String(formData.get("dominant_hand") || "");
  const draw_weight_lbs = Number(formData.get("draw_weight_lbs") || 0);
  const photo = formData.get("photo") as File | null;

  let photo_url = "";

  if (photo && photo.size > 0) {
    const fileExt = photo.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `athletes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("athlete-photos")
      .upload(filePath, photo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("athlete-photos")
      .getPublicUrl(filePath);

    photo_url = data.publicUrl;
  }

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
    throw new Error(userError.message);
  }

  const { error: athleteError } = await supabase
    .from("athlete_profiles")
    .insert({
      user_id: user.id,
      category,
      bow_type,
      dominant_hand,
      draw_weight_lbs,
      photo_url,
    });

  if (athleteError) {
    throw new Error(athleteError.message);
  }

  revalidatePath("/athletes");
}