"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTrainingTemplate } from "./actions";

type Props = {
  templateId: string;
};

export default function TrainingTemplateDeleteButton({ templateId }: Props) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm("Eliminar esta plantilla de entrenamiento?");
    if (!confirmed) return;

    const formData = new FormData();
    formData.set("template_id", templateId);

    startTransition(async () => {
      await deleteTrainingTemplate(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 size={15} />
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
