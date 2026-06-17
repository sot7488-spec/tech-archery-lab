"use client";

import { BookOpen, Wind } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Technique = {
  id: string;
  name: string;
  category: string;
  description: string;
  instructions: string;
  evidence_note?: string | null;
  duration_minutes?: number | null;
};

export function TechniqueLibraryModal({
  techniques,
}: {
  techniques: Technique[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="tal-chart-card flex w-full items-center justify-between gap-4 text-left transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
        >
          <span className="flex items-center gap-3">
            <span className="tal-metric-icon mb-0">
              <Wind size={20} />
            </span>
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Biblioteca
              </span>
              <span className="mt-1 block text-2xl font-black text-white">
                Tecnicas basicas
              </span>
            </span>
          </span>
          <span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
            Ver {techniques.length}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[86vh] overflow-hidden border border-cyan-400/20 bg-slate-950 p-0 text-white shadow-2xl shadow-cyan-950/40 sm:max-w-4xl">
        <div className="border-b border-white/10 bg-white/[0.03] p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="tal-metric-icon mb-0">
                <BookOpen size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  TAL Mental Performance
                </p>
                <DialogTitle className="mt-1 text-3xl font-black text-white">
                  Biblioteca de tecnicas basicas
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-sm font-bold leading-6 text-slate-400">
              Tecnicas deportivas para respiracion, foco, rutina pre-tiro,
              recuperacion despues de error y preparacion competitiva.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-6">
          <div className="grid gap-3 md:grid-cols-2">
            {techniques.map((technique) => (
              <article
                key={technique.id}
                className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  {technique.category} - {technique.duration_minutes || 3} min
                </p>
                <h3 className="mt-1 text-lg font-black text-white">
                  {technique.name}
                </h3>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                  {technique.description}
                </p>
                <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold leading-6 text-slate-300">
                  {technique.instructions}
                </p>
                {technique.evidence_note && (
                  <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
                    {technique.evidence_note}
                  </p>
                )}
              </article>
            ))}
          </div>

          {techniques.length === 0 && (
            <p className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-100">
              Corre el SQL supabase/20260617_sports_psychology_role.sql para
              cargar la biblioteca.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
