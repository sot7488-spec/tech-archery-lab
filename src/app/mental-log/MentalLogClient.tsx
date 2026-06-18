"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Brain,
  CheckCircle2,
  Dumbbell,
  Focus,
  HeartPulse,
  Sparkles,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { saveMentalTrainingLog } from "./actions";

type Training = {
  id: string;
  athlete_id: string;
  club_id: string | null;
  training_date: string;
  start_time: string | null;
  session_type: string | null;
  objective: string | null;
  athleteName: string;
  mentalLog?: MentalLog | null;
};

type MentalLog = {
  id: string;
  training_session_id: string;
  athlete_id: string;
  emotion_key: string;
  emotion_intensity: number;
  body_key: string;
  body_intensity: number;
  process_focus_score: number;
  emotional_control_score: number;
  error_recovery_score: number;
  mental_score: number;
  profile_label: string;
  sport_note: string | null;
  cue_word: string | null;
};

type WeekDay = {
  dateKey: string;
  label: string;
  shortLabel: string;
  dayNumber: number;
  trainings: Training[];
};

type Option = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: string;
};

const emotionOptions: Option[] = [
  { key: "confianza", label: "Confianza", icon: Sparkles, tone: "cyan" },
  { key: "tranquilidad", label: "Calma", icon: Brain, tone: "emerald" },
  { key: "motivacion", label: "Motivacion", icon: Target, tone: "yellow" },
  { key: "ansiedad", label: "Ansiedad", icon: HeartPulse, tone: "rose" },
  { key: "frustracion", label: "Frustracion", icon: X, tone: "rose" },
  { key: "miedo", label: "Miedo", icon: Activity, tone: "violet" },
];

const bodyOptions: Option[] = [
  { key: "respiracion", label: "Respiracion", icon: HeartPulse, tone: "cyan" },
  { key: "estabilidad", label: "Estabilidad", icon: Target, tone: "emerald" },
  { key: "energia", label: "Energia", icon: Sparkles, tone: "yellow" },
  { key: "tension", label: "Tension", icon: Dumbbell, tone: "rose" },
  { key: "temblor", label: "Temblor", icon: Activity, tone: "violet" },
  { key: "fatiga", label: "Fatiga", icon: Brain, tone: "rose" },
];

const scale = [1, 2, 3, 4, 5];

function scoreStyle(score?: number | null) {
  if (!score) {
    return {
      label: "Sin registro",
      className: "border-white/10 bg-slate-950/55 text-slate-400",
    };
  }

  if (score >= 85) {
    return {
      label: "Optimo",
      className: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
    };
  }

  if (score >= 70) {
    return {
      label: "Funcional",
      className: "border-cyan-300/25 bg-cyan-400/10 text-cyan-200",
    };
  }

  if (score >= 50) {
    return {
      label: "Atencion",
      className: "border-yellow-300/25 bg-yellow-400/10 text-yellow-200",
    };
  }

  return {
    label: "Reforzar",
    className: "border-rose-300/25 bg-rose-400/10 text-rose-200",
  };
}

function optionClass(tone: string, active: boolean) {
  const activeMap: Record<string, string> = {
    cyan: "border-cyan-300/40 bg-cyan-300 text-slate-950",
    emerald: "border-emerald-300/40 bg-emerald-300 text-slate-950",
    yellow: "border-yellow-200/40 bg-yellow-200 text-slate-950",
    rose: "border-rose-300/40 bg-rose-300 text-slate-950",
    violet: "border-violet-300/40 bg-violet-300 text-slate-950",
  };

  if (active) return activeMap[tone] || activeMap.cyan;
  return "border-white/10 bg-slate-950/45 text-slate-300 hover:border-cyan-300/30 hover:bg-white/[0.07]";
}

function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : "Sin hora";
}

export default function MentalLogClient({
  weekDays,
  schemaMissing,
}: {
  weekDays: WeekDay[];
  schemaMissing: boolean;
}) {
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [emotion, setEmotion] = useState("confianza");
  const [body, setBody] = useState("respiracion");
  const [emotionIntensity, setEmotionIntensity] = useState(3);
  const [bodyIntensity, setBodyIntensity] = useState(3);
  const [focusScore, setFocusScore] = useState(3);
  const [controlScore, setControlScore] = useState(3);
  const [recoveryScore, setRecoveryScore] = useState(3);

  const previewScore = useMemo(() => {
    const emotionPositive = ["confianza", "tranquilidad", "motivacion"].includes(
      emotion
    );
    const bodyPositive = ["respiracion", "estabilidad", "energia"].includes(body);
    const emotionScore = emotionPositive ? emotionIntensity : 6 - emotionIntensity;
    const bodyScore = bodyPositive ? bodyIntensity : 6 - bodyIntensity;
    const executionScore = (focusScore + controlScore + recoveryScore) / 3;
    return Math.round(
      (emotionScore / 5) * 30 +
        (bodyScore / 5) * 30 +
        (executionScore / 5) * 40
    );
  }, [body, bodyIntensity, controlScore, emotion, emotionIntensity, focusScore, recoveryScore]);

  function openTraining(training: Training) {
    const log = training.mentalLog;
    setSelectedTraining(training);
    setEmotion(log?.emotion_key || "confianza");
    setBody(log?.body_key || "respiracion");
    setEmotionIntensity(log?.emotion_intensity || 3);
    setBodyIntensity(log?.body_intensity || 3);
    setFocusScore(log?.process_focus_score || 3);
    setControlScore(log?.emotional_control_score || 3);
    setRecoveryScore(log?.error_recovery_score || 3);
  }

  const preview = scoreStyle(previewScore);

  return (
    <>
      {schemaMissing && (
        <div className="rounded-[1.5rem] border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold text-yellow-100">
          Ejecuta el SQL supabase/20260618_mental_training_logs.sql para guardar
          la bitacora mental.
        </div>
      )}

      <section className="space-y-3">
        {weekDays.map((day) => (
          <details
            key={day.dateKey}
            open={day.trainings.length > 0}
            className="group rounded-[1.8rem] border border-white/10 bg-slate-950/55"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-2xl font-black text-white">
                  {day.dayNumber}
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                    {day.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-400">
                    {day.shortLabel}
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-300">
                {day.trainings.length} sesiones
              </span>
            </summary>

            <div className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2 xl:grid-cols-3">
              {day.trainings.map((training) => {
                const status = scoreStyle(training.mentalLog?.mental_score);

                return (
                  <button
                    key={training.id}
                    type="button"
                    onClick={() => openTraining(training)}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                          {formatTime(training.start_time)}
                        </p>
                        <h3 className="mt-2 text-lg font-black text-white">
                          {training.athleteName}
                        </h3>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] ${status.className}`}
                      >
                        <CheckCircle2 size={13} />
                        {training.mentalLog?.mental_score || "--"}%
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-400">
                      {training.objective || "Sin objetivo"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-black text-slate-300">
                        {training.session_type || "tecnico"}
                      </span>
                      <span className={`rounded-xl border px-3 py-2 text-xs font-black ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </button>
                );
              })}

              {day.trainings.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-slate-500 md:col-span-2 xl:col-span-3">
                  Sin entrenamientos programados.
                </p>
              )}
            </div>
          </details>
        ))}
      </section>

      {selectedTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <form
            action={saveMentalTrainingLog}
            onSubmit={() => setSelectedTraining(null)}
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-cyan-300/20 bg-slate-950 p-5 shadow-[0_0_90px_rgba(34,211,238,0.18)]"
          >
            <input type="hidden" name="training_session_id" value={selectedTraining.id} />
            <input type="hidden" name="athlete_id" value={selectedTraining.athlete_id} />
            <input type="hidden" name="emotion_key" value={emotion} />
            <input type="hidden" name="body_key" value={body} />

            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                  Bitacora mental
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">
                  {selectedTraining.athleteName}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {selectedTraining.training_date} / {formatTime(selectedTraining.start_time)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTraining(null)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
              <div className="space-y-5">
                <Panel title="Emocion dominante" icon={Brain}>
                  <OptionGrid
                    options={emotionOptions}
                    value={emotion}
                    onChange={setEmotion}
                  />
                  <ScaleInput
                    name="emotion_intensity"
                    value={emotionIntensity}
                    setValue={setEmotionIntensity}
                  />
                </Panel>

                <Panel title="Cuerpo" icon={HeartPulse}>
                  <OptionGrid options={bodyOptions} value={body} onChange={setBody} />
                  <ScaleInput
                    name="body_intensity"
                    value={bodyIntensity}
                    setValue={setBodyIntensity}
                  />
                </Panel>

                <Panel title="Ejecucion mental" icon={Focus}>
                  <ScoreLine
                    name="process_focus_score"
                    label="Atencion al proceso"
                    value={focusScore}
                    setValue={setFocusScore}
                  />
                  <ScoreLine
                    name="emotional_control_score"
                    label="Control emocional"
                    value={controlScore}
                    setValue={setControlScore}
                  />
                  <ScoreLine
                    name="error_recovery_score"
                    label="Recuperacion de error"
                    value={recoveryScore}
                    setValue={setRecoveryScore}
                  />
                </Panel>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    name="cue_word"
                    placeholder="Cue mental util"
                    defaultValue={selectedTraining.mentalLog?.cue_word || ""}
                    className="tal-input"
                  />
                  <textarea
                    name="sport_note"
                    placeholder="Que te ayudo o que te afecto mentalmente hoy?"
                    defaultValue={selectedTraining.mentalLog?.sport_note || ""}
                    className="tal-input min-h-24 resize-none md:col-span-2"
                  />
                </div>
              </div>

              <aside className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                  Score mental
                </p>
                <div className={`mt-4 rounded-[1.5rem] border p-5 text-center ${preview.className}`}>
                  <p className="text-6xl font-black">{previewScore}%</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.18em]">
                    {preview.label}
                  </p>
                </div>
                <p className="mt-4 text-xs font-bold leading-5 text-slate-500">
                  Registro deportivo rapido. No sustituye una evaluacion
                  psicologica clinica.
                </p>
                <button
                  type="submit"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  <CheckCircle2 size={17} />
                  Guardar bitacora
                </button>
              </aside>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Icon size={18} />
        </span>
        <h3 className="text-lg font-black text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-black transition ${optionClass(option.tone, active)}`}
          >
            <Icon size={16} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ScaleInput({
  name,
  value,
  setValue,
}: {
  name: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <div className="mt-3 flex gap-2">
      <input type="hidden" name={name} value={value} />
      {scale.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setValue(item)}
          className={`h-10 flex-1 rounded-xl border text-sm font-black transition ${
            value === item
              ? "border-cyan-200 bg-cyan-300 text-slate-950"
              : "border-white/10 bg-slate-950/45 text-slate-400 hover:border-cyan-300/30"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function ScoreLine({
  name,
  label,
  value,
  setValue,
}: {
  name: string;
  label: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-200">{label}</p>
        <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-200">
          {value}/5
        </span>
      </div>
      <ScaleInput name={name} value={value} setValue={setValue} />
    </div>
  );
}
