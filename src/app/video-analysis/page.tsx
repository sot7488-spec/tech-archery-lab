import VideoAnalysisClient from "./VideoAnalysisClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VideoAnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  let athletesQuery = supabase
    .from("athlete_profiles")
    .select(
      `
      id,
      club_id,
      users!athlete_profiles_user_id_fkey (
        name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (currentUser?.role === "coach" && currentUser.club_id) {
    athletesQuery = athletesQuery.eq("club_id", currentUser.club_id);
  }

  if (currentUser?.role === "athlete") {
    athletesQuery = athletesQuery.eq("user_id", user.id);
  }

  const { data: athletes } = await athletesQuery;

  return (
    <VideoAnalysisClient
      athletes={athletes || []}
      canCreateFeedback={
        currentUser?.role === "admin" || currentUser?.role === "coach"
      }
    />
  );
}
