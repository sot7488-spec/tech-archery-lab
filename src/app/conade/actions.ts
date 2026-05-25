"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createConadeMark(formData: FormData) {
  const { error } = await supabase.from("conade_marks").insert({
    year: Number(formData.get("year")),
    category: String(formData.get("category")),
    gender: String(formData.get("gender")),
    bow_type: String(formData.get("bow_type")),
    distance_meters: Number(formData.get("distance_meters")),
    target_size_cm: Number(formData.get("target_size_cm") || 0),
    arrows_count: Number(formData.get("arrows_count") || 72),
    minimum_score: Number(formData.get("minimum_score")),
    notes: String(formData.get("notes") || ""),
  });

  if (error) {
    console.error(error);
    throw new Error("Error creando marca CONADE");
  }

  revalidatePath("/conade");
}