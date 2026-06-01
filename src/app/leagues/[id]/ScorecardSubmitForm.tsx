"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  LockKeyhole,
  ScanLine,
  Send,
  Upload,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getScorecardBubblePosition,
  getScoreFromOption,
  SCORECARD_OPTIONS,
  type ScorecardOption,
} from "../scorecardLayout";
import { submitIndoorLeagueScorecard } from "../actions";

type Props = {
  leagueId: string;
  roundId: string;
  arrowsCount: number;
};

export default function ScorecardSubmitForm({
  leagueId,
  roundId,
  arrowsCount,
}: Props) {
  const formId = useId();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scores, setScores] = useState<string[]>(
    Array.from({ length: arrowsCount }, () => "")
  );
  const [xMarks, setXMarks] = useState<boolean[]>(
    Array.from({ length: arrowsCount }, () => false)
  );
  const [scanStatus, setScanStatus] = useState(
    "Sube una foto o imagen escaneada de la hoja TAL para prellenar la tabla."
  );
  const ends = Math.ceil(arrowsCount / 3);

  function setArrowValue(index: number, option: ScorecardOption) {
    const parsed = getScoreFromOption(option);
    setScores((current) => {
      const next = [...current];
      next[index] = parsed.score;
      return next;
    });
    setXMarks((current) => {
      const next = [...current];
      next[index] = parsed.isX;
      return next;
    });
  }

  async function handleOfficialScan(file: File) {
    if (file.type === "application/pdf") {
      setScanStatus(
        "PDF recibido. Por ahora la deteccion automatica local funciona con imagenes JPG/PNG; guarda el PDF como imagen o toma foto de la hoja."
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setScanStatus("Sube una imagen JPG o PNG de la hoja oficial TAL.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        setScanStatus("No se pudo analizar la imagen en este navegador.");
        URL.revokeObjectURL(imageUrl);
        return;
      }

      context.drawImage(image, 0, 0);

      const detectedScores = Array.from({ length: arrowsCount }, () => "");
      const detectedX = Array.from({ length: arrowsCount }, () => false);
      let detectedCount = 0;

      for (let arrowIndex = 0; arrowIndex < arrowsCount; arrowIndex += 1) {
        let bestOption: ScorecardOption | null = null;
        let bestDarkness = 0;

        SCORECARD_OPTIONS.forEach((option, optionIndex) => {
          const position = getScorecardBubblePosition(arrowIndex + 1, optionIndex);
          const sample = sampleDarkness(
            context,
            (position.x / 100) * canvas.width,
            (position.y / 100) * canvas.height,
            Math.max(7, Math.round(canvas.width * 0.005))
          );

          if (sample > bestDarkness) {
            bestDarkness = sample;
            bestOption = option;
          }
        });

        if (bestOption && bestDarkness > 36) {
          const parsed = getScoreFromOption(bestOption);
          detectedScores[arrowIndex] = parsed.score;
          detectedX[arrowIndex] = parsed.isX;
          detectedCount += 1;
        }
      }

      setScores(detectedScores);
      setXMarks(detectedX);
      setScanStatus(
        detectedCount > 0
          ? `TAL detecto ${detectedCount} de ${arrowsCount} flechas. Revisa cada valor antes de confirmar.`
          : "No detecte marcas claras. Usa una foto recta, bien iluminada y con la hoja completa."
      );
      URL.revokeObjectURL(imageUrl);
    };

    image.onerror = () => {
      setScanStatus("No se pudo leer la imagen. Intenta con JPG o PNG.");
      URL.revokeObjectURL(imageUrl);
    };

    image.src = imageUrl;
  }

  return (
    <>
      <form id={formId} action={submitIndoorLeagueScorecard} className="space-y-4">
        <input type="hidden" name="league_id" value={leagueId} />
        <input type="hidden" name="round_id" value={roundId} />
        <input type="hidden" name="arrows_count" value={arrowsCount} />

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
            <div className="flex items-start gap-3">
              <span className="tal-metric-icon mb-0 h-10 w-10">
                <ScanLine size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-white">
                  Revision asistida por hoja oficial TAL
                </p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {scanStatus}
                </p>
              </div>
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950">
              <Upload size={16} />
              Subir hoja marcada
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleOfficialScan(file);
                }}
              />
            </label>
          </div>

          <Link
            href={`/leagues/${leagueId}/scorecard?round=${roundId}`}
            target="_blank"
            className="inline-flex min-h-28 items-center justify-center gap-2 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-5 py-3 text-sm font-black text-yellow-100 transition hover:bg-yellow-300 hover:text-slate-950"
          >
            <FileText size={17} />
            PDF imprimible
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-slate-950/80 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Serie</th>
                <th className="px-3 py-3 text-left">Flecha 1</th>
                <th className="px-3 py-3 text-left">Flecha 2</th>
                <th className="px-3 py-3 text-left">Flecha 3</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ends }, (_, endIndex) => (
                <tr key={endIndex} className="border-t border-white/10">
                  <td className="px-3 py-3 font-black text-cyan-300">
                    {endIndex + 1}
                  </td>
                  {[0, 1, 2].map((offset) => {
                    const arrowNumber = endIndex * 3 + offset + 1;
                    if (arrowNumber > arrowsCount) return <td key={offset} />;

                    return (
                      <td key={offset} className="px-3 py-3">
                        <div className="flex items-center gap-2">
                        <select
                          name={`score_${arrowNumber}`}
                          value={scores[arrowNumber - 1]}
                          onChange={(event) => {
                            const value = event.target.value;
                            setScores((current) => {
                              const next = [...current];
                              next[arrowNumber - 1] = value;
                              return next;
                            });
                            if (value !== "10") {
                              setXMarks((current) => {
                                const next = [...current];
                                next[arrowNumber - 1] = false;
                                return next;
                              });
                            }
                          }}
                          className="h-10 rounded-xl border border-cyan-400/10 bg-slate-950 px-3 text-sm font-black text-white outline-none"
                          required
                          >
                            <option className="bg-slate-900 text-white" value="">
                              -
                            </option>
                            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((score) => (
                              <option
                                className="bg-slate-900 text-white"
                                key={score}
                                value={score}
                              >
                                {score === 0 ? "M" : score}
                              </option>
                            ))}
                          </select>
                          <label className="inline-flex items-center gap-1 text-xs font-black text-yellow-300">
                          <input
                            name={`is_x_${arrowNumber}`}
                            type="checkbox"
                            checked={xMarks[arrowNumber - 1]}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setXMarks((current) => {
                                const next = [...current];
                                next[arrowNumber - 1] = checked;
                                return next;
                              });
                              if (checked) setArrowValue(arrowNumber - 1, "X");
                            }}
                            className="h-4 w-4 accent-cyan-400"
                          />
                            X
                          </label>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <input
          name="evidence_url"
          placeholder="URL de evidencia opcional"
          className="h-12 w-full rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600"
        />
        <input
          name="notes"
          placeholder="Notas opcionales"
          className="h-12 w-full rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600"
        />

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
        >
          <Send size={16} />
          Enviar scorecard
        </button>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="border border-cyan-400/20 bg-slate-950 p-0 text-white shadow-2xl shadow-cyan-950/40 sm:max-w-lg">
          <div className="rounded-xl bg-gradient-to-br from-cyan-400/10 via-slate-950 to-yellow-300/10 p-6">
            <DialogHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-300/30 bg-yellow-300/10 text-yellow-200">
                <AlertTriangle size={22} />
              </div>
              <DialogTitle className="text-2xl font-black text-white">
                Confirmar envio
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold text-slate-400">
                Revisa tu scorecard antes de enviarlo. Una vez registrado no podras
                volver a cargar esta jornada.
              </DialogDescription>
            </DialogHeader>

            <label className="mt-5 block text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Password de login
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4">
              <LockKeyhole size={18} className="text-cyan-300" />
              <input
                form={formId}
                type="password"
                name="password"
                placeholder="Confirma tu password"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600"
                required
              />
            </div>

            <DialogFooter className="mt-6 border-white/10 bg-white/[0.03]">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/10"
                >
                  <X size={15} />
                  Cancelar
                </button>
              </DialogClose>
              <button
                form={formId}
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                <LockKeyhole size={15} />
                Confirmar y enviar
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function sampleDarkness(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const x = Math.max(0, Math.round(centerX - radius));
  const y = Math.max(0, Math.round(centerY - radius));
  const size = radius * 2 + 1;
  const data = context.getImageData(x, y, size, size).data;
  let darkness = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += 4) {
    const average = (data[index] + data[index + 1] + data[index + 2]) / 3;
    darkness += 255 - average;
    count += 1;
  }

  return darkness / count;
}
