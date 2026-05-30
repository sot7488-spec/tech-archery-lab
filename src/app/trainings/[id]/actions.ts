"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertCanMutateTraining(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trainingSessionId: string
) {
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
    throw new Error("No tienes permiso para modificar entrenamientos.");
  }

  const { data: training } = await supabase
    .from("training_sessions")
    .select("club_id")
    .eq("id", trainingSessionId)
    .single();

  if (
    currentUser.role === "coach" &&
    training?.club_id !== currentUser.club_id
  ) {
    throw new Error("Solo puedes modificar entrenamientos de tu club.");
  }
}

type SeriesActionState = {
  completed?: boolean;
  trainingSessionId?: string;
  error?: string;
};

function calculateGroupSizeCm(
  positions: Array<{ x: number | null; y: number | null }>,
  targetSizeCm: number
) {
  const validPositions = positions.filter(
    (position): position is { x: number; y: number } =>
      typeof position.x === "number" &&
      typeof position.y === "number" &&
      !Number.isNaN(position.x) &&
      !Number.isNaN(position.y)
  );

  if (validPositions.length < 2 || !targetSizeCm) return null;

  let maxDistancePercent = 0;

  for (let i = 0; i < validPositions.length; i += 1) {
    for (let j = i + 1; j < validPositions.length; j += 1) {
      const dx = validPositions[i].x - validPositions[j].x;
      const dy = validPositions[i].y - validPositions[j].y;
      maxDistancePercent = Math.max(
        maxDistancePercent,
        Math.sqrt(dx * dx + dy * dy)
      );
    }
  }

  return Number(((maxDistancePercent / 100) * targetSizeCm).toFixed(1));
}

export async function finishTraining(formData: FormData) {
  const supabase = await createClient();
  const training_session_id = String(formData.get("training_session_id"));

  await assertCanMutateTraining(supabase, training_session_id);

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

export async function updateTrainingCloseNotes(formData: FormData) {
  const supabase = await createClient();
  const training_session_id = String(formData.get("training_session_id"));
  const coach_notes = String(formData.get("coach_notes") || "");

  await assertCanMutateTraining(supabase, training_session_id);

  const { error } = await supabase
    .from("training_sessions")
    .update({ coach_notes })
    .eq("id", training_session_id);

  if (error) {
    console.error(error);
    throw new Error("Error guardando notas del entrenador");
  }

  revalidatePath(`/trainings/${training_session_id}`);
  revalidatePath("/trainings");
}

async function createSeriesWithArrowsInternal(formData: FormData) {
  const training_session_id = String(formData.get("training_session_id"));
  const supabase = await createClient();
  await assertCanMutateTraining(supabase, training_session_id);
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
  const arrowPositions = [1, 2, 3, 4, 5, 6].map((arrowNumber) => {
    const position_x = formData.get(`position_x_${arrowNumber}`);
    const position_y = formData.get(`position_y_${arrowNumber}`);

    return {
      x:
        position_x === null || position_x === ""
          ? null
          : Number(position_x),
      y:
        position_y === null || position_y === ""
          ? null
          : Number(position_y),
    };
  });

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
  const effectiveTargetSizeCm = Number(round.target_size_cm || target_size_cm);
  const group_size_cm = calculateGroupSizeCm(
    arrowPositions,
    effectiveTargetSizeCm
  );

  const { data: serie, error: seriesError } = await supabase
    .from("series")
    .insert({
      training_round_id: round.id,
      series_number: nextSeriesNumber,
      total_score,
      average_score,
      group_size_cm,
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

  const shouldComplete =
    Number(round.total_series || 0) > 0 &&
    nextSeriesNumber >= Number(round.total_series || 0);

  await supabase
    .from("training_sessions")
    .update({
      total_arrows: totalArrows,
      total_score: totalScore,
      average_score: average,
      ...(shouldComplete ? { status: "completed" } : {}),
    })
    .eq("id", training_session_id);

  revalidatePath(`/trainings/${training_session_id}`);
  revalidatePath("/trainings");

  return { completed: shouldComplete, trainingSessionId: training_session_id };
}

export async function createSeriesWithArrows(formData: FormData) {
  await createSeriesWithArrowsInternal(formData);
}

export async function createSeriesWithArrowsState(
  _previousState: SeriesActionState,
  formData: FormData
): Promise<SeriesActionState> {
  try {
    return await createSeriesWithArrowsInternal(formData);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la serie.",
    };
  }
}
