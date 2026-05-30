"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createInvitationToken,
  hashInvitationToken,
} from "@/lib/invitations";

type InvitationState = {
  error?: string;
  inviteUrl?: string;
};

export async function createStaffInvitation(
  _state: InvitationState,
  formData: FormData
): Promise<InvitationState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Inicia sesión para crear invitaciones." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Solo un admin puede crear invitaciones." };
  }

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") || "").trim();
  const clubId = String(formData.get("club_id") || "").trim();

  if (!email) return { error: "El correo es obligatorio." };
  if (role !== "coach" && role !== "admin") {
    return { error: "Rol de invitación no permitido." };
  }
  if (role === "coach" && !clubId) {
    return { error: "Un coach debe pertenecer a un club." };
  }

  const token = createInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("staff_invitations").insert({
    email,
    role,
    club_id: clubId || null,
    token_hash: tokenHash,
    invited_by: user.id,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";
  const baseUrl = host ? `${protocol}://${host}` : "";

  revalidatePath("/admin/invitations");

  return {
    inviteUrl: `${baseUrl}/invite/${token}`,
  };
}
