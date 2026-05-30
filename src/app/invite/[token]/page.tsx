import Link from "next/link";
import { hashInvitationToken } from "@/lib/invitations";
import { createClient } from "@/lib/supabase/server";
import AcceptInvitationForm from "./AcceptInvitationForm";

export const dynamic = "force-dynamic";

type RelatedClub = { name: string | null } | { name: string | null }[] | null;

function getClubName(club: RelatedClub) {
  if (Array.isArray(club)) return club[0]?.name || "Sin club asignado";
  return club?.name || "Sin club asignado";
}

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();
  const tokenHash = hashInvitationToken(token);

  const { data: invitation } = await supabase
    .from("staff_invitations")
    .select(
      `
      email,
      role,
      expires_at,
      accepted_at,
      clubs (
        name
      )
    `
    )
    .eq("token_hash", tokenHash)
    .single();

  const invalid =
    !invitation ||
    Boolean(invitation.accepted_at) ||
    new Date(invitation.expires_at) < new Date();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="absolute inset-0 tal-radial tal-grid-bg" />
      <div className="absolute -top-32 right-[-120px] h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-[-140px] left-[-120px] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-cyan-400/20 bg-slate-950/70 p-8 shadow-[0_0_80px_rgba(34,211,238,0.18)] backdrop-blur-xl md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          TAL Staff Invite
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight">
          Invitación
        </h1>

        {invalid ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
            <p className="font-black text-red-300">
              Esta invitación no existe, expiró o ya fue utilizada.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <>
            <div className="my-6 rounded-2xl border border-cyan-400/10 bg-white/[0.04] p-4">
              <p className="text-sm font-bold text-slate-400">Cuenta</p>
              <p className="mt-1 font-black">{invitation.email}</p>
              <p className="mt-3 text-sm font-bold text-slate-400">Rol</p>
              <p className="mt-1 font-black capitalize">{invitation.role}</p>
              <p className="mt-3 text-sm font-bold text-slate-400">Club</p>
              <p className="mt-1 font-black">
                {getClubName(invitation.clubs)}
              </p>
            </div>

            <AcceptInvitationForm token={token} />
          </>
        )}
      </section>
    </main>
  );
}
