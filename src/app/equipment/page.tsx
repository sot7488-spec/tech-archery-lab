import Link from "next/link";
import { redirect } from "next/navigation";
import EquipmentCreateModal from "./EquipmentCreateModal";
import EquipmentCardModal from "./EquipmentCardModal";
import {
  BowArrow,
  Crosshair,
  Search,
  Target,
  Wrench,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    name?: string;
  }>;
};

export default async function EquipmentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const name = params?.name?.trim().toLowerCase() || "";
  const hasFilters = Boolean(name);

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
  if (profile.role === "coach" && !profile.club_id) redirect("/");

  let athletesQuery = supabase
    .from("athlete_profiles")
    .select(`
      id,
      club_id,
      users!athlete_profiles_user_id_fkey (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (profile.role === "coach") {
    athletesQuery = athletesQuery.eq("club_id", profile.club_id);
  }

  const { data: athletes } = await athletesQuery;
  const scopedAthleteIds = athletes?.map((athlete) => athlete.id) || [];

  const { data: equipmentRaw, error } = await supabase
    .from("equipment_profiles")
    .select(`
      *,
      athlete_profiles (
        id,
        club_id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  const equipment =
    equipmentRaw?.filter((item: any) => {
      if (
        profile.role === "coach" &&
        !scopedAthleteIds.includes(item.athlete_id)
      ) {
        return false;
      }

      const equipmentName = item.name?.toLowerCase() || "";
      const athleteName =
        item.athlete_profiles?.users?.name?.toLowerCase() || "";

      return name
        ? equipmentName.includes(name) || athleteName.includes(name)
        : true;
    }) || [];

  const visibleEquipment = equipment.slice(0, 10);

  const totalEquipment = equipment.length;

  const recurveCount = equipment.filter(
    (item: any) => item.bow_type === "recurvo"
  ).length;

  const compoundCount = equipment.filter(
    (item: any) => item.bow_type === "compuesto"
  ).length;

  const traditionalCount = equipment.filter(
    (item: any) => item.bow_type === "tradicional"
  ).length;

  const filterClass =
    "w-full rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

  const statCardClass =
    "tal-metric-card";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            ← Dashboard
          </Link>

          <EquipmentCreateModal athletes={athletes ?? []} />
        </div>

        <section className="mb-6 overflow-hidden rounded-[2.2rem] border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-7 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Equipment Lab
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Equipamiento
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Control técnico del arco, flechas, mira, repisa, plunger,
                estabilización y configuración de cada atleta.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">
                {hasFilters ? "Filtrados" : "Fichas"}
              </p>
              <p className="text-5xl font-black">{totalEquipment}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className={statCardClass}>
            <Wrench className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {hasFilters ? "Resultados" : "Total"}
            </p>
            <p className="mt-2 text-4xl font-black text-white">
              {totalEquipment}
            </p>
          </div>

          <div className={statCardClass}>
            <BowArrow className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Recurvo
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {recurveCount}
            </p>
          </div>

          <div className={statCardClass}>
            <Target className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Compuesto
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {compoundCount}
            </p>
          </div>

          <div className={statCardClass}>
            <Crosshair className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Tradicional
            </p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {traditionalCount}
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              name="name"
              defaultValue={params?.name || ""}
              placeholder="Buscar por equipo o atleta"
              className={filterClass}
            />

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              <Search size={16} />
              Filtrar
            </button>

            <Link
              href="/equipment"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
            >
              <X size={16} />
              Limpiar
            </Link>
          </form>
        </section>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {JSON.stringify(error)}
          </div>
        )}

        {visibleEquipment.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
            Aún no hay equipamiento registrado o no coincide con el filtro.
          </div>
        ) : (
          <section className="space-y-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Mostrando {visibleEquipment.length} de {totalEquipment}
              </p>

              {totalEquipment > 10 && (
                <p className="text-xs font-bold text-slate-500">
                  Vista limitada a los primeros 10 registros
                </p>
              )}
            </div>

            {visibleEquipment.map((item: any) => (
              <EquipmentCardModal key={item.id} item={item} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
