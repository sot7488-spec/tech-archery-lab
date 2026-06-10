"use client";

import { useState } from "react";
import { CopyPlus, Plus, Save, Trash2, X } from "lucide-react";
import { createTrainingTemplate } from "./actions";

type ClubOption = {
  id: string;
  name: string;
};

type Props = {
  clubs: ClubOption[];
  isAdmin: boolean;
  defaultClubId?: string;
};

type RoundDraft = {
  id: number;
  sessionType: string;
  distanceMeters: string;
  targetSizeCm: string;
  totalSeries: string;
  arrowsPerSeries: string;
  objective: string;
  scoringEnabled: boolean;
};

const inputClass =
  "h-11 w-full rounded-xl border border-cyan-400/10 bg-white/[0.04] px-3 text-xs font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

function getEmptyRound(id: number): RoundDraft {
  return {
    id,
    sessionType: "tecnico",
    distanceMeters: "",
    targetSizeCm: "",
    totalSeries: "",
    arrowsPerSeries: "6",
    objective: "",
    scoringEnabled: true,
  };
}

export default function TrainingTemplateCreateModal({
  clubs,
  isAdmin,
  defaultClubId = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [rounds, setRounds] = useState<RoundDraft[]>([getEmptyRound(1)]);

  function addRound() {
    setRounds((current) => [
      ...current,
      getEmptyRound(Math.max(...current.map((round) => round.id)) + 1),
    ]);
  }

  function updateRound(id: number, patch: Partial<Omit<RoundDraft, "id">>) {
    setRounds((current) =>
      current.map((round) =>
        round.id === id ? { ...round, ...patch } : round
      )
    );
  }

  function removeRound(id: number) {
    setRounds((current) =>
      current.length === 1 ? current : current.filter((round) => round.id !== id)
    );
  }

  async function handleCreate(formData: FormData) {
    await createTrainingTemplate(formData);
    setOpen(false);
    setRounds([getEmptyRound(1)]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-3 rounded-[1.4rem] border border-cyan-400/20 bg-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
      >
        <CopyPlus size={18} />
        Nueva plantilla
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-4 backdrop-blur-xl">
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950 text-white shadow-[0_0_90px_rgba(34,211,238,0.20)]">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
                  TAL Presets
                </p>
                <h2 className="mt-1 text-2xl font-black">Crear plantilla</h2>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              action={handleCreate}
              className="relative z-10 flex-1 space-y-4 overflow-y-auto px-5 py-4"
            >
              <section className="rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    name="name"
                    placeholder="Nombre de plantilla"
                    className={inputClass}
                    required
                  />

                  {isAdmin ? (
                    <select
                      name="club_id"
                      defaultValue={defaultClubId}
                      className={inputClass}
                      required
                    >
                      <option className="bg-slate-900 text-white" value="">
                        Selecciona club
                      </option>
                      {clubs.map((club) => (
                        <option
                          className="bg-slate-900 text-white"
                          key={club.id}
                          value={club.id}
                        >
                          {club.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type="hidden" name="club_id" value={defaultClubId} />
                  )}

                  <select name="session_type" className={inputClass} defaultValue="tecnico">
                    <option className="bg-slate-900 text-white" value="tecnico">
                      Tecnico
                    </option>
                    <option className="bg-slate-900 text-white" value="puntuacion">
                      Puntuacion
                    </option>
                    <option className="bg-slate-900 text-white" value="competencia">
                      Competencia
                    </option>
                    <option className="bg-slate-900 text-white" value="tuning">
                      Tuning
                    </option>
                    <option className="bg-slate-900 text-white" value="fisico">
                      Fisico
                    </option>
                  </select>

                  <input
                    name="location"
                    placeholder="Lugar sugerido"
                    className={inputClass}
                  />

                  <select name="weather" className={inputClass} defaultValue="interior">
                    <option className="bg-slate-900 text-white" value="interior">
                      Interior
                    </option>
                    <option className="bg-slate-900 text-white" value="soleado">
                      Soleado
                    </option>
                    <option className="bg-slate-900 text-white" value="nublado">
                      Nublado
                    </option>
                    <option className="bg-slate-900 text-white" value="viento">
                      Viento
                    </option>
                    <option className="bg-slate-900 text-white" value="otro">
                      Otro
                    </option>
                  </select>

                  <input
                    name="brace_height_cm"
                    type="number"
                    step="0.1"
                    placeholder="Brace height cm"
                    className={inputClass}
                  />

                  <input
                    name="wind_speed_kmh"
                    type="number"
                    placeholder="Viento km/h"
                    className={inputClass}
                  />

                  <input
                    name="temperature_c"
                    type="number"
                    placeholder="Temperatura C"
                    className={inputClass}
                  />

                  <input
                    name="objective"
                    placeholder="Objetivo base"
                    className={`${inputClass} md:col-span-2`}
                  />
                </div>

                <textarea
                  name="description"
                  placeholder="Descripcion de uso de la plantilla"
                  className={`${inputClass} mt-3 h-20 py-3`}
                />
              </section>

              <section className="rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-4">
                <input type="hidden" name="rounds_count" value={rounds.length} />

                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                    Rondas
                  </p>
                  <button
                    type="button"
                    onClick={addRound}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    <Plus size={15} />
                    Agregar ronda
                  </button>
                </div>

                <div className="space-y-3">
                  {rounds.map((round, index) => {
                    const roundNumber = index + 1;

                    return (
                      <div
                        key={round.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-white">
                            Ronda {roundNumber}
                          </p>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
                              <input
                                name={`round_scoring_enabled_${roundNumber}`}
                                type="checkbox"
                                checked={round.scoringEnabled}
                                onChange={(event) =>
                                  updateRound(round.id, {
                                    scoringEnabled: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 accent-cyan-300"
                              />
                              Score
                            </label>
                            <button
                              type="button"
                              onClick={() => removeRound(round.id)}
                              disabled={rounds.length === 1}
                              className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                          <select
                            name={`round_session_type_${roundNumber}`}
                            className={inputClass}
                            value={round.sessionType}
                            onChange={(event) =>
                              updateRound(round.id, {
                                sessionType: event.target.value,
                              })
                            }
                          >
                            <option className="bg-slate-900 text-white" value="tecnico">
                              Tecnico
                            </option>
                            <option className="bg-slate-900 text-white" value="puntuacion">
                              Puntuacion
                            </option>
                            <option className="bg-slate-900 text-white" value="competencia">
                              Competencia
                            </option>
                            <option className="bg-slate-900 text-white" value="tuning">
                              Tuning
                            </option>
                            <option className="bg-slate-900 text-white" value="fisico">
                              Fisico
                            </option>
                          </select>

                          <input
                            name={`round_distance_meters_${roundNumber}`}
                            type="number"
                            placeholder="Distancia m"
                            className={inputClass}
                            value={round.distanceMeters}
                            onChange={(event) =>
                              updateRound(round.id, {
                                distanceMeters: event.target.value,
                              })
                            }
                            required
                          />

                          <input
                            name={`round_target_size_cm_${roundNumber}`}
                            type="number"
                            placeholder="Diana cm"
                            className={inputClass}
                            value={round.targetSizeCm}
                            onChange={(event) =>
                              updateRound(round.id, {
                                targetSizeCm: event.target.value,
                              })
                            }
                            required
                          />

                          <input
                            name={`round_total_series_${roundNumber}`}
                            type="number"
                            placeholder="Series"
                            className={inputClass}
                            value={round.totalSeries}
                            onChange={(event) =>
                              updateRound(round.id, {
                                totalSeries: event.target.value,
                              })
                            }
                            required
                          />

                          <input
                            name={`round_arrows_per_series_${roundNumber}`}
                            type="number"
                            placeholder="Flechas/serie"
                            className={inputClass}
                            value={round.arrowsPerSeries}
                            onChange={(event) =>
                              updateRound(round.id, {
                                arrowsPerSeries: event.target.value,
                              })
                            }
                            required
                          />
                        </div>

                        <input
                          name={`round_objective_${roundNumber}`}
                          placeholder="Objetivo de la ronda"
                          className={`${inputClass} mt-3`}
                          value={round.objective}
                          onChange={(event) =>
                            updateRound(round.id, {
                              objective: event.target.value,
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-white/10 bg-slate-950/95 py-4 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  <Save size={16} />
                  Guardar plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
