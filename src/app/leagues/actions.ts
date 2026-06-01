"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function todayInMexico() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Perfil no encontrado.");
  return { supabase, user, profile };
}

export async function createIndoorLeague(formData: FormData) {
  const { supabase, user, profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("Solo admin puede crear ligas.");
  }

  const roundsCount = Number(formData.get("rounds_count") || 1);
  const roundDates = Array.from({ length: roundsCount }, (_, index) =>
    String(formData.get(`round_date_${index + 1}`) || "")
  );

  if (roundDates.some((date) => !date)) {
    throw new Error("Captura la fecha de todas las jornadas.");
  }

  const startDate = roundDates[0];
  const endDate = roundDates[roundDates.length - 1];

  const { data, error } = await supabase
    .from("indoor_leagues")
    .insert({
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      start_date: startDate,
      end_date: endDate,
      category: String(formData.get("category") || "iniciacion"),
      bow_type: String(formData.get("bow_type") || "recurvo"),
      gender: "mixta",
      distance_meters: 18,
      target_size_cm: Number(formData.get("target_size_cm") || 40),
      arrows_count: Number(formData.get("arrows_count") || 60),
      rounds_count: roundsCount,
      status: String(formData.get("status") || "open"),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const roundsPayload = roundDates.map((roundDate, index) => ({
    league_id: data.id,
    round_number: index + 1,
    round_date: roundDate,
  }));

  const { error: roundsError } = await supabase
    .from("indoor_league_rounds")
    .insert(roundsPayload);

  if (roundsError) throw new Error(roundsError.message);

  revalidatePath("/leagues");
  redirect(`/leagues/${data.id}`);
}

export async function updateIndoorLeague(formData: FormData) {
  const { supabase, profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("Solo admin puede editar ligas.");
  }

  const leagueId = String(formData.get("league_id") || "");
  const coachIds = formData.getAll("coach_ids").map(String).filter(Boolean);

  const { error } = await supabase
    .from("indoor_leagues")
    .update({
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      category: String(formData.get("category") || "iniciacion"),
      bow_type: String(formData.get("bow_type") || "recurvo"),
      target_size_cm: Number(formData.get("target_size_cm") || 40),
      arrows_count: Number(formData.get("arrows_count") || 60),
      status: String(formData.get("status") || "open"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", leagueId);

  if (error) throw new Error(error.message);

  const { error: rpcError } = await supabase.rpc("set_indoor_league_coaches", {
    p_league_id: leagueId,
    p_coach_ids: coachIds,
  });

  if (rpcError) throw new Error(rpcError.message);

  revalidatePath("/leagues");
  revalidatePath(`/leagues/${leagueId}`);
  revalidatePath(`/leagues/${leagueId}/edit`);
  redirect(`/leagues/${leagueId}`);
}

export async function joinIndoorLeague(formData: FormData) {
  const { supabase, user, profile } = await getSessionProfile();
  const leagueId = String(formData.get("league_id") || "");
  const clubId =
    profile.role === "coach"
      ? profile.club_id
      : String(formData.get("club_id") || profile.club_id || "");

  if (!leagueId || !clubId) throw new Error("Falta liga o club.");
  if (profile.role !== "admin" && profile.role !== "coach") {
    throw new Error("No tienes permiso para inscribir club.");
  }

  const { error } = await supabase.from("indoor_league_clubs").upsert(
    {
      league_id: leagueId,
      club_id: clubId,
      joined_by: user.id,
    },
    { onConflict: "league_id,club_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/leagues");
  revalidatePath(`/leagues/${leagueId}`);
}

export async function enrollIndoorLeagueAthlete(formData: FormData) {
  const { supabase, user, profile } = await getSessionProfile();
  const leagueId = String(formData.get("league_id") || "");
  const athleteId = String(formData.get("athlete_id") || "");

  if (profile.role !== "admin" && profile.role !== "coach") {
    throw new Error("No tienes permiso para inscribir atletas.");
  }

  if (profile.role === "coach") {
    const { data: invite } = await supabase
      .from("indoor_league_coaches")
      .select("id")
      .eq("league_id", leagueId)
      .eq("coach_id", user.id)
      .maybeSingle();

    if (!invite) throw new Error("No fuiste invitado a esta liga.");
  }

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("id, club_id")
    .eq("id", athleteId)
    .single();

  if (!athlete?.club_id) throw new Error("Atleta no encontrado.");

  if (profile.role === "coach" && athlete.club_id !== profile.club_id) {
    throw new Error("Solo puedes inscribir atletas de tu club.");
  }

  const { error } = await supabase.rpc("enroll_indoor_league_athletes", {
    p_league_id: leagueId,
    p_athlete_ids: [athlete.id],
  });

  if (error) throw new Error(error.message);

  revalidatePath("/leagues");
  revalidatePath(`/leagues/${leagueId}`);
}

export async function enrollIndoorLeagueClub(formData: FormData) {
  const { supabase, user, profile } = await getSessionProfile();
  const leagueId = String(formData.get("league_id") || "");

  if (profile.role !== "coach" || !profile.club_id) {
    throw new Error("Solo coaches con club pueden inscribir todo su club.");
  }

  const { data: invite } = await supabase
    .from("indoor_league_coaches")
    .select("id")
    .eq("league_id", leagueId)
    .eq("coach_id", user.id)
    .maybeSingle();

  if (!invite) throw new Error("No fuiste invitado a esta liga.");

  const { data: athletes } = await supabase
    .from("athlete_profiles")
    .select("id, club_id")
    .eq("club_id", profile.club_id);

  const athleteIds = athletes?.map((athlete) => athlete.id) || [];

  if (athleteIds.length === 0) throw new Error("No hay atletas en tu club.");

  const { error } = await supabase.rpc("enroll_indoor_league_athletes", {
    p_league_id: leagueId,
    p_athlete_ids: athleteIds,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/leagues");
  revalidatePath(`/leagues/${leagueId}`);
}

export async function submitIndoorLeagueScorecard(formData: FormData) {
  const { supabase, user, profile } = await getSessionProfile();

  if (profile.role !== "athlete") {
    throw new Error("Solo el atleta puede cargar su scorecard.");
  }

  const leagueId = String(formData.get("league_id") || "");
  const roundId = String(formData.get("round_id") || "");
  const arrowsCount = Number(formData.get("arrows_count") || 60);
  const password = String(formData.get("password") || "");

  if (!user.email) {
    throw new Error("No se pudo validar el correo de tu cuenta.");
  }

  if (!password) {
    throw new Error("Confirma tu password para enviar el scorecard.");
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (passwordError) {
    throw new Error("El password no es correcto.");
  }

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("id, club_id")
    .eq("user_id", user.id)
    .single();

  if (!athlete?.id || !athlete.club_id) {
    throw new Error("Completa tu perfil de atleta antes de competir.");
  }

  const { data: enrollment } = await supabase
    .from("indoor_league_athletes")
    .select("id")
    .eq("league_id", leagueId)
    .eq("athlete_id", athlete.id)
    .maybeSingle();

  if (!enrollment) {
    throw new Error("No estas inscrito en esta liga.");
  }

  const { data: round } = await supabase
    .from("indoor_league_rounds")
    .select("id, round_date, league_id")
    .eq("id", roundId)
    .eq("league_id", leagueId)
    .single();

  if (!round) throw new Error("Jornada no encontrada.");

  if (round.round_date !== todayInMexico()) {
    throw new Error("Solo puedes cargar puntuaciones el dia de la jornada.");
  }

  const { data: league } = await supabase
    .from("indoor_leagues")
    .select("status, arrows_count")
    .eq("id", leagueId)
    .single();

  if (league?.status !== "open") {
    throw new Error("La liga no esta abierta para capturas.");
  }

  const scores = Array.from({ length: arrowsCount }, (_, index) => {
    const arrowNumber = index + 1;
    const score = Number(formData.get(`score_${arrowNumber}`));
    const isX = formData.get(`is_x_${arrowNumber}`) === "on";
    return { arrowNumber, score, isX };
  });

  if (scores.some((arrow) => Number.isNaN(arrow.score) || arrow.score < 0 || arrow.score > 10)) {
    throw new Error("Cada flecha debe tener puntuacion entre 0 y 10.");
  }

  const totalScore = scores.reduce((sum, arrow) => sum + arrow.score, 0);
  const xCount = scores.filter((arrow) => arrow.isX).length;
  const tensCount = scores.filter((arrow) => arrow.score === 10).length;

  const { data: existingResult } = await supabase
    .from("indoor_league_results")
    .select("id")
    .eq("round_id", roundId)
    .eq("athlete_id", athlete.id)
    .maybeSingle();

  if (existingResult?.id) {
    throw new Error("Ya cargaste puntuacion para esta jornada.");
  }

  const { data: result, error } = await supabase
    .from("indoor_league_results")
    .insert({
      league_id: leagueId,
      round_id: roundId,
      club_id: athlete.club_id,
      athlete_id: athlete.id,
      submitted_by: user.id,
      total_score: totalScore,
      x_count: xCount,
      tens_count: tensCount,
      evidence_url: String(formData.get("evidence_url") || ""),
      notes: String(formData.get("notes") || ""),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const arrowsPayload = scores.map((arrow) => ({
    result_id: result.id,
    arrow_number: arrow.arrowNumber,
    score: arrow.score,
    is_x: arrow.isX,
  }));

  const { error: arrowsError } = await supabase
    .from("indoor_league_result_arrows")
    .insert(arrowsPayload);

  if (arrowsError) throw new Error(arrowsError.message);

  revalidatePath("/leagues");
  revalidatePath(`/leagues/${leagueId}`);
}

export async function validateIndoorLeagueResult(formData: FormData) {
  const { supabase, user, profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("Solo admin puede validar resultados.");
  }

  const leagueId = String(formData.get("league_id") || "");
  const resultId = String(formData.get("result_id") || "");
  const status = String(formData.get("status") || "validated");

  const { error } = await supabase
    .from("indoor_league_results")
    .update({
      status,
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    })
    .eq("id", resultId);

  if (error) throw new Error(error.message);

  revalidatePath(`/leagues/${leagueId}`);
}

export async function closeIndoorLeague(formData: FormData) {
  const { supabase, profile } = await getSessionProfile();

  if (profile.role !== "admin") {
    throw new Error("Solo admin puede terminar ligas.");
  }

  const leagueId = String(formData.get("league_id") || "");

  const { error } = await supabase
    .from("indoor_leagues")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", leagueId);

  if (error) throw new Error(error.message);

  revalidatePath("/leagues");
  revalidatePath(`/leagues/${leagueId}`);
}
