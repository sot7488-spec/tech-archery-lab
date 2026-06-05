"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEnabledEmailSettings, sendMailWithSettings } from "@/lib/mail";

type NotificationState = {
  error?: string;
  success?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("users")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Solo admin puede configurar notificaciones.");
  }

  return { supabase, user, profile };
}

export async function saveEmailSettings(
  _state: NotificationState,
  formData: FormData
): Promise<NotificationState> {
  try {
    const { supabase } = await requireAdmin();

    const existingId = String(formData.get("id") || "");
    const newPassword = String(formData.get("smtp_password") || "");
    const smtpHost = String(formData.get("smtp_host") || "").trim();
    const smtpPort = Number(formData.get("smtp_port") || 587);
    const fromEmail = String(formData.get("from_email") || "").trim();
    const fromName = String(formData.get("from_name") || "Tech Archery Lab").trim();

    if (!smtpHost) return { error: "El host SMTP es obligatorio." };
    if (!fromEmail) return { error: "El correo remitente es obligatorio." };
    if (!smtpPort || smtpPort < 1 || smtpPort > 65535) {
      return { error: "El puerto SMTP no es valido." };
    }

    let smtpPassword: string | null = newPassword || null;

    if (existingId && !smtpPassword) {
      const { data: existingSettings, error: existingError } = await supabase
        .from("notification_email_settings")
        .select("smtp_password")
        .eq("id", existingId)
        .maybeSingle();

      if (existingError) return { error: existingError.message };
      smtpPassword = existingSettings?.smtp_password || null;
    }

    const payload = {
      label: String(formData.get("label") || "Principal").trim() || "Principal",
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_secure: formData.get("smtp_secure") === "on",
      smtp_username: String(formData.get("smtp_username") || "").trim() || null,
      smtp_password: smtpPassword,
      from_name: fromName,
      from_email: fromEmail,
      reply_to: String(formData.get("reply_to") || "").trim() || null,
      is_enabled: formData.get("is_enabled") === "on",
      updated_at: new Date().toISOString(),
    };

    const { error } = existingId
      ? await supabase
          .from("notification_email_settings")
          .update(payload)
          .eq("id", existingId)
      : await supabase.from("notification_email_settings").insert(payload);

    if (error) return { error: error.message };

    revalidatePath("/admin/notifications");
    return { success: "Configuracion SMTP guardada." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la configuracion SMTP.",
    };
  }
}

export async function sendTestEmail(
  _state: NotificationState,
  formData: FormData
): Promise<NotificationState> {
  try {
    const { supabase, profile } = await requireAdmin();
    const to = String(formData.get("test_email") || profile.email || "").trim();

    if (!to) return { error: "Captura un correo destino para la prueba." };

    const settings = await getEnabledEmailSettings(supabase);

    if (!settings) {
      return { error: "Primero guarda y activa una configuracion SMTP." };
    }

    await sendMailWithSettings(settings, {
      to,
      subject: "Prueba SMTP TAL",
      text: "Tu configuracion SMTP de Tech Archery Lab esta funcionando.",
      html: `
        <div style="font-family:Arial,sans-serif;background:#020617;color:#e2e8f0;padding:28px">
          <div style="max-width:560px;margin:auto;border:1px solid rgba(34,211,238,.22);border-radius:22px;background:#0f172a;padding:24px">
            <p style="color:#67e8f9;font-weight:900;letter-spacing:3px;text-transform:uppercase;font-size:12px">Tech Archery Lab</p>
            <h1 style="color:white;margin:0">SMTP listo</h1>
            <p style="line-height:1.7;color:#cbd5e1">Tu configuracion de correo para notificaciones esta funcionando.</p>
          </div>
        </div>
      `,
    });

    return { success: `Correo de prueba enviado a ${to}.` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo enviar el correo de prueba.",
    };
  }
}
