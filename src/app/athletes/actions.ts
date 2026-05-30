"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAthlete(formData: FormData) {
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

  if (currentUser?.role !== "admin" && currentUser?.role !== "coach") {
    throw new Error("No tienes permiso para crear atletas.");
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  const curp = String(formData.get("curp") || "").trim();
  const birthdate = String(formData.get("birthdate") || "").trim();
  const gender = String(formData.get("gender") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const bow_type = String(formData.get("bow_type") || "recurvo").trim();
  const dominant_hand = String(formData.get("dominant_hand") || "").trim();
  const requestedClubId = String(formData.get("club_id") || "").trim();
  const club_id =
    currentUser.role === "coach" ? currentUser.club_id || "" : requestedClubId;
  const association_id = String(formData.get("association_id") || "").trim();
  const federation_id = String(formData.get("federation_id") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  const photo = formData.get("photo") as File | null;

  let photo_url: string | null = null;

  if (!name) {
    throw new Error("El nombre del atleta es obligatorio.");
  }

  if (!email) {
    throw new Error("El correo electrónico es obligatorio.");
  }

  if (currentUser.role === "coach" && !club_id) {
    throw new Error("Tu usuario coach no tiene club asignado.");
  }

  // =========================
  // Subir foto si existe
  // =========================
  if (photo && photo.size > 0) {
    const fileExt = photo.name.split(".").pop() || "jpg";
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

  // =========================
  // Buscar usuario existente
  // =========================
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUserError) {
    throw new Error(existingUserError.message);
  }

  let userId = existingUser?.id;

  // =========================
  // Crear usuario si no existe
  // =========================
  if (!userId) {
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        name,
        email,
        role: "athlete",
      })
      .select("id")
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    userId = newUser.id;
  }

  // =========================
  // Validar si ya tiene perfil de atleta
  // =========================
  const { data: existingAthleteProfile, error: profileCheckError } =
    await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

  if (profileCheckError) {
    throw new Error(profileCheckError.message);
  }

  if (existingAthleteProfile) {
    throw new Error("Este correo ya tiene un perfil de atleta registrado.");
  }

  // =========================
  // Crear perfil de atleta
  // =========================
  const { error: athleteError } = await supabase
    .from("athlete_profiles")
    .insert({
      user_id: userId,
      birthdate: birthdate || null,
      gender: gender || null,
      category: category || null,
      bow_type: bow_type || "recurvo",
      dominant_hand: dominant_hand || null,
      notes: notes || null,
      photo_url,
      curp: curp || null,
      club_id: club_id || null,
      association_id: association_id || null,
      federation_id: federation_id || null,
    });

  if (athleteError) {
    throw new Error(athleteError.message);
  }

  revalidatePath("/athletes");
}
