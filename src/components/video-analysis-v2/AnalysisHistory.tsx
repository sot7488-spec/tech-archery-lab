import Link from "next/link";
import { ArrowRight, Clock, Video } from "lucide-react";

type HistoryItem = {
  id: string;
  view_type: string | null;
  score: number | null;
  created_at: string;
  athlete_profiles?:
    | {
        users?: { name?: string | null } | { name?: string | null }[] | null;
      }
    | Array<{
        users?: { name?: string | null } | { name?: string | null }[] | null;
      }>
    | null;
};

function athleteName(item: HistoryItem) {
  const athleteProfile = Array.isArray(item.athlete_profiles)
    ? item.athlete_profiles[0]
    : item.athlete_profiles;
  const users = athleteProfile?.users;
  if (Array.isArray(users)) return users[0]?.name || "Atleta";
  return users?.name || "Atleta";
}

export function AnalysisHistory({ items }: { items: HistoryItem[] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Clock size={20} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Historial
          </p>
          <h2 className="text-2xl font-black text-white">Analisis recientes</h2>
        </div>
      </div>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/video-analysis-v2/${item.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-cyan-200">
                  <Video size={17} />
                </span>
                <div>
                  <p className="font-black text-white">{athleteName(item)}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {item.view_type || "toma"} /{" "}
                    {new Date(item.created_at).toLocaleDateString("es-MX")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-cyan-200">
                  {item.score ?? 0}
                </span>
                <ArrowRight size={17} className="text-slate-500" />
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-400">
            Aun no hay analisis guardados.
          </p>
        )}
      </div>
    </section>
  );
}
