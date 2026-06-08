"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTraining } from "./actions";

type Props = {
  trainingId: string;
  redirectTo?: string;
};

export default function TrainingDeleteButton({
  trainingId,
  redirectTo = "/trainings",
}: Props) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "¿Eliminar este entrenamiento? Se borraran sus rondas, series y flechas registradas."
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.set("training_id", trainingId);
    formData.set("redirect_to", redirectTo);

    startTransition(async () => {
      await deleteTraining(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex w-fit items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 size={16} />
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
