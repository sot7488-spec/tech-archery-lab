"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function finishTraining(formData: FormData) {
  const training_session_id = String(formData.get("training_session_id"));

  const { error } = await supabase
    .from("training_sessions")
    .update({
      status: "completed",
    })
    .eq("id", training_session_id);

  if (error) {
    console.error(error);
    throw new Error("Error finalizando entrenamiento");
  }

  revalidatePath(`/trainings/${training_session_id}`);
  revalidatePath("/trainings");
}
export async function createSeriesWithArrows(formData: FormData) {


    
  const training_session_id = String(formData.get("training_session_id"));
  const distance_meters = Number(formData.get("distance_meters"));
  const target_size_cm = Number(formData.get("target_size_cm"));

  const arrowValues = [1, 2, 3, 4, 5, 6].map((n) => {
    const raw = String(formData.get(`arrow_${n}`) || "0")
      .trim()
      .toUpperCase();

    if (raw === "X") {
      return { score: 10, is_x: true };
    }

    if (raw === "M") {
      return { score: 0, is_x: false };
    }

    const score = Number(raw);

    if (Number.isNaN(score) || score < 1 || score > 10) {
      throw new Error("Cada flecha debe ser X, M o un número del 1 al 10");
    }

    return { score, is_x: false };
  });

  const total_score = arrowValues.reduce(
    (sum, arrow) => sum + arrow.score,
    0
  );

  const average_score = total_score / arrowValues.length;

  let { data: round } = await supabase
    .from("training_rounds")
    .select("*")
    .eq("training_session_id", training_session_id)
    .single();

  if (!round) {
    const { data: newRound, error: roundError } = await supabase
      .from("training_rounds")
      .insert({
        training_session_id,
        round_number: 1,
        distance_meters,
        target_size_cm,
        arrows_per_series: 6,
      })
      .select()
      .single();

    if (roundError) throw new Error("Error creando ronda");

    round = newRound;
  }

  const { data: existingSeries } = await supabase
    .from("series")
    .select("id")
    .eq("training_round_id", round.id);

  const nextSeriesNumber = (existingSeries?.length || 0) + 1;

  const { data: serie, error: seriesError } = await supabase
    .from("series")
    .insert({
      training_round_id: round.id,
      series_number: nextSeriesNumber,
      total_score,
      average_score,
    })
    .select()
    .single();

  if (seriesError) throw new Error("Error creando serie");

  const arrowsToInsert = arrowValues.map((arrow, index) => {
  const arrowNumber = index + 1;

  const position_x = formData.get(`position_x_${arrowNumber}`);
  const position_y = formData.get(`position_y_${arrowNumber}`);

  return {
    series_id: serie.id,
    arrow_number: arrowNumber,
    score: arrow.score,
    is_x: arrow.is_x,
    position_x:
      position_x === null || position_x === ""
        ? null
        : Number(position_x),
    position_y:
      position_y === null || position_y === ""
        ? null
        : Number(position_y),
  };
});

  const { error: arrowsError } = await supabase
    .from("arrows")
    .insert(arrowsToInsert);

  if (arrowsError) throw new Error("Error creando flechas");

  const { data: allSeries } = await supabase
    .from("series")
    .select(`
      id,
      arrows (
        score
      )
    `)
    .eq("training_round_id", round.id);

  const allArrows =
    allSeries?.flatMap((serie: any) => serie.arrows || []) || [];

  const totalArrows = allArrows.length;
  const totalScore = allArrows.reduce(
    (sum: number, arrow: any) => sum + Number(arrow.score),
    0
  );

  const average =
    totalArrows > 0 ? totalScore / totalArrows : 0;

  await supabase
    .from("training_sessions")
    .update({
      total_arrows: totalArrows,
      total_score: totalScore,
      average_score: average,
    })
    .eq("id", training_session_id);

  revalidatePath(`/trainings/${training_session_id}`);
  revalidatePath("/trainings");
}

