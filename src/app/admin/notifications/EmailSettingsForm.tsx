"use client";

import { useActionState } from "react";
import { MailCheck, Save, Send, ServerCog } from "lucide-react";
import { saveEmailSettings, sendTestEmail } from "./actions";

type EmailSettings = {
  id?: string;
  label?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_secure?: boolean | null;
  smtp_username?: string | null;
  has_password?: boolean | null;
  from_name?: string | null;
  from_email?: string | null;
  reply_to?: string | null;
  is_enabled?: boolean | null;
};

type Props = {
  settings: EmailSettings | null;
  adminEmail: string;
};

const inputClass =
  "rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-bold text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-400";

export default function EmailSettingsForm({ settings, adminEmail }: Props) {
  const [saveState, saveAction, saving] = useActionState(saveEmailSettings, {});
  const [testState, testAction, testing] = useActionState(sendTestEmail, {});

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <form
        action={saveAction}
        className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <ServerCog size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              SMTP
            </p>
            <h2 className="text-2xl font-black">Servidor de correo</h2>
          </div>
        </div>

        <input type="hidden" name="id" value={settings?.id || ""} />

        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="label"
            defaultValue={settings?.label || "Principal"}
            placeholder="Nombre interno"
            className={inputClass}
          />

          <label className="flex items-center gap-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/10 px-4 py-3 font-black text-cyan-100">
            <input
              name="is_enabled"
              type="checkbox"
              defaultChecked={settings?.is_enabled ?? true}
              className="h-5 w-5 accent-cyan-400"
            />
            Activar envio de correos
          </label>

          <input
            name="smtp_host"
            defaultValue={settings?.smtp_host || ""}
            placeholder="SMTP host"
            className={inputClass}
            required
          />

          <input
            name="smtp_port"
            type="number"
            min={1}
            max={65535}
            defaultValue={settings?.smtp_port || 587}
            placeholder="Puerto"
            className={inputClass}
            required
          />

          <input
            name="smtp_username"
            defaultValue={settings?.smtp_username || ""}
            placeholder="Usuario SMTP"
            className={inputClass}
          />

          <input
            name="smtp_password"
            type="password"
            placeholder={
              settings?.has_password
                ? "Nueva contrasena SMTP opcional"
                : "Contrasena SMTP"
            }
            className={inputClass}
          />

          <input
            name="from_name"
            defaultValue={settings?.from_name || "Tech Archery Lab"}
            placeholder="Nombre remitente"
            className={inputClass}
            required
          />

          <input
            name="from_email"
            type="email"
            defaultValue={settings?.from_email || ""}
            placeholder="Correo remitente"
            className={inputClass}
            required
          />

          <input
            name="reply_to"
            type="email"
            defaultValue={settings?.reply_to || ""}
            placeholder="Responder a"
            className={inputClass}
          />

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-black text-slate-200">
            <input
              name="smtp_secure"
              type="checkbox"
              defaultChecked={settings?.smtp_secure ?? false}
              className="h-5 w-5 accent-cyan-400"
            />
            Usar SSL/TLS directo
          </label>
        </div>

        {saveState.error && (
          <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
            {saveState.error}
          </p>
        )}

        {saveState.success && (
          <p className="mt-4 rounded-2xl border border-green-400/30 bg-green-500/10 p-3 text-sm font-bold text-green-200">
            {saveState.success}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Guardando..." : "Guardar SMTP"}
        </button>
      </form>

      <form
        action={testAction}
        className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10 text-green-300">
            <MailCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-green-300">
              Prueba
            </p>
            <h2 className="text-2xl font-black">Enviar test</h2>
          </div>
        </div>

        <input
          name="test_email"
          type="email"
          defaultValue={adminEmail}
          placeholder="Correo destino"
          className={`${inputClass} w-full`}
          required
        />

        {testState.error && (
          <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
            {testState.error}
          </p>
        )}

        {testState.success && (
          <p className="mt-4 rounded-2xl border border-green-400/30 bg-green-500/10 p-3 text-sm font-bold text-green-200">
            {testState.success}
          </p>
        )}

        <button
          type="submit"
          disabled={testing}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-green-300 px-5 py-3 font-black text-slate-950 shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} />
          {testing ? "Enviando..." : "Enviar prueba"}
        </button>

        <p className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-3 text-xs font-bold leading-5 text-yellow-100">
          Para Gmail u Outlook normalmente necesitas una contrasena de
          aplicacion, no tu password principal.
        </p>
      </form>
    </div>
  );
}
