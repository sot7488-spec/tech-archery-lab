"use client";

import { useActionState } from "react";
import { Copy, Send } from "lucide-react";
import { createStaffInvitation } from "./actions";

type Club = {
  id: string;
  name: string;
};

type Props = {
  clubs: Club[];
};

export default function InvitationCreateForm({ clubs }: Props) {
  const [state, action, pending] = useActionState(createStaffInvitation, {});

  return (
    <form
      action={action}
      className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
          Nueva invitación
        </p>
        <h2 className="mt-2 text-2xl font-black">Invitar staff</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          type="email"
          name="email"
          placeholder="Correo del invitado"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
          required
        />

        <select
          name="role"
          defaultValue="coach"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-bold text-white outline-none focus:border-cyan-400"
          required
        >
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>

        <select
          name="club_id"
          defaultValue={clubs[0]?.id || ""}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-bold text-white outline-none focus:border-cyan-400"
        >
          <option value="">Sin club (solo admin)</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
          {state.error}
        </p>
      )}

      {state.inviteUrl && (
        <div className="mt-4 rounded-2xl border border-green-400/30 bg-green-500/10 p-3">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-green-300">
            Link creado
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
            <code className="flex-1 break-all rounded-xl bg-slate-950/70 p-3 text-sm text-green-100">
              {state.inviteUrl}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.inviteUrl || "")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-300 px-4 py-3 text-sm font-black text-slate-950"
            >
              <Copy size={16} />
              Copiar
            </button>
          </div>
        </div>
      )}

      {state.emailStatus && (
        <p className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm font-bold text-cyan-100">
          {state.emailStatus}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={18} />
        {pending ? "Creando..." : "Crear invitación"}
      </button>
    </form>
  );
}
