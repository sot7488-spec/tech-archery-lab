import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-72 flex-col border-r border-white/10 bg-[#030712] p-5">
          <div className="mb-8">
            <div className="text-2xl font-black tracking-tight">
              Tech Archery Lab
            </div>
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-400 mt-1">
              Performance
            </div>
          </div>

          <nav className="space-y-2">
            <NavItem href="/" label="Dashboard" />
            <NavItem href="/athletes" label="Atletas" />
            <NavItem href="/trainings" label="Entrenamientos" />
            <NavItem href="/conade" label="CONADE" />
          </nav>

          <div className="mt-auto rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-sm font-bold text-cyan-300">
              Precision • Training • Performance
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Plataforma de análisis deportivo para tiro con arco.
            </p>
          </div>
        </aside>

        <main className="flex-1">
          <div className="lg:hidden border-b border-white/10 bg-[#030712] p-4">
            <div className="text-xl font-black">Tech Archery Lab</div>
            <div className="flex gap-3 mt-3 text-sm">
              <Link href="/">Dashboard</Link>
              <Link href="/athletes">Atletas</Link>
              <Link href="/trainings">Entrenamientos</Link>
              <Link href="/conade">CONADE</Link>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
    >
      {label}
    </Link>
  );
}