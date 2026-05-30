import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import InvitationCreateForm from "./InvitationCreateForm";

export const dynamic = "force-dynamic";

type RelatedClub = { name: string | null } | { name: string | null }[] | null;

function getClubName(club: RelatedClub) {
  if (Array.isArray(club)) return club[0]?.name || "Sin club";
  return club?.name || "Sin club";
}

export default async function StaffInvitationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: invitations } = await supabase
    .from("staff_invitations")
    .select(
      `
      id,
      email,
      role,
      expires_at,
      accepted_at,
      created_at,
      clubs (
        name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-200"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <section className="overflow-hidden rounded-[2.2rem] border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-7 shadow-[0_0_80px_rgba(34,211,238,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Staff Access
          </p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Invitaciones
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Crea accesos de un solo uso para coaches y administradores.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Pendientes</p>
              <p className="text-5xl font-black">
                {invitations?.filter((invite) => !invite.accepted_at).length || 0}
              </p>
            </div>
          </div>
        </section>

        <InvitationCreateForm clubs={clubs || []} />

        <section className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Historial
              </p>
              <h2 className="text-2xl font-black">Últimas invitaciones</h2>
            </div>
          </div>

          <div className="space-y-3">
            {invitations?.map((invite) => {
              const expired =
                !invite.accepted_at && new Date(invite.expires_at) < new Date();
              const status = invite.accepted_at
                ? "Aceptada"
                : expired
                  ? "Expirada"
                  : "Pendiente";

              return (
                <div
                  key={invite.id}
                  className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <p className="font-black">{invite.email}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {invite.role} · {getClubName(invite.clubs)}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-black text-cyan-300">
                    <ShieldCheck size={16} />
                    {status}
                  </span>

                  <p className="text-sm font-bold text-slate-400 md:text-right">
                    Expira: {new Date(invite.expires_at).toLocaleDateString("es-MX")}
                  </p>
                </div>
              );
            })}

            {!invitations?.length && (
              <p className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm font-bold text-slate-400">
                Aún no hay invitaciones registradas.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
