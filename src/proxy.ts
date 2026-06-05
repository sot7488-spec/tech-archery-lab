import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user) {
    if (pathname !== "/login" && pathname !== "/register") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "athlete") {
    return response;
  }

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!athlete?.id) {
    return response;
  }

  const exactAllowedAthleteRoutes = ["/agenda", "/analytics"];

  const allowedAthleteRoutes = [
    `/athletes/${athlete.id}`,
    `/athletes/profile/${athlete.id}`,
    `/analytics/${athlete.id}`,
    `/equipment/${athlete.id}`,
    "/leagues",
    `/trainings/athletes/${athlete.id}`,
  ];

  const isAllowed =
    exactAllowedAthleteRoutes.includes(pathname) ||
    allowedAthleteRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

  if (!isAllowed) {
    return NextResponse.redirect(
      new URL(`/athletes/${athlete.id}`, request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/agenda/:path*",
    "/analytics/:path*",
    "/athletes/:path*",
    "/clubs/:path*",
    "/conade/:path*",
    "/conditioning/:path*",
    "/equipment/:path*",
    "/leagues/:path*",
    "/psychology/:path*",
    "/tuning/:path*",
    "/trainings/:path*",
  ],
};
