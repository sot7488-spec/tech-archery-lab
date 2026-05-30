"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createConadeMark(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Solo un admin puede crear marcas CONADE.");
  }

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
