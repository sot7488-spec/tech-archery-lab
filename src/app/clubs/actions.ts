"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createClub(formData: FormData) {
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
    throw new Error("Solo un admin puede crear clubs.");
  }

  const name = String(formData.get("name") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const country = String(formData.get("country") || "México").trim();
  const logo_url = String(formData.get("logo_url") || "").trim();

  if (!name) throw new Error("El nombre del club es obligatorio.");

  const { error } = await supabase.from("clubs").insert({
    name,
    city: city || null,
    state: state || null,
    country: country || "México",
    logo_url: logo_url || null,
    is_active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/clubs");
}

export async function deleteClubWithStrategy(formData: FormData) {
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
    throw new Error("Solo un admin puede eliminar clubs.");
  }

  const clubId = String(formData.get("club_id") || "");
  const strategy = String(formData.get("strategy") || "");
  const targetClubId = String(formData.get("target_club_id") || "") || null;

  if (!clubId) throw new Error("Falta el club a eliminar.");

  const { error } = await supabase.rpc("delete_club_with_strategy", {
    p_club_id: clubId,
    p_strategy: strategy,
    p_target_club_id: targetClubId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/clubs");
  redirect("/clubs");
}
