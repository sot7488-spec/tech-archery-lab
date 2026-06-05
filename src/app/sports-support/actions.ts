"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SUPPORT_PATHS: Record<string, string> = {
  physical_trainer: "/conditioning",
  sports_psychologist: "/psychology",
};

export async function createPerformanceStaff(formData: FormData) {
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
    throw new Error("No tienes permiso para registrar staff.");
  }

  const staffType = String(formData.get("staff_type") || "");
  if (!SUPPORT_PATHS[staffType]) {
    throw new Error("Tipo de staff no valido.");
  }

  const clubId =
    profile.role === "coach"
      ? profile.club_id
      : String(formData.get("club_id") || "");

  if (!clubId) throw new Error("Selecciona un club.");

  const { error } = await supabase.from("performance_staff").insert({
    club_id: clubId,
    staff_type: staffType,
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    specialty: String(formData.get("specialty") || "") || null,
    certification_level: String(formData.get("certification_level") || "") || null,
    certification_institution:
      String(formData.get("certification_institution") || "") || null,
    years_experience: Number(formData.get("years_experience") || 0),
    notes: String(formData.get("notes") || "") || null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(SUPPORT_PATHS[staffType]);
}
