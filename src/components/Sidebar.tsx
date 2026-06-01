"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Activity,
  Trophy,
  BarChart3,
  User,
  LogOut,
  UserPlus,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type NavItem = {
  href: string;
  label: string;
  icon: any;
};

const adminNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/athletes", label: "Atletas", icon: Users },
  { href: "/clubs", label: "Clubs", icon: Building2 },
  { href: "/equipment", label: "Equipamiento", icon: Shield },
  { href: "/tuning", label: "Tuning", icon: SlidersHorizontal },
  { href: "/trainings", label: "Entrenamientos", icon: Activity },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/leagues", label: "Liga indoor", icon: Trophy },
  { href: "/conade", label: "CONADE", icon: Trophy },
  { href: "/admin/invitations", label: "Invitaciones", icon: UserPlus },
];

function coachNavItems(clubId: string | null): NavItem[] {
  return [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/athletes", label: "Atletas", icon: Users },
    {
      href: clubId ? `/clubs/${clubId}` : "/",
      label: "Mi club",
      icon: Building2,
    },
    { href: "/equipment", label: "Equipamiento", icon: Shield },
    { href: "/tuning", label: "Tuning", icon: SlidersHorizontal },
    { href: "/trainings", label: "Entrenamientos", icon: Activity },
    { href: "/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/leagues", label: "Liga indoor", icon: Trophy },
  ];
}

export default function Sidebar() {
  const [navItems, setNavItems] = useState<NavItem[]>(adminNavItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNavigation();
  }, []);

  async function loadNavigation() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role, club_id")
      .eq("id", user.id)
      .single();

    if (profile?.role === "coach") {
      setNavItems(coachNavItems(profile.club_id || null));
      setLoading(false);
      return;
    }

    if (profile?.role !== "athlete") {
      setNavItems(adminNavItems);
      setLoading(false);
      return;
    }

    const { data: athlete } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!athlete?.id) {
      setNavItems([
        {
          href: "/athletes/profile",
          label: "Completar perfil",
          icon: User,
        },
      ]);
      setLoading(false);
      return;
    }

    setNavItems([
      {
        href: `/athletes/${athlete.id}`,
        label: "Mi ficha",
        icon: Users,
      },
      {
        href: `/analytics/${athlete.id}`,
        label: "Mis analíticas",
        icon: BarChart3,
      },
      {
        href: `/trainings/athletes/${athlete.id}`,
        label: "Mis entrenamientos",
        icon: Activity,
      },
      {
        href: "/agenda",
        label: "Mi agenda",
        icon: CalendarDays,
      },
      {
        href: "/leagues",
        label: "Liga indoor",
        icon: Trophy,
      },
      {
        href: `/equipment/${athlete.id}`,
        label: "Mi equipo",
        icon: Shield,
      },
      {
        href: `/athletes/profile/${athlete.id}`,
        label: "Mi perfil",
        icon: User,
      },
    ]);

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <aside className="relative hidden min-h-screen w-72 overflow-hidden border-r border-cyan-400/10 bg-slate-950 p-5 text-white shadow-[20px_0_80px_rgba(0,0,0,0.35)] lg:block">
      <div className="absolute -top-24 left-8 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-20 right-[-120px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-8 rounded-[2rem] border border-cyan-400/15 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-xl">
          <Image
            src="/tal.png"
            alt="Tech Archery Lab"
            width={150}
            height={150}
            priority
            className="mx-auto drop-shadow-[0_0_28px_rgba(34,211,238,0.45)]"
          />

          <div className="mt-4 text-center">
            <h1 className="text-2xl font-black leading-tight tracking-tight">
              Tech Archery
              <span className="block tal-text-glow text-cyan-300">Lab</span>
            </h1>

            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.45em] text-cyan-300">
              Performance
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {loading && (
            <p className="rounded-2xl border border-cyan-400/10 bg-white/[0.03] px-4 py-4 text-sm font-bold text-slate-400">
              Cargando menú...
            </p>
          )}

          {!loading &&
            navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-4 font-bold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-lg font-black text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-slate-950">
                    <Icon size={20} />
                  </span>

                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="group mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-400/10 px-4 py-4 font-bold text-red-300 transition hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-red-500/10 hover:text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-lg font-black text-red-300 transition group-hover:bg-red-500 group-hover:text-white">
            <LogOut size={20} />
          </span>

          <span>Cerrar sesión</span>
        </button>

        <div className="mt-10 rounded-[2rem] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-5 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
            TAL System
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Precisión, análisis y rendimiento para atletas de tiro con arco.
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.7)]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
