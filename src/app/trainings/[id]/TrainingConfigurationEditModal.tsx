"use client";

import { useState } from "react";
import { Settings2, Plus, Save, Trash2, X } from "lucide-react";
import { updateTrainingConfiguration } from "./actions";

type EquipmentOption = {
  id: string;
  name: string | null;
};

type RoundDraft = {
  localId: number;
  id: string;
  distanceMeters: string;
  targetSizeCm: string;
  totalSeries: string;
  arrowsPerSeries: string;
  sessionType: string;
  objective: string;
  scoringEnabled: boolean;
};

type RoutineDraft = {
  localId: number;
  id: string;
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

type TrainingConfig = {
  id: string;
  training_date: string;
  equipment_profile_id: string | null;
  brace_height_cm: number | string | null;
  location: string | null;
  session_type: string | null;
  weather: string | null;
  wind_speed_kmh: number | string | null;
  temperature_c: number | string | null;
  objective: string | null;
  coach_notes: string | null;
};

type Props = {
  training: TrainingConfig;
  rounds: any[];
  routines: any[];
  equipmentProfiles: EquipmentOption[];
};

const inputClass =
  "h-11 w-full rounded-xl border border-cyan-400/10 bg-white/[0.04] px-3 text-xs font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

const sectionClass =
  "rounded-2xl border border-cyan-400/10 bg-white/[0.035] p-3 backdrop-blur-xl";

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizeSessionType(value: unknown) {
  const text = asText(value);
  if (text === "tecnico") return "técnico";
  if (text === "puntuacion") return "puntuación";
  if (text === "fisico") return "físico";
  return text || "técnico";
}

function emptyRound(localId: number): RoundDraft {
  return {
    localId,
    id: "",
    distanceMeters: "",
    targetSizeCm: "",
    totalSeries: "",
    arrowsPerSeries: "6",
    sessionType: "técnico",
    objective: "",
    scoringEnabled: true,
  };
}

function emptyRoutine(localId: number): RoutineDraft {
  return {
    localId,
    id: "",
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
  };
}

export default function TrainingConfigurationEditModal({
  training,
  rounds,
  routines,
  equipmentProfiles,
}: Props) {
  const [open, setOpen] = useState(false);
  const [trainingDate, setTrainingDate] = useState(training.training_date || "");
  const [equipmentId, setEquipmentId] = useState(
    training.equipment_profile_id || ""
  );
  const [braceHeight, setBraceHeight] = useState(asText(training.brace_height_cm));
  const [location, setLocation] = useState(asText(training.location));
  const [sessionType, setSessionType] = useState(
    normalizeSessionType(training.session_type)
  );
  const [weather, setWeather] = useState(asText(training.weather) || "otro");
  const [windSpeed, setWindSpeed] = useState(asText(training.wind_speed_kmh));
  const [temperature, setTemperature] = useState(asText(training.temperature_c));
  const [objective, setObjective] = useState(asText(training.objective));
  const [coachNotes, setCoachNotes] = useState(asText(training.coach_notes));
  const [roundDrafts, setRoundDrafts] = useState<RoundDraft[]>(
    rounds.length
      ? rounds.map((round, index) => ({
          localId: index + 1,
          id: round.id || "",
          distanceMeters: asText(round.distance_meters),
          targetSizeCm: asText(round.target_size_cm),
          totalSeries: asText(round.total_series),
          arrowsPerSeries: asText(round.arrows_per_series) || "6",
          sessionType: normalizeSessionType(round.session_type),
          objective: asText(round.objective),
          scoringEnabled: round.scoring_enabled !== false,
        }))
      : [emptyRound(1)]
  );
  const [routineDrafts, setRoutineDrafts] = useState<RoutineDraft[]>(
    routines.map((routine, index) => ({
      localId: index + 1,
      id: routine.id || "",
      routineType: routine.routine_type === "spt" ? "spt" : "strength",
      title: asText(routine.title),
      focusArea: asText(routine.focus_area) || "escapula",
      objective: asText(routine.objective),
      durationMinutes: asText(routine.duration_minutes) || "20",
      intensity: asText(routine.intensity) || "media",
      exercises: asText(routine.exercises),
      sets: asText(routine.sets) || "3",
      reps: asText(routine.reps) || "10",
      load: asText(routine.load),
      restSeconds: asText(routine.rest_seconds) || "60",
      tempo: asText(routine.tempo),
      technicalCue: asText(routine.technical_cue),
      sptDrill: asText(routine.spt_drill),
      sptVolume: asText(routine.spt_volume),
      bowLoad: asText(routine.bow_load),
      holdSeconds: asText(routine.hold_seconds) || "10",
    }))
  );

  function updateRound(localId: number, patch: Partial<Omit<RoundDraft, "localId">>) {
    setRoundDrafts((current) =>
      current.map((round) =>
        round.localId === localId ? { ...round, ...patch } : round
      )
    );
  }

  function addRound() {
    setRoundDrafts((current) => [
      ...current,
      emptyRound(Math.max(...current.map((round) => round.localId)) + 1),
    ]);
  }

  function removeRound(localId: number) {
    setRoundDrafts((current) =>
      current.length === 1
        ? current
        : current.filter((round) => round.localId !== localId)
    );
  }

  function updateRoutine(
    localId: number,
    patch: Partial<Omit<RoutineDraft, "localId">>
  ) {
    setRoutineDrafts((current) =>
      current.map((routine) =>
        routine.localId === localId ? { ...routine, ...patch } : routine
      )
    );
  }

  function addRoutine() {
    setRoutineDrafts((current) => [
      ...current,
      emptyRoutine(
        current.length
          ? Math.max(...current.map((routine) => routine.localId)) + 1
          : 1
      ),
    ]);
  }

  function removeRoutine(localId: number) {
    setRoutineDrafts((current) =>
      current.filter((routine) => routine.localId !== localId)
    );
  }

  async function handleUpdate(formData: FormData) {
    await updateTrainingConfiguration(formData);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
      >
        <Settings2 size={17} />
        Configuracion
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-4 backdrop-blur-xl">
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950 text-white shadow-[0_0_90px_rgba(34,211,238,0.20)]">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
                  TAL Training Settings
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Editar configuracion
                </h2>
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
              action={handleUpdate}
              className="relative z-10 flex-1 space-y-4 overflow-y-auto px-5 py-4 pr-3 [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.65)_rgba(15,23,42,0.9)]"
            >
              <input
                type="hidden"
                name="training_session_id"
                value={training.id}
              />

              <section className={sectionClass}>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
                  Datos generales
                </p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    name="training_date"
                    type="date"
                    className={inputClass}
                    value={trainingDate}
                    onChange={(event) => setTrainingDate(event.target.value)}
                    required
                  />

                  <select
                    name="equipment_profile_id"
                    className={inputClass}
                    value={equipmentId}
                    onChange={(event) => setEquipmentId(event.target.value)}
                  >
                    <option className="bg-slate-900 text-white" value="">
                      Sin equipo
                    </option>
                    {equipmentProfiles.map((equipment) => (
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
                    name="brace_height_cm"
                    type="number"
                    step="0.1"
                    placeholder="Brace height cm"
                    className={inputClass}
                    value={braceHeight}
                    onChange={(event) => setBraceHeight(event.target.value)}
                  />

                  <input
                    name="location"
                    placeholder="Lugar"
                    className={inputClass}
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />

                  <select
                    name="session_type"
                    className={inputClass}
                    value={sessionType}
                    onChange={(event) => setSessionType(event.target.value)}
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

                  <select
                    name="weather"
                    className={inputClass}
                    value={weather}
                    onChange={(event) => setWeather(event.target.value)}
                  >
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
                    value={windSpeed}
                    onChange={(event) => setWindSpeed(event.target.value)}
                  />

                  <input
                    name="temperature_c"
                    type="number"
                    placeholder="Temperatura C"
                    className={inputClass}
                    value={temperature}
                    onChange={(event) => setTemperature(event.target.value)}
                  />

                  <input
                    name="objective"
                    placeholder="Objetivo del entrenamiento"
                    className={inputClass}
                    value={objective}
                    onChange={(event) => setObjective(event.target.value)}
                  />
                </div>

                <textarea
                  name="coach_notes"
                  placeholder="Notas del entrenador"
                  className={`${inputClass} mt-3 h-24 py-3`}
                  value={coachNotes}
                  onChange={(event) => setCoachNotes(event.target.value)}
                />
              </section>

              <section className={sectionClass}>
                <input
                  type="hidden"
                  name="rounds_count"
                  value={roundDrafts.length}
                />

                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
                    Rondas
                  </p>
                  <button
                    type="button"
                    onClick={addRound}
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    <Plus size={15} />
                    Agregar ronda
                  </button>
                </div>

                <div className="space-y-3">
                  {roundDrafts.map((round, index) => {
                    const roundNumber = index + 1;

                    return (
                      <div
                        key={round.localId}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 p-3"
                      >
                        <input
                          type="hidden"
                          name={`round_id_${roundNumber}`}
                          value={round.id}
                        />

                        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <p className="text-sm font-black text-white">
                            Ronda {roundNumber}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
                              <input
                                name={`round_scoring_enabled_${roundNumber}`}
                                type="checkbox"
                                checked={round.scoringEnabled}
                                onChange={(event) =>
                                  updateRound(round.localId, {
                                    scoringEnabled: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 accent-cyan-300"
                              />
                              Registrar puntos
                            </label>

                            <button
                              type="button"
                              onClick={() => removeRound(round.localId)}
                              disabled={roundDrafts.length === 1}
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
                              updateRound(round.localId, {
                                sessionType: event.target.value,
                              })
                            }
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
                              updateRound(round.localId, {
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
                              updateRound(round.localId, {
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
                              updateRound(round.localId, {
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
                              updateRound(round.localId, {
                                arrowsPerSeries: event.target.value,
                              })
                            }
                            required
                          />
                        </div>

                        <input
                          name={`round_objective_${roundNumber}`}
                          placeholder="Objetivo especifico de esta ronda"
                          className={`${inputClass} mt-3`}
                          value={round.objective}
                          onChange={(event) =>
                            updateRound(round.localId, {
                              objective: event.target.value,
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={sectionClass}>
                <input
                  type="hidden"
                  name="routines_count"
                  value={routineDrafts.length}
                />

                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
                    Rutinas
                  </p>
                  <button
                    type="button"
                    onClick={addRoutine}
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-400/20"
                  >
                    <Plus size={15} />
                    Agregar rutina
                  </button>
                </div>

                {routineDrafts.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-5 text-sm font-bold text-slate-500">
                    Sin rutinas programadas.
                  </div>
                )}

                <div className="space-y-3">
                  {routineDrafts.map((routine, index) => {
                    const routineNumber = index + 1;
                    const isSpt = routine.routineType === "spt";

                    return (
                      <div
                        key={routine.localId}
                        className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.045] p-3"
                      >
                        <input
                          type="hidden"
                          name={`routine_id_${routineNumber}`}
                          value={routine.id}
                        />

                        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <p className="text-sm font-black text-white">
                            Rutina {routineNumber}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeRoutine(routine.localId)}
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
                              updateRoutine(routine.localId, {
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
                            placeholder="Titulo"
                            className={inputClass}
                            value={routine.title}
                            onChange={(event) =>
                              updateRoutine(routine.localId, {
                                title: event.target.value,
                              })
                            }
                          />

                          <input
                            name={`routine_focus_area_${routineNumber}`}
                            placeholder="Enfoque"
                            className={inputClass}
                            value={routine.focusArea}
                            onChange={(event) =>
                              updateRoutine(routine.localId, {
                                focusArea: event.target.value,
                              })
                            }
                          />

                          <select
                            name={`routine_intensity_${routineNumber}`}
                            className={inputClass}
                            value={routine.intensity}
                            onChange={(event) =>
                              updateRoutine(routine.localId, {
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
                            updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                                updateRoutine(routine.localId, {
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
                              updateRoutine(routine.localId, {
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
                              updateRoutine(routine.localId, {
                                technicalCue: event.target.value,
                              })
                            }
                          />
                        </div>
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
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
