import { createClient } from "@/lib/supabase/server";

export default async function DebugSessionPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const { data: profileById, error: profileByIdError } = await supabase
    .from("users")
    .select("id, name, email, role, is_active")
    .eq("id", user?.id || "")
    .maybeSingle();

  const { data: profileByEmail, error: profileByEmailError } = await supabase
    .from("users")
    .select("id, name, email, role, is_active")
    .eq("email", user?.email || "")
    .maybeSingle();

  return (
    <pre className="min-h-screen bg-slate-950 p-6 text-white">
      {JSON.stringify(
        {
          authUserId: user?.id,
          authUserEmail: user?.email,
          authError,
          profileById,
          profileByIdError,
          profileByEmail,
          profileByEmailError,
        },
        null,
        2
      )}
    </pre>
  );
}