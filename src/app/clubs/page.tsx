import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClubCreateModal from "./ClubCreateModal";
import {
  Building2,
  MapPin,
  Users,
  Activity,
  ArrowLeft,
  Search,
  X,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    name?: string;
    city?: string;
    status?: string;
  }>;
};

export default async function ClubsPage({ searchParams }: PageProps) {
  // =========================
  // Parámetros de filtros
  // =========================
  const params = await searchParams;

  const name = params?.name?.trim().toLowerCase() || "";
  const city = params?.city?.trim().toLowerCase() || "";
  const status = params?.status || "";

  const hasFilters = Boolean(name || city || status);

  // =========================
  // Cliente Supabase + sesión
  // =========================
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // =========================
  // Perfil del usuario
  // =========================
  const { data: profile } = await supabase
    .from("users")
    .select("id, name, role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "coach") {
    if (profile.club_id) redirect(`/clubs/${profile.club_id}`);
    redirect("/");
  }

  // =========================
  // Consulta principal de clubs
  // =========================
  const { data: clubsRaw, error } = await supabase
    .from("clubs")
    .select(`
      id,
      name,
      city,
      state,
      country,
      logo_url,
      is_active,
      created_at,
      athlete_profiles (
        id
      ),
      users (
        id
      ),
      training_sessions (
        id
      )
    `)
    .order("name", { ascending: true });

  // =========================
  // Filtrado en servidor
  // =========================
  const clubs =
    clubsRaw?.filter((club: any) => {
      const clubName = club.name?.toLowerCase() || "";
      const clubCity = club.city?.toLowerCase() || "";
      const clubStatus = club.is_active ? "activo" : "inactivo";

      const matchesName = name ? clubName.includes(name) : true;
      const matchesCity = city ? clubCity.includes(city) : true;
      const matchesStatus = status ? clubStatus === status : true;

      return matchesName && matchesCity && matchesStatus;
    }) || [];

  // =========================
  // Límite de registros visibles
  // =========================
  const visibleClubs = clubs.slice(0, 10);

  // =========================
  // Métricas
  // =========================
  const totalClubs = clubs.length;

  const activeClubs = clubs.filter((club: any) => club.is_active).length;

  const inactiveClubs = clubs.filter((club: any) => !club.is_active).length;

  const totalAthletes = clubs.reduce(
    (sum: number, club: any) => sum + (club.athlete_profiles?.length || 0),
    0
  );

  const totalTrainings = clubs.reduce(
    (sum: number, club: any) => sum + (club.training_sessions?.length || 0),
    0
  );

  // =========================
  // Clases reutilizables
  // =========================
  const filterClass =
    "w-full rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

  const statCardClass =
    "tal-metric-card";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      {/* =========================
          Fondos decorativos TAL
      ========================== */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* =========================
            Barra superior
        ========================== */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          {profile.role === "admin" && <ClubCreateModal />}
        </div>

        {/* =========================
            Hero principal
        ========================== */}
        <section className="mb-6 overflow-hidden rounded-[2.2rem] border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-7 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <div className="relative">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Club Network
            </p>

            <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  Clubs
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                  Administra clubes, atletas, entrenamientos y actividad
                  general del ecosistema TAL.
                </p>
              </div>

              <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
                <p className="text-xs font-black uppercase">
                  {hasFilters ? "Filtrados" : "Registrados"}
                </p>
                <p className="text-5xl font-black">{totalClubs}</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            Métricas compactas
        ========================== */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className={statCardClass}>
            <div className="mb-3 text-cyan-300">
              <Building2 size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {hasFilters ? "Resultados" : "Total"}
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {totalClubs}
            </p>
          </div>

          <div className={statCardClass}>
            <div className="mb-3 text-cyan-300">
              <Activity size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Activos
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {activeClubs}
            </p>
          </div>

          <div className={statCardClass}>
            <div className="mb-3 text-cyan-300">
              <X size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Inactivos
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {inactiveClubs}
            </p>
          </div>

          <div className={statCardClass}>
            <div className="mb-3 text-cyan-300">
              <Users size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Atletas
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {totalAthletes}
            </p>
          </div>

          <div className={statCardClass}>
            <div className="mb-3 text-cyan-300">
              <MapPin size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Sesiones
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {totalTrainings}
            </p>
          </div>
        </section>

        {/* =========================
            Filtros
        ========================== */}
        <section className="mb-6 rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <input
              name="name"
              defaultValue={params?.name || ""}
              placeholder="Buscar por nombre"
              className={filterClass}
            />

            <input
              name="city"
              defaultValue={params?.city || ""}
              placeholder="Filtrar por ciudad"
              className={filterClass}
            />

            <select
              name="status"
              defaultValue={params?.status || ""}
              className={filterClass}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              <Search size={16} />
              Filtrar
            </button>

            <Link
              href="/clubs"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
            >
              <X size={16} />
              Limpiar
            </Link>
          </form>
        </section>

        {/* =========================
            Error de consulta
        ========================== */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {JSON.stringify(error)}
          </div>
        )}

        {/* =========================
            Lista horizontal de clubs
        ========================== */}
        {visibleClubs.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
            No se encontraron clubs con esos filtros.
          </div>
        ) : (
          <section className="space-y-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Mostrando {visibleClubs.length} de {totalClubs}
              </p>

              {totalClubs > 10 && (
                <p className="text-xs font-bold text-slate-500">
                  Vista limitada a los primeros 10 registros
                </p>
              )}
            </div>

            {visibleClubs.map((club: any) => {
              const athletesCount = club.athlete_profiles?.length || 0;
              const usersCount = club.users?.length || 0;
              const trainingsCount = club.training_sessions?.length || 0;

              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="group relative block overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-4 shadow-[0_0_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/[0.06] hover:shadow-[0_0_70px_rgba(34,211,238,0.12)]"
                >
                  <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl transition group-hover:bg-cyan-300/20" />

                  <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[96px_1.3fr_1fr_auto] md:items-center">
                    {/* Logo del club */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-cyan-400/15 bg-slate-900 text-4xl font-black text-cyan-300">
                        {club.logo_url ? (
                          <img
                            src={club.logo_url}
                            alt={club.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          club.name?.charAt(0) || "C"
                        )}
                      </div>
                    </div>

                    {/* Datos principales */}
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={
                            club.is_active
                              ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300"
                              : "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-300"
                          }
                        >
                          {club.is_active ? "Activo" : "Inactivo"}
                        </span>

                        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                          TAL Network
                        </span>
                      </div>

                      <h2 className="text-2xl font-black text-white">
                        {club.name || "Club sin nombre"}
                      </h2>

                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <MapPin size={15} />
                        {club.city || "Sin ciudad"},{" "}
                        {club.state || "Sin estado"}
                      </p>
                    </div>

                    {/* Datos del club */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          Atletas
                        </p>
                        <p className="mt-1 text-xl font-black text-white">
                          {athletesCount}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          Usuarios
                        </p>
                        <p className="mt-1 text-xl font-black text-white">
                          {usersCount}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          Sesiones
                        </p>
                        <p className="mt-1 text-xl font-black text-white">
                          {trainingsCount}
                        </p>
                      </div>
                    </div>

                    {/* Acción */}
                    <div className="flex items-center justify-end">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition group-hover:translate-x-1 group-hover:bg-cyan-300">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
