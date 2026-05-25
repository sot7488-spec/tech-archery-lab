import Image from "next/image";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-cyan-400/10 bg-[#020617] p-6">
      <div className="mb-10">
        <Image
          src="/tal.png"
          alt="Tech Archery Lab"
          width={180}
          height={180}
          className="mx-auto drop-shadow-[0_0_20px_rgba(34,211,238,0.35)]"
        />

        <div className="mt-5 text-center">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Tech Archery Lab
          </h1>

          <p className="mt-2 text-xs font-black tracking-[0.35em] text-cyan-300">
            PERFORMANCE
          </p>
        </div>
      </div>

      <nav className="space-y-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 font-bold text-white transition hover:bg-cyan-400/20"
        >
          Dashboard
        </Link>

        <Link
          href="/athletes"
          className="flex items-center gap-3 rounded-2xl px-5 py-4 font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Atletas
        </Link>

        <Link
          href="/trainings"
          className="flex items-center gap-3 rounded-2xl px-5 py-4 font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Entrenamientos
        </Link>

        <Link
          href="/conade"
          className="flex items-center gap-3 rounded-2xl px-5 py-4 font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          CONADE
        </Link>
      </nav>

      <div className="mt-12 rounded-3xl border border-cyan-400/10 bg-gradient-to-br from-cyan-500/10 to-slate-900 p-5">
        <p className="text-sm font-black tracking-[0.2em] text-cyan-300">
          TECH ARCHERY LAB
        </p>

        <p className="mt-3 text-sm text-slate-400">
          Precisión · Análisis · Rendimiento
        </p>
      </div>
    </aside>
  );
}