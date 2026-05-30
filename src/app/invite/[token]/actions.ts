"use server";

import { hashInvitationToken } from "@/lib/invitations";
import { createClient } from "@/lib/supabase/server";

type AcceptInvitationState = {
  error?: string;
  success?: string;
};

export async function acceptStaffInvitation(
  _state: AcceptInvitationState,
  formData: FormData
): Promise<AcceptInvitationState> {
  const token = String(formData.get("token") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");

  if (!token) return { error: "La invitación no es válida." };
  if (!name) return { error: "Escribe tu nombre completo." };
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const tokenHash = hashInvitationToken(token);

  const { data: invitation, error: invitationError } = await supabase
    .from("staff_invitations")
    .select("id, email, role, club_id, expires_at, accepted_at")
    .eq("token_hash", tokenHash)
    .single();

  if (invitationError || !invitation) {
    return { error: "La invitación no existe o ya no es válida." };
  }

  if (invitation.accepted_at) {
    return { error: "Esta invitación ya fue utilizada." };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "Esta invitación expiró." };
  }

  if (invitation.role === "coach" && !invitation.club_id) {
    return { error: "La invitación de coach no tiene club asignado." };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: {
      data: {
        name,
        role: invitation.role,
        club_id: invitation.club_id,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  const authUser = authData.user;

  if (!authUser) {
    return { error: "No se pudo crear el usuario en Auth." };
  }

  const { error: userError } = await supabase.from("users").insert({
    id: authUser.id,
    name,
    email: invitation.email,
    role: invitation.role,
    club_id: invitation.club_id,
    is_active: true,
  });

  if (userError) {
    return { error: userError.message };
  }

  if (invitation.role === "coach") {
    const { error: coachError } = await supabase.from("coach_profiles").insert({
      user_id: authUser.id,
      club_id: invitation.club_id,
      is_active: true,
    });

    if (coachError) {
      return { error: coachError.message };
    }
  }

  const { error: acceptError } = await supabase
    .from("staff_invitations")
    .update({
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  if (acceptError) {
    return { error: acceptError.message };
  }

  return {
    success: "Cuenta creada correctamente. Ya puedes iniciar sesión.",
  };
}
