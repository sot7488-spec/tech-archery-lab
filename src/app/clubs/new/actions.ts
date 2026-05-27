"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createClub(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const country = String(formData.get("country") || "México").trim();
  const logo_url = String(formData.get("logo_url") || "").trim();

  if (!name) {
    throw new Error("El nombre del club es obligatorio.");
  }

  const { error } = await supabase.from("clubs").insert({
    name,
    city: city || null,
    state: state || null,
    country: country || "México",
    logo_url: logo_url || null,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/clubs");
}