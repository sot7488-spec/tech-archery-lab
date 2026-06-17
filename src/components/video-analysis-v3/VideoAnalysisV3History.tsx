import Link from "next/link";
import { ArrowRight, Camera, Medal } from "lucide-react";

type HistoryItem = {
  id: string;
  camera_view?: string | null;
  score?: number | null;
  phase?: string | null;
  created_at?: string | null;
  athlete_profiles?:
    | {
        users?: { name?: string | null } | Array<{ name?: string | null }> | null;
      }
    | Array<{
        users?: { name?: string | null } | Array<{ name?: string | null }> | null;
      }>
    | null;
};

function athleteName(item: HistoryItem) {
  const profile = Array.isArray(item.athlete_profiles)
    ? item.athlete_profiles[0]
    : item.athlete_profiles;
  const users = Array.isArray(profile?.users) ? profile?.users[0] : profile?.users;
  return users?.name || "Atleta";
}

export function VideoAnalysisV3History({ items }: { items: HistoryItem[] }) {
  return (
    <section className="rounded-[2rem] border border-cyan-300/15 bg-slate-900/80 p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)] md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Medal size={20} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Historial V3
          </p>
          <h2 className="text-2xl font-black">Analisis guardados</h2>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm font-bold text-slate-400">
          Aun no hay analisis V3 registrados.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/video-analysis-v3/${item.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-cyan-200">
                  <Camera size={18} />
                </span>
                <div>
                  <p className="text-base font-black text-white">{athleteName(item)}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    {item.camera_view || "vista"} / {item.phase || "anchor"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-2xl font-black text-cyan-200">
                  {item.score ?? 0}
                </span>
                <ArrowRight
                  size={18}
                  className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
