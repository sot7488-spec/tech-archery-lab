import Link from "next/link";
import EquipmentCardModal from "../EquipmentCardModal";
import AthleteEquipmentCreateModal from "./AthleteEquipmentCreateModal";
import {
  BowArrow,
  Crosshair,
  Shield,
  Target,
  Wrench,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AthleteEquipmentPage({ params }: PageProps) {
  const { id: athleteId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Link
          href="/login"
          className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
        >
          Iniciar sesión
        </Link>
      </main>
    );
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  const { data: athlete, error: athleteError } = await supabase
    .from("athlete_profiles")
    .select(`
      id,
      user_id,
      club_id,
      category,
      bow_type,
      users!athlete_profiles_user_id_fkey (
        name,
        email
      )
    `)
    .eq("id", athleteId)
    .single();

  if (athleteError || !athlete) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8">
          <h1 className="text-3xl font-black text-red-300">
            Atleta no encontrado
          </h1>

          <Link
            href="/equipment"
            className="mt-5 inline-block text-sm font-black text-cyan-300"
          >
            ← Volver a equipamiento
          </Link>
        </div>
      </main>
    );
  }

  if (currentUser?.role === "athlete" && athlete.user_id !== user.id) {
    const { data: ownAthlete } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (ownAthlete?.id) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
          <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8 text-center">
            <h1 className="text-2xl font-black text-red-300">
              No puedes ver el equipamiento de otro atleta.
            </h1>

            <Link
              href={`/equipment/${ownAthlete.id}`}
              className="mt-5 inline-block rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
            >
              Ir a mi equipamiento
            </Link>
          </div>
        </main>
      );
    }
  }

  if (currentUser?.role === "coach" && athlete.club_id !== currentUser.club_id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-2xl font-black text-red-300">
            Solo puedes ver equipamiento de atletas de tu club.
          </h1>

          <Link
            href="/equipment"
            className="mt-5 inline-block rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
          >
            Volver a equipamiento
          </Link>
        </div>
      </main>
    );
  }

  const { data: equipmentRaw, error } = await supabase
    .from("equipment_profiles")
    .select(`
      *,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      )
    `)
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });

  const equipment = equipmentRaw || [];

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

  const athleteUser = Array.isArray(athlete.users)
    ? athlete.users[0]
    : athlete.users;

  const athleteName = athleteUser?.name || "Atleta";

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
            <AthleteEquipmentCreateModal
            athleteId={athleteId}
            athleteName={athleteName}
          />
        </div>
       </div>

      <div className="mx-auto max-w-7xl">
        <section className="mb-6 overflow-hidden rounded-[2.2rem] border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-7 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Athlete Equipment
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Equipamiento
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Configuraciones de equipo registradas para{" "}
                <span className="font-black text-cyan-300">{athleteName}</span>.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">
                  {athlete.category || "Sin categoría"}
                </span>

                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-300">
                  {athlete.bow_type || "Sin arco"}
                </span>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Fichas</p>
              <p className="text-5xl font-black">{totalEquipment}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className={statCardClass}>
            <Wrench className="mb-3 text-cyan-300" size={22} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Total
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

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {JSON.stringify(error)}
          </div>
        )}

        {visibleEquipment.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
            Este atleta aún no tiene equipamiento registrado.
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
