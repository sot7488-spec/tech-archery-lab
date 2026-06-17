export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, X, UserRound, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AthleteCreateModal from "./AthleteCreateModal";

type PageProps = {
  searchParams?: Promise<{
    name?: string;
    category?: string;
    bow_type?: string;
  }>;
};

export default async function AthletesPage({ searchParams }: PageProps) {
  // =========================
  // Parámetros de filtros
  // =========================
  const params = await searchParams;

  const name = params?.name?.trim().toLowerCase() || "";
  const category = params?.category?.trim().toLowerCase() || "";
  const bowType = params?.bow_type || "";

  const hasFilters = Boolean(name || category || bowType);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (
    (profile.role === "coach" || profile.role === "sports_psychologist") &&
    !profile.club_id
  ) {
    redirect("/");
  }

  // =========================
  // Carga de clubs para modal
  // =========================
  let clubsQuery = supabase
    .from("clubs")
    .select("id, name")
    .order("name", { ascending: true });

  if (
    (profile.role === "coach" || profile.role === "sports_psychologist") &&
    profile.club_id
  ) {
    clubsQuery = clubsQuery.eq("id", profile.club_id);
  }

  const { data: clubs } = await clubsQuery;

  // =========================
  // Consulta principal de atletas
  // =========================
  let athletesQuery = supabase
    .from("athlete_profiles")
    .select(`
      *,
      users!athlete_profiles_user_id_fkey (
        name,
        email
      ),
      clubs (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (
    (profile.role === "coach" || profile.role === "sports_psychologist") &&
    profile.club_id
  ) {
    athletesQuery = athletesQuery.eq("club_id", profile.club_id);
  }

  const { data: athletesRaw, error } = await athletesQuery;

  // =========================
  // Filtrado en servidor
  // =========================
  const athletes =
    athletesRaw?.filter((athlete: any) => {
      const athleteName = athlete.users?.name?.toLowerCase() || "";
      const athleteCategory = athlete.category?.toLowerCase() || "";
      const athleteBowType = athlete.bow_type || "";

      const matchesName = name ? athleteName.includes(name) : true;
      const matchesCategory = category
        ? athleteCategory.includes(category)
        : true;
      const matchesBowType = bowType ? athleteBowType === bowType : true;

      return matchesName && matchesCategory && matchesBowType;
    }) || [];

  // =========================
  // Límite de registros visibles
  // =========================
  const visibleAthletes = athletes.slice(0, 10);

  // =========================
  // Métricas
  // =========================
  const totalAthletes = athletes.length;

  const recurveCount = athletes.filter(
    (athlete: any) => athlete.bow_type === "recurvo"
  ).length;

  const compoundCount = athletes.filter(
    (athlete: any) => athlete.bow_type === "compuesto"
  ).length;

  const barebowCount = athletes.filter(
    (athlete: any) => athlete.bow_type === "barebow"
  ).length;

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
            className="rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            ← Dashboard
          </Link>

          {profile.role !== "sports_psychologist" && (
            <AthleteCreateModal clubs={clubs ?? []} />
          )}
        </div>

        {/* =========================
            Hero principal
        ========================== */}
        <section className="mb-6 overflow-hidden rounded-[2.2rem] border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-7 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <div className="relative">
            <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Athlete Management
            </p>

            <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  Atletas
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                  Control de arqueros, categoría, tipo de arco, mano dominante,
                  club, asociación e ID de federación.
                </p>
              </div>

              <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
                <p className="text-xs font-black uppercase">
                  {hasFilters ? "Filtrados" : "Registrados"}
                </p>
                <p className="text-5xl font-black">{totalAthletes}</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            Métricas compactas
        ========================== */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className={statCardClass}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {hasFilters ? "Resultados" : "Total"}
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {totalAthletes}
            </p>
          </div>

          <div className={statCardClass}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Recurvo
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {recurveCount}
            </p>
          </div>

          <div className={statCardClass}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Compuesto
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {compoundCount}
            </p>
          </div>

          <div className={statCardClass}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Barebow
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {barebowCount}
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
              name="category"
              defaultValue={params?.category || ""}
              placeholder="Filtrar por categoría"
              className={filterClass}
            />

            <select
              name="bow_type"
              defaultValue={params?.bow_type || ""}
              className={filterClass}
            >
              <option value="">Todos los arcos</option>
              <option value="recurvo">Recurvo</option>
              <option value="compuesto">Compuesto</option>
              <option value="barebow">Barebow</option>
              <option value="tradicional">Tradicional</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              <Search size={16} />
              Filtrar
            </button>

            <Link
              href="/athletes"
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
            Lista horizontal de atletas
        ========================== */}
        {visibleAthletes.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
            No se encontraron atletas con esos filtros.
          </div>
        ) : (
          <section className="space-y-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Mostrando {visibleAthletes.length} de {totalAthletes}
              </p>

              {totalAthletes > 10 && (
                <p className="text-xs font-bold text-slate-500">
                  Vista limitada a los primeros 10 registros
                </p>
              )}
            </div>

            {visibleAthletes.map((athlete: any) => (
              <Link
                href={`/athletes/${athlete.id}`}
                key={athlete.id}
                className="group relative block overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-4 shadow-[0_0_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/[0.06] hover:shadow-[0_0_70px_rgba(34,211,238,0.12)]"
              >
                <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl transition group-hover:bg-cyan-300/20" />

                <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[96px_1.4fr_1fr_auto] md:items-center">
                  {/* Foto del atleta */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-cyan-400/15 bg-slate-900">
                      {athlete.photo_url ? (
                        <img
                          src={athlete.photo_url}
                          alt={athlete.users?.name || "Atleta"}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <UserRound className="text-cyan-300/70" size={38} />
                      )}
                    </div>
                  </div>

                  {/* Datos principales */}
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                        {athlete.bow_type || "arco"}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        {athlete.category || "sin categoría"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-white">
                      {athlete.users?.name || "Sin nombre"}
                    </h2>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {athlete.users?.email || "Sin correo"}
                    </p>
                  </div>

                  {/* Datos deportivos */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs font-bold text-slate-500">Club</p>
                      <p className="mt-1 truncate font-black text-white">
                        {athlete.clubs?.name || "Sin club"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs font-bold text-slate-500">
                        Dominante
                      </p>
                      <p className="mt-1 font-black text-white">
                        {athlete.dominant_hand || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs font-bold text-slate-500">
                        Asociación
                      </p>
                      <p className="mt-1 truncate font-black text-white">
                        {athlete.association_id || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs font-bold text-slate-500">
                        ID Federación
                      </p>
                      <p className="mt-1 truncate font-black text-white">
                        {athlete.federation_id || "-"}
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
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
