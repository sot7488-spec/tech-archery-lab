export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Crosshair, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getScorecardBlockLeft,
  getScorecardBubblePosition,
  SCORECARD_OPTIONS,
  SCORECARD_ROW_GAP,
  SCORECARD_ROW_TOP,
} from "../../scorecardLayout";
import PrintButton from "./PrintButton";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ athlete?: string; round?: string }>;
};

function todayInMexico() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getName(relation: any, fallback = "Sin nombre") {
  if (Array.isArray(relation)) return relation[0]?.name || fallback;
  return relation?.name || fallback;
}

export default async function PrintableScorecardPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { athlete: athleteIdParam, round: roundId } = await searchParams;
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

  let athleteQuery = supabase
    .from("athlete_profiles")
    .select(`
      id,
      club_id,
      users!athlete_profiles_user_id_fkey (
        name
      ),
      clubs (
        name
      )
    `);

  if (profile.role === "athlete") {
    athleteQuery = athleteQuery.eq("user_id", user.id);
  } else if (athleteIdParam) {
    athleteQuery = athleteQuery.eq("id", athleteIdParam);
  } else {
    redirect(`/leagues/${id}`);
  }

  const { data: athlete } = await athleteQuery.maybeSingle();

  if (!athlete?.id) redirect(`/leagues/${id}`);

  const { data: enrollment } = await supabase
    .from("indoor_league_athletes")
    .select("id")
    .eq("league_id", id)
    .eq("athlete_id", athlete.id)
    .maybeSingle();

  if (!enrollment) redirect("/leagues");

  if (profile.role === "coach") {
    const { data: invite } = await supabase
      .from("indoor_league_coaches")
      .select("id")
      .eq("league_id", id)
      .eq("coach_id", user.id)
      .maybeSingle();

    if (!invite || athlete.club_id !== profile.club_id) redirect("/leagues");
  }

  if (profile.role !== "admin" && profile.role !== "coach" && profile.role !== "athlete") {
    redirect("/leagues");
  }

  const { data: league } = await supabase
    .from("indoor_leagues")
    .select(`
      id,
      name,
      category,
      bow_type,
      distance_meters,
      target_size_cm,
      arrows_count,
      indoor_league_rounds (
        id,
        round_number,
        round_date
      )
    `)
    .eq("id", id)
    .single();

  if (!league) redirect("/leagues");

  const rounds = [...(league.indoor_league_rounds || [])].sort(
    (a: any, b: any) => Number(a.round_number) - Number(b.round_number)
  );
  const selectedRound =
    rounds.find((round: any) => round.id === roundId) ||
    rounds.find((round: any) => round.round_date === todayInMexico()) ||
    rounds[0];

  if (!selectedRound) redirect(`/leagues/${id}`);

  const arrowsCount = Number(league.arrows_count || 60);
  const talCode = [
    "TAL-SCORECARD",
    league.id,
    selectedRound.id,
    athlete.id,
    arrowsCount,
  ].join("|");

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-7 text-white print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-7xl print:max-w-none">
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/leagues/${league.id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300"
          >
            <ArrowLeft size={16} />
            Volver a liga
          </Link>
          <PrintButton />
        </div>

        <section className="tal-print-sheet relative mx-auto overflow-hidden bg-white text-slate-950 shadow-2xl print:shadow-none">
          <div className="absolute left-[3%] top-[3%] h-[4.5%] w-[3.2%] border-[3px] border-black" />
          <div className="absolute right-[3%] top-[3%] h-[4.5%] w-[3.2%] border-[3px] border-black" />
          <div className="absolute bottom-[3%] left-[3%] h-[4.5%] w-[3.2%] border-[3px] border-black" />
          <div className="absolute bottom-[3%] right-[3%] h-[4.5%] w-[3.2%] border-[3px] border-black" />

          <div className="absolute left-[4%] top-[4%]">
            <p className="text-[11px] font-black tracking-[0.35em] text-cyan-700">
              TECH ARCHERY LAB
            </p>
            <h1 className="mt-1 text-[30px] font-black leading-none">
              Scorecard indoor oficial
            </h1>
          </div>

          <div className="absolute right-[7%] top-[4%] max-w-[34%] text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Codigo TAL
            </p>
            <p className="mt-1 break-all rounded-md border border-slate-300 bg-slate-100 p-2 font-mono text-[8px] font-black leading-tight">
              {talCode}
            </p>
          </div>

          <div className="absolute left-[4%] top-[15%] grid w-[92%] grid-cols-4 gap-2 text-[10px] font-bold">
            <Info icon={<ShieldCheck size={13} />} label="Atleta" value={getName(athlete.users, "Atleta")} />
            <Info icon={<Crosshair size={13} />} label="Club" value={getName(athlete.clubs, "Club")} />
            <Info icon={<CalendarDays size={13} />} label="Jornada" value={`${selectedRound.round_number} / ${selectedRound.round_date}`} />
            <Info icon={<Crosshair size={13} />} label="Liga" value={league.name} />
          </div>

          <div className="absolute left-[4%] top-[24%] w-[92%] border-y border-slate-900 py-1 text-center text-[9px] font-black uppercase tracking-[0.18em]">
            Marca una sola burbuja por flecha. Usa X para 10 interior y M para cero.
          </div>

          {[0, 1, 2].map((blockIndex) => (
            <div key={blockIndex}>
              <div
                className="absolute top-[28.1%] grid grid-cols-[22px_repeat(12,1fr)] gap-1 text-center text-[8px] font-black"
                style={{ left: `${getScorecardBlockLeft(blockIndex)}%`, width: "27.5%" }}
              >
                <span>#</span>
                {SCORECARD_OPTIONS.map((option) => (
                  <span key={option}>{option}</span>
                ))}
              </div>
              {Array.from({ length: 20 }, (_, rowIndex) => {
                const arrowNumber = blockIndex * 20 + rowIndex + 1;
                if (arrowNumber > arrowsCount) return null;

                return (
                  <div
                    key={arrowNumber}
                    className="absolute text-[8px] font-black"
                    style={{
                      left: `${getScorecardBlockLeft(blockIndex)}%`,
                      top: `${SCORECARD_ROW_TOP + rowIndex * SCORECARD_ROW_GAP - 0.63}%`,
                      width: "3.8%",
                    }}
                  >
                    {arrowNumber}
                  </div>
                );
              })}
            </div>
          ))}

          {Array.from({ length: arrowsCount }, (_, arrowIndex) =>
            SCORECARD_OPTIONS.map((option, optionIndex) => {
              const position = getScorecardBubblePosition(arrowIndex + 1, optionIndex);
              return (
                <span
                  key={`${arrowIndex}-${option}`}
                  className="absolute h-[1.25%] w-[0.88%] rounded-full border border-slate-950"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })
          )}

          <div className="absolute bottom-[5.5%] left-[4%] grid w-[92%] grid-cols-[1fr_1fr_1fr] gap-4 text-[10px] font-bold">
            <div className="border-t border-slate-950 pt-1">Firma atleta</div>
            <div className="border-t border-slate-950 pt-1">Firma juez / coach</div>
            <div className="border-t border-slate-950 pt-1">Total validado</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-300 p-2">
      {icon}
      <span className="min-w-0">
        <span className="block text-[7px] uppercase tracking-[0.2em] text-slate-500">
          {label}
        </span>
        <span className="block truncate">{value}</span>
      </span>
    </div>
  );
}
