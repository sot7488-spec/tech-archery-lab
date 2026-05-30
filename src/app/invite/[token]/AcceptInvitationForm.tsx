"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { acceptStaffInvitation } from "./actions";

type Props = {
  token: string;
};

export default function AcceptInvitationForm({ token }: Props) {
  const [state, action, pending] = useActionState(acceptStaffInvitation, {});

  if (state.success) {
    return (
      <div className="rounded-[2rem] border border-green-400/30 bg-green-500/10 p-6 text-center">
        <ShieldCheck className="mx-auto text-green-300" size={40} />
        <h2 className="mt-4 text-2xl font-black text-white">Invitación aceptada</h2>
        <p className="mt-2 text-sm font-bold text-green-200">{state.success}</p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <input
        type="text"
        name="name"
        placeholder="Nombre completo"
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-medium text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Contraseña mínimo 6 caracteres"
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-medium text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
        required
      />

      {state.error && (
        <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-cyan-400 px-4 py-4 font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creando cuenta..." : "Aceptar invitación"}
      </button>
    </form>
  );
}
