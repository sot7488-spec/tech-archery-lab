"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CloudSun,
  Crosshair,
  Dumbbell,
  Plus,
  Ruler,
  Save,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { createTraining } from "./actions";

type AthleteOption = {
  id: string;
  users?: { name?: string | null } | { name?: string | null }[] | null;
};

type EquipmentOption = {
  id: string;
  name: string | null;
  athlete_id: string;
};

type Props = {
  athletes: AthleteOption[];
  equipmentProfiles: EquipmentOption[];
  selectedAthleteId?: string;
};

type TrainingRoundDraft = {
  id: number;
  distanceMeters: string;
  targetSizeCm: string;
  totalSeries: string;
  arrowsPerSeries: string;
  sessionType: string;
  objective: string;
  scoringEnabled: boolean;
};

type TrainingRoutineDraft = {
  id: number;
  routineType: "strength" | "spt";
  title: string;
  focusArea: string;
  objective: string;
  durationMinutes: string;
  intensity: string;
  exercises: string;
  sets: string;
  reps: string;
  load: string;
  restSeconds: string;
  tempo: string;
  technicalCue: string;
  sptDrill: string;
  sptVolume: string;
  bowLoad: string;
  holdSeconds: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-cyan-400/10 bg-white/[0.04] px-3 text-xs font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

const sectionClass =
  "rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-3 backdrop-blur-xl";

const sectionTitleClass =
  "mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300";

function getAthleteName(athlete: AthleteOption) {
  if (Array.isArray(athlete.users)) {
    return athlete.users[0]?.name || "Atleta sin nombre";
  }

  return athlete.users?.name || "Atleta sin nombre";
}

export default function TrainingCreateModal({
  athletes,
  equipmentProfiles,
  selectedAthleteId = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(selectedAthleteId);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [rounds, setRounds] = useState<TrainingRoundDraft[]>([
    {
      id: 1,
      distanceMeters: "",
      targetSizeCm: "",
      totalSeries: "",
      arrowsPerSeries: "6",
      sessionType: "técnico",
      objective: "",
      scoringEnabled: true,
    },
  ]);
  const [routines, setRoutines] = useState<TrainingRoutineDraft[]>([]);

  function updateRound(
    id: number,
    patch: Partial<Omit<TrainingRoundDraft, "id">>
  ) {
    setRounds((current) =>
      current.map((round) =>
        round.id === id ? { ...round, ...patch } : round
      )
    );
  }

  function addRound() {
    setRounds((current) => [
      ...current,
      {
        id: Math.max(...current.map((round) => round.id)) + 1,
        distanceMeters: "",
        targetSizeCm: "",
        totalSeries: "",
        arrowsPerSeries: "6",
        sessionType: "técnico",
        objective: "",
        scoringEnabled: true,
      },
    ]);
  }

  function removeRound(id: number) {
    setRounds((current) =>
      current.length === 1 ? current : current.filter((round) => round.id !== id)
    );
  }

  function addRoutine() {
    setRoutines((current) => [
      ...current,
      {
        id: current.length
          ? Math.max(...current.map((routine) => routine.id)) + 1
          : 1,
        routineType: "strength",
        title: "",
        focusArea: "escapula",
        objective: "",
        durationMinutes: "20",
        intensity: "media",
        exercises: "",
        sets: "3",
        reps: "10",
        load: "",
        restSeconds: "60",
        tempo: "",
        technicalCue: "",
        sptDrill: "",
        sptVolume: "",
        bowLoad: "",
        holdSeconds: "10",
      },
    ]);
  }

  function updateRoutine(
    id: number,
    patch: Partial<Omit<TrainingRoutineDraft, "id">>
  ) {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === id ? { ...routine, ...patch } : routine
      )
    );
  }

  function removeRoutine(id: number) {
    setRoutines((current) => current.filter((routine) => routine.id !== id));
  }

  const filteredEquipment = useMemo(
    () =>
      selectedAthlete
        ? equipmentProfiles.filter(
            (equipment) => equipment.athlete_id === selectedAthlete
          )
        : [],
    [equipmentProfiles, selectedAthlete]
  );

  async function handleCreateTraining(formData: FormData) {
    await createTraining(formData);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-[1.4rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 via-slate-900 to-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-400/20 hover:shadow-[0_0_45px_rgba(34,211,238,0.28)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_55%)] opacity-0 transition duration-300 group-hover:opacity-100" />

        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300 transition duration-300 group-hover:bg-cyan-300 group-hover:text-slate-950">
          <Plus size={18} />
        </div>

        <div className="relative text-left">
          <p className="text-[10px] font-black tracking-[0.35em] text-cyan-300">
            TAL SESSION
          </p>
          <p className="mt-0.5 text-sm font-black text-white">Nueva sesión</p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-4 backdrop-blur-xl">
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950 text-white shadow-[0_0_90px_rgba(34,211,238,0.20)]">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-80px] left-[-80px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Activity size={22} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
                    TAL Training Registry
                  </p>

                  <h2 className="mt-0.5 text-2xl font-black text-white">
                    Registrar entrenamiento
                  </h2>
                </div>
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
              action={handleCreateTraining}
              className="
                relative z-10 flex-1 space-y-3 overflow-y-auto px-5 py-4 pr-3
                [scrollbar-width:thin]
                [scrollbar-color:rgba(34,211,238,0.65)_rgba(15,23,42,0.9)]
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-slate-900
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-cyan-400/60
                [&::-webkit-scrollbar-thumb:hover]:bg-cyan-300
              "
            >
              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Target size={14} />
                  Datos principales
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <select
                    name="athlete_id"
                    className={inputClass}
                    required
                    value={selectedAthlete}
                    onChange={(event) => {
                      setSelectedAthlete(event.target.value);
                      setSelectedEquipment("");
                    }}
                  >
                    <option className="bg-slate-900 text-white" value="" disabled>
                      Selecciona atleta
                    </option>

                    {athletes.map((athlete) => (
                      <option
                        className="bg-slate-900 text-white"
                        key={athlete.id}
                        value={athlete.id}
                      >
                        {getAthleteName(athlete)}
                      </option>
                    ))}
                  </select>

                  <select
                    name="equipment_profile_id"
                    className={inputClass}
                    value={selectedEquipment}
                    onChange={(event) => setSelectedEquipment(event.target.value)}
                    disabled={!selectedAthlete}
                  >
                    <option className="bg-slate-900 text-white" value="">
                      {selectedAthlete
                        ? "Equipamiento utilizado"
                        : "Selecciona atleta primero"}
                    </option>

                    {filteredEquipment.map((equipment) => (
                      <option
                        className="bg-slate-900 text-white"
                        key={equipment.id}
                        value={equipment.id}
                      >
                        {equipment.name || "Equipo sin nombre"}
                      </option>
                    ))}
                  </select>

                  <input
                    name="training_date"
                    type="date"
                    className={inputClass}
                    required
                  />
                </div>
              </section>

              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Ruler size={14} />
                  Rondas y rutinas programadas
                </div>

                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <input
                    name="brace_height_cm"
                    type="number"
                    step="0.1"
                    placeholder="Brace height cm"
                    className={inputClass}
                  />
                </div>

                <input type="hidden" name="rounds_count" value={rounds.length} />
                <input type="hidden" name="routines_count" value={routines.length} />

                <div className="space-y-3">
                  {rounds.map((round, index) => {
                    const roundNumber = index + 1;

                    return (
                      <div
                        key={round.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 p-3"
                      >
                        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-300">
                              Ronda {roundNumber}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-400">
                              Distancia, series, flechas y modo de registro.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
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
                              Registrar puntos
                            </label>

                            <button
                              type="button"
                              onClick={() => removeRound(round.id)}
                              disabled={rounds.length === 1}
                              className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                              title="Eliminar ronda"
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
                            required
                          >
                            <option className="bg-slate-900 text-white" value="técnico">
                              Técnico
                            </option>
                            <option className="bg-slate-900 text-white" value="puntuación">
                              Puntuación
                            </option>
                            <option className="bg-slate-900 text-white" value="competencia">
                              Competencia
                            </option>
                            <option className="bg-slate-900 text-white" value="tuning">
                              Tuning
                            </option>
                            <option className="bg-slate-900 text-white" value="físico">
                              Físico
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
                            min={1}
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
                            min={1}
                            max={12}
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
                          placeholder="Objetivo específico de esta ronda"
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

                {routines.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {routines.map((routine, index) => {
                      const routineNumber = index + 1;
                      const isSpt = routine.routineType === "spt";

                      return (
                        <div
                          key={routine.id}
                          className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.045] p-3"
                        >
                          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-300">
                                Rutina {routineNumber}
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-400">
                                Fuerza o SPT dentro de esta sesion.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeRoutine(routine.id)}
                              className="w-fit rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500 hover:text-white"
                              title="Eliminar rutina"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <select
                              name={`routine_type_${routineNumber}`}
                              className={inputClass}
                              value={routine.routineType}
                              onChange={(event) =>
                                updateRoutine(routine.id, {
                                  routineType: event.target.value as "strength" | "spt",
                                })
                              }
                            >
                              <option className="bg-slate-900 text-white" value="strength">
                                Fuerza
                              </option>
                              <option className="bg-slate-900 text-white" value="spt">
                                SPT
                              </option>
                            </select>

                            <input
                              name={`routine_title_${routineNumber}`}
                              placeholder={isSpt ? "Titulo SPT" : "Titulo fuerza"}
                              className={inputClass}
                              value={routine.title}
                              onChange={(event) =>
                                updateRoutine(routine.id, { title: event.target.value })
                              }
                            />

                            <select
                              name={`routine_focus_area_${routineNumber}`}
                              className={inputClass}
                              value={routine.focusArea}
                              onChange={(event) =>
                                updateRoutine(routine.id, {
                                  focusArea: event.target.value,
                                })
                              }
                            >
                              <option className="bg-slate-900 text-white" value="escapula">
                                Escapula
                              </option>
                              <option className="bg-slate-900 text-white" value="core">
                                Core
                              </option>
                              <option className="bg-slate-900 text-white" value="hombro">
                                Hombro
                              </option>
                              <option className="bg-slate-900 text-white" value="postura">
                                Postura
                              </option>
                              <option className="bg-slate-900 text-white" value="resistencia">
                                Resistencia
                              </option>
                            </select>

                            <select
                              name={`routine_intensity_${routineNumber}`}
                              className={inputClass}
                              value={routine.intensity}
                              onChange={(event) =>
                                updateRoutine(routine.id, {
                                  intensity: event.target.value,
                                })
                              }
                            >
                              <option className="bg-slate-900 text-white" value="baja">
                                Baja
                              </option>
                              <option className="bg-slate-900 text-white" value="media">
                                Media
                              </option>
                              <option className="bg-slate-900 text-white" value="alta">
                                Alta
                              </option>
                            </select>
                          </div>

                          <input
                            name={`routine_objective_${routineNumber}`}
                            placeholder="Objetivo de la rutina"
                            className={`${inputClass} mt-3`}
                            value={routine.objective}
                            onChange={(event) =>
                              updateRoutine(routine.id, {
                                objective: event.target.value,
                              })
                            }
                          />

                          {isSpt ? (
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                              <input
                                name={`routine_spt_drill_${routineNumber}`}
                                placeholder="Drill SPT"
                                className={inputClass}
                                value={routine.sptDrill}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    sptDrill: event.target.value,
                                  })
                                }
                              />
                              <input
                                name={`routine_spt_volume_${routineNumber}`}
                                placeholder="Volumen"
                                className={inputClass}
                                value={routine.sptVolume}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    sptVolume: event.target.value,
                                  })
                                }
                              />
                              <input
                                name={`routine_bow_load_${routineNumber}`}
                                placeholder="Carga/arco"
                                className={inputClass}
                                value={routine.bowLoad}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    bowLoad: event.target.value,
                                  })
                                }
                              />
                              <input
                                name={`routine_hold_seconds_${routineNumber}`}
                                type="number"
                                placeholder="Hold seg."
                                className={inputClass}
                                value={routine.holdSeconds}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    holdSeconds: event.target.value,
                                  })
                                }
                              />
                              <input
                                name={`routine_duration_minutes_${routineNumber}`}
                                type="number"
                                placeholder="Minutos"
                                className={inputClass}
                                value={routine.durationMinutes}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    durationMinutes: event.target.value,
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6">
                              <input
                                name={`routine_exercises_${routineNumber}`}
                                placeholder="Ejercicios"
                                className={`${inputClass} md:col-span-2`}
                                value={routine.exercises}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    exercises: event.target.value,
                                  })
                                }
                              />
                              <input
                                name={`routine_sets_${routineNumber}`}
                                placeholder="Series"
                                className={inputClass}
                                value={routine.sets}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    sets: event.target.value,
                                  })
                                }
                              />
                              <input
                                name={`routine_reps_${routineNumber}`}
                                placeholder="Reps/tiempo"
                                className={inputClass}
                                value={routine.reps}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    reps: event.target.value,
                                  })
                                }
                              />
                              <input
                                name={`routine_load_${routineNumber}`}
                                placeholder="Carga"
                                className={inputClass}
                                value={routine.load}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    load: event.target.value,
                                  })
                                }
                              />
                              <input
                                name={`routine_rest_seconds_${routineNumber}`}
                                type="number"
                                placeholder="Descanso s"
                                className={inputClass}
                                value={routine.restSeconds}
                                onChange={(event) =>
                                  updateRoutine(routine.id, {
                                    restSeconds: event.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input
                              name={`routine_tempo_${routineNumber}`}
                              placeholder="Tempo / ritmo"
                              className={inputClass}
                              value={routine.tempo}
                              onChange={(event) =>
                                updateRoutine(routine.id, {
                                  tempo: event.target.value,
                                })
                              }
                            />
                            <input
                              name={`routine_technical_cue_${routineNumber}`}
                              placeholder="Cue tecnico"
                              className={inputClass}
                              value={routine.technicalCue}
                              onChange={(event) =>
                                updateRoutine(routine.id, {
                                  technicalCue: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={addRound}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    <Plus size={15} />
                    Agregar ronda
                  </button>

                  <button
                    type="button"
                    onClick={addRoutine}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-400/20"
                  >
                    <Dumbbell size={15} />
                    Agregar rutina
                  </button>
                </div>
              </section>

              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <CloudSun size={14} />
                  Contexto de entrenamiento
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input name="location" placeholder="Lugar" className={inputClass} />

                  <select name="session_type" className={inputClass} defaultValue="técnico">
                    <option className="bg-slate-900 text-white" value="técnico">
                      Técnico
                    </option>
                    <option className="bg-slate-900 text-white" value="puntuación">
                      Puntuación
                    </option>
                    <option className="bg-slate-900 text-white" value="competencia">
                      Competencia
                    </option>
                    <option className="bg-slate-900 text-white" value="tuning">
                      Tuning
                    </option>
                    <option className="bg-slate-900 text-white" value="físico">
                      Físico
                    </option>
                  </select>

                  <select name="weather" className={inputClass} defaultValue="soleado">
                    <option className="bg-slate-900 text-white" value="soleado">
                      Soleado
                    </option>
                    <option className="bg-slate-900 text-white" value="nublado">
                      Nublado
                    </option>
                    <option className="bg-slate-900 text-white" value="lluvia">
                      Lluvia
                    </option>
                    <option className="bg-slate-900 text-white" value="viento">
                      Viento
                    </option>
                    <option className="bg-slate-900 text-white" value="interior">
                      Interior
                    </option>
                    <option className="bg-slate-900 text-white" value="otro">
                      Otro
                    </option>
                  </select>

                  <input
                    name="wind_speed_kmh"
                    type="number"
                    placeholder="Viento km/h"
                    className={inputClass}
                  />

                  <input
                    name="temperature_c"
                    type="number"
                    placeholder="Temperatura °C"
                    className={inputClass}
                  />

                  <input
                    name="objective"
                    placeholder="Objetivo del entrenamiento"
                    className={inputClass}
                  />
                </div>
              </section>

              <section className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Crosshair size={14} />
                  Notas
                </div>

                <textarea
                  name="coach_notes"
                  placeholder="Notas del entrenador"
                  className={`${inputClass} h-24 py-3`}
                  rows={3}
                />
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
                  Crear entrenamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
