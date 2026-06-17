import "server-only";

import nodemailer from "nodemailer";

export type EmailSettings = {
  id?: string;
  label?: string | null;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string | null;
  smtp_password: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  is_enabled: boolean;
};

type SupabaseClientLike = {
  from: (table: string) => any;
};

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function getEnabledEmailSettings(supabase: SupabaseClientLike) {
  const { data, error } = await supabase
    .from("notification_email_settings")
    .select("*")
    .eq("is_enabled", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function sendMailWithSettings(
  settings: EmailSettings,
  payload: MailPayload
) {
  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: Number(settings.smtp_port),
    secure: settings.smtp_secure,
    auth:
      settings.smtp_username && settings.smtp_password
        ? {
            user: settings.smtp_username,
            pass: settings.smtp_password,
          }
        : undefined,
  });

  await transporter.sendMail({
    from: `"${settings.from_name}" <${settings.from_email}>`,
    to: payload.to,
    replyTo: settings.reply_to || settings.from_email,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

export async function sendStaffInvitationEmail({
  supabase,
  email,
  inviteUrl,
  role,
  clubName,
}: {
  supabase: SupabaseClientLike;
  email: string;
  inviteUrl: string;
  role: string;
  clubName?: string | null;
}) {
  const settings = await getEnabledEmailSettings(supabase);

  if (!settings) {
    return {
      sent: false,
      message: "Invitacion creada, pero SMTP no esta configurado.",
    };
  }

  const roleLabel =
    role === "coach"
      ? "coach"
      : role === "sports_psychologist"
        ? "psicologo deportivo"
        : "administrador";
  const subject = "Invitacion a Tech Archery Lab";
  const clubLine = clubName ? `Club asignado: ${clubName}` : "Acceso administrativo";
  const text = [
    "Hola,",
    "",
    `Te invitaron a registrarte en Tech Archery Lab como ${roleLabel}.`,
    clubLine,
    "",
    `Acepta la invitacion aqui: ${inviteUrl}`,
    "",
    "Este enlace expira en 7 dias.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#020617;color:#e2e8f0;padding:32px">
      <div style="max-width:620px;margin:0 auto;border:1px solid rgba(34,211,238,.22);border-radius:24px;padding:28px;background:#0f172a">
        <p style="margin:0 0 10px;color:#67e8f9;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase">Tech Archery Lab</p>
        <h1 style="margin:0;color:#fff;font-size:30px">Invitacion de acceso</h1>
        <p style="line-height:1.7;color:#cbd5e1">Te invitaron a registrarte como <strong style="color:#fff">${roleLabel}</strong>.</p>
        <p style="line-height:1.7;color:#cbd5e1">${clubLine}</p>
        <a href="${inviteUrl}" style="display:inline-block;margin-top:14px;background:#22d3ee;color:#020617;text-decoration:none;font-weight:900;padding:14px 20px;border-radius:16px">Aceptar invitacion</a>
        <p style="margin-top:22px;color:#94a3b8;font-size:13px">Este enlace expira en 7 dias. Si no esperabas esta invitacion, puedes ignorar este correo.</p>
      </div>
    </div>
  `;

  await sendMailWithSettings(settings, {
    to: email,
    subject,
    text,
    html,
  });

  return { sent: true, message: "Correo de invitacion enviado." };
}
