import Image from "next/image";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard", icon: "⌁" },
  { href: "/athletes", label: "Atletas", icon: "◎" },
  { href: "/equipment", label: "Equipamiento", icon: "⚙" },
  { href: "/trainings", label: "Entrenamientos", icon: "↗" },
  { href: "/conade", label: "CONADE", icon: "★" },
];

export default function Sidebar() {
  return (
    <aside className="relative hidden min-h-screen w-72 overflow-hidden border-r border-cyan-400/10 bg-slate-950 p-5 text-white shadow-[20px_0_80px_rgba(0,0,0,0.35)] lg:block">
      <div className="absolute -top-24 left-8 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-20 right-[-120px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-8 rounded-[2rem] border border-cyan-400/15 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl">
          <Image
            src="/tal.png"
            alt="Tech Archery Lab"
            width={150}
            height={150}
            priority
            className="mx-auto drop-shadow-[0_0_28px_rgba(34,211,238,0.45)]"
          />

          <div className="mt-4 text-center">
            <h1 className="text-2xl font-black leading-tight tracking-tight">
              Tech Archery
              <span className="block tal-text-glow text-cyan-300">Lab</span>
            </h1>

            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.45em] text-cyan-300">
              Performance
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-4 font-bold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-lg font-black text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-slate-950">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-10 rounded-[2rem] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-5 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
            TAL System
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Precisión, análisis y rendimiento para atletas de tiro con arco.
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.7)]" />
          </div>
        </div>
      </div>
    </aside>
  );
}