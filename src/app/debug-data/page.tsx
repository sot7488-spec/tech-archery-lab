import { createClient } from "@/lib/supabase/server";

export default async function DebugDataPage() {
  const supabase = await createClient();

  const athletes = await supabase
    .from("athlete_profiles")
    .select("*", { count: "exact" });

  const trainings = await supabase
    .from("training_sessions")
    .select("*", { count: "exact" });

  const users = await supabase
    .from("users")
    .select("*");

  return (
    <pre className="min-h-screen bg-slate-950 p-6 text-white">
      {JSON.stringify(
        {
          athletesCount: athletes.count,
          athletesData: athletes.data,
          athletesError: athletes.error,

          trainingsCount: trainings.count,
          trainingsData: trainings.data,
          trainingsError: trainings.error,

          usersData: users.data,
          usersError: users.error,
        },
        null,
        2
      )}
    </pre>
  );
}