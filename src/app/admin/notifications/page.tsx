import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BellRing, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EmailSettingsForm from "./EmailSettingsForm";

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: settings } = await supabase
    .from("notification_email_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
            TAL Notifications
          </p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Correos y SMTP
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Configura el servidor de envio para invitaciones de coach,
                admins y futuras notificaciones del sistema.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Estado</p>
              <p className="mt-1 text-2xl font-black">
                {settings?.is_enabled ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="tal-metric-card">
            <span className="tal-metric-icon">
              <Mail size={20} />
            </span>
            <p className="tal-metric-label">Host</p>
            <h2 className="text-xl font-black text-white">
              {settings?.smtp_host || "Sin configurar"}
            </h2>
          </div>

          <div className="tal-metric-card">
            <span className="tal-metric-icon">
              <BellRing size={20} />
            </span>
            <p className="tal-metric-label">Remitente</p>
            <h2 className="text-xl font-black text-white">
              {settings?.from_email || "-"}
            </h2>
          </div>

          <div className="tal-metric-card">
            <span className="tal-metric-icon">
              <ShieldCheck size={20} />
            </span>
            <p className="tal-metric-label">Seguridad</p>
            <h2 className="text-xl font-black text-white">
              {settings?.smtp_secure ? "SSL/TLS" : "STARTTLS/Normal"}
            </h2>
          </div>
        </section>

        <EmailSettingsForm
          settings={
            settings
              ? {
                  id: settings.id,
                  label: settings.label,
                  smtp_host: settings.smtp_host,
                  smtp_port: settings.smtp_port,
                  smtp_secure: settings.smtp_secure,
                  smtp_username: settings.smtp_username,
                  has_password: Boolean(settings.smtp_password),
                  from_name: settings.from_name,
                  from_email: settings.from_email,
                  reply_to: settings.reply_to,
                  is_enabled: settings.is_enabled,
                }
              : null
          }
          adminEmail={profile.email || ""}
        />
      </div>
    </main>
  );
}
