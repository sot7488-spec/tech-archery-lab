"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  BarChart3,
  Brain,
  Building2,
  CalendarDays,
  ChevronDown,
  CopyPlus,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Mail,
  ScanLine,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  SlidersHorizontal,
  Trophy,
  User,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

const adminNavSections: NavSection[] = [
  {
    id: "principal",
    label: "Principal",
    defaultOpen: true,
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/video-analysis", label: "Video analisis", icon: ScanLine },
      { href: "/video-analysis-v2", label: "Video analisis V2", icon: ScanLine },
      { href: "/video-analysis-v3", label: "Video analisis V3", icon: ScanLine },
      { href: "/agenda", label: "Agenda", icon: CalendarDays },
    ],
  },
  {
    id: "operacion",
    label: "Operacion",
    defaultOpen: true,
    items: [
      { href: "/athletes", label: "Atletas", icon: Users },
      { href: "/clubs", label: "Clubs", icon: Building2 },
      { href: "/trainings", label: "Entrenamientos", icon: Activity },
      { href: "/training-templates", label: "Plantillas", icon: CopyPlus },
      { href: "/equipment", label: "Equipamiento", icon: Shield },
      { href: "/tuning", label: "Tuning", icon: SlidersHorizontal },
    ],
  },
  {
    id: "rendimiento",
    label: "Rendimiento",
    items: [
      { href: "/conditioning", label: "Fisico", icon: Dumbbell },
      { href: "/psychology", label: "Psicologia", icon: Brain },
      { href: "/leagues", label: "Liga indoor", icon: Trophy },
      { href: "/conade", label: "CONADE", icon: Trophy },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    items: [
      { href: "/admin/invitations", label: "Invitaciones", icon: UserPlus },
      { href: "/admin/notifications", label: "SMTP", icon: Mail },
    ],
  },
];

function coachNavSections(clubId: string | null): NavSection[] {
  return [
    {
      id: "principal",
      label: "Principal",
      defaultOpen: true,
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/video-analysis", label: "Video analisis", icon: ScanLine },
        { href: "/video-analysis-v2", label: "Video analisis V2", icon: ScanLine },
        { href: "/video-analysis-v3", label: "Video analisis V3", icon: ScanLine },
        { href: "/agenda", label: "Agenda", icon: CalendarDays },
      ],
    },
    {
      id: "operacion",
      label: "Operacion",
      defaultOpen: true,
      items: [
        { href: "/athletes", label: "Atletas", icon: Users },
        {
          href: clubId ? `/clubs/${clubId}` : "/",
          label: "Mi club",
          icon: Building2,
        },
        { href: "/trainings", label: "Entrenamientos", icon: Activity },
        { href: "/training-templates", label: "Plantillas", icon: CopyPlus },
        { href: "/equipment", label: "Equipamiento", icon: Shield },
        { href: "/tuning", label: "Tuning", icon: SlidersHorizontal },
      ],
    },
    {
      id: "rendimiento",
      label: "Rendimiento",
      items: [
        { href: "/conditioning", label: "Fisico", icon: Dumbbell },
        { href: "/psychology", label: "Psicologia", icon: Brain },
        { href: "/leagues", label: "Liga indoor", icon: Trophy },
      ],
    },
  ];
}

function psychologistNavSections(): NavSection[] {
  return [
    {
      id: "mental",
      label: "Psicologia",
      defaultOpen: true,
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/psychology", label: "Psicologia", icon: Brain },
        { href: "/athletes", label: "Atletas", icon: Users },
        { href: "/agenda", label: "Agenda", icon: CalendarDays },
      ],
    },
  ];
}

function athleteNavSections(athleteId: string): NavSection[] {
  return [
    {
      id: "mi-portal",
      label: "Mi portal",
      defaultOpen: true,
      items: [
        { href: `/athletes/${athleteId}`, label: "Mi ficha", icon: Users },
        {
          href: `/analytics/${athleteId}`,
          label: "Mis analiticas",
          icon: BarChart3,
        },
        {
          href: `/trainings/athletes/${athleteId}`,
          label: "Mis entrenamientos",
          icon: Activity,
        },
        { href: "/agenda", label: "Mi agenda", icon: CalendarDays },
        { href: "/leagues", label: "Liga indoor", icon: Trophy },
        { href: `/equipment/${athleteId}`, label: "Mi equipo", icon: Shield },
        { href: `/athletes/profile/${athleteId}`, label: "Mi perfil", icon: User },
      ],
    },
  ];
}

function getInitialOpenSections(sections: NavSection[]) {
  return sections.reduce<Record<string, boolean>>((acc, section) => {
    acc[section.id] = Boolean(section.defaultOpen);
    return acc;
  }, {});
}

export default function Sidebar() {
  const pathname = usePathname();
  const [navSections, setNavSections] =
    useState<NavSection[]>(adminNavSections);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    getInitialOpenSections(adminNavSections)
  );
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const flatItems = useMemo(
    () => navSections.flatMap((section) => section.items),
    [navSections]
  );

  useEffect(() => {
    loadNavigation();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function applySections(sections: NavSection[]) {
    setNavSections(sections);
    setOpenSections((current) => {
      const next = getInitialOpenSections(sections);

      sections.forEach((section) => {
        if (current[section.id] !== undefined) {
          next[section.id] = current[section.id];
        }
      });

      return next;
    });
  }

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
      applySections(coachNavSections(profile.club_id || null));
      setLoading(false);
      return;
    }

    if (profile?.role === "sports_psychologist") {
      applySections(psychologistNavSections());
      setLoading(false);
      return;
    }

    if (profile?.role !== "athlete") {
      applySections(adminNavSections);
      setLoading(false);
      return;
    }

    const { data: athlete } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!athlete?.id) {
      applySections([
        {
          id: "perfil",
          label: "Perfil",
          defaultOpen: true,
          items: [
            {
              href: "/athletes/profile",
              label: "Completar perfil",
              icon: User,
            },
          ],
        },
      ]);
      setLoading(false);
      return;
    }

    applySections(athleteNavSections(athlete.id));
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function toggleSection(sectionId: string) {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-cyan-400/10 bg-slate-950/92 px-4 py-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/tal.png"
              alt="Tech Archery Lab"
              width={42}
              height={42}
              priority
              className="drop-shadow-[0_0_18px_rgba(34,211,238,0.42)]"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-black leading-tight">
                Tech Archery Lab
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Performance
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition active:scale-95"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm"
            aria-label="Cerrar menu"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col overflow-hidden border-r border-cyan-400/15 bg-slate-950 p-4 text-white shadow-[24px_0_80px_rgba(0,0,0,0.55)]">
            <div className="absolute -top-24 left-8 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-20 right-[-120px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.4rem] border border-cyan-400/15 bg-white/[0.03] p-3 shadow-2xl backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src="/tal.png"
                    alt="Tech Archery Lab"
                    width={48}
                    height={48}
                    priority
                    className="drop-shadow-[0_0_22px_rgba(34,211,238,0.42)]"
                  />
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-black leading-tight">
                      Tech Archery Lab
                    </h1>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.32em] text-cyan-300">
                      Menu
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
                  aria-label="Cerrar menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.45)_transparent]">
                {loading && (
                  <p className="rounded-2xl border border-cyan-400/10 bg-white/[0.03] px-4 py-4 text-sm font-bold text-slate-400">
                    Cargando menu...
                  </p>
                )}

                {!loading &&
                  navSections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-[1.3rem] border border-white/5 bg-white/[0.025] p-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 transition hover:bg-white/[0.04] hover:text-cyan-300"
                      >
                        <span>{section.label}</span>
                        <ChevronDown
                          size={16}
                          className={
                            openSections[section.id]
                              ? "text-cyan-300 transition"
                              : "-rotate-90 text-slate-500 transition"
                          }
                        />
                      </button>

                      {openSections[section.id] && (
                        <div className="mt-1 space-y-1">
                          {section.items.map((item) => (
                            <NavLink
                              key={item.href}
                              item={item}
                              active={isActive(item.href)}
                              onNavigate={() => setMobileOpen(false)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="group mt-3 flex w-full items-center gap-3 rounded-2xl border border-red-400/10 px-3 py-3 font-bold text-red-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300 transition group-hover:bg-red-500 group-hover:text-white">
                  <LogOut size={18} />
                </span>
                <span>Cerrar sesion</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside
        className={
          compact
            ? "relative hidden min-h-screen w-24 overflow-hidden border-r border-cyan-400/10 bg-slate-950 p-4 text-white shadow-[20px_0_80px_rgba(0,0,0,0.35)] transition-all duration-300 lg:block"
            : "relative hidden min-h-screen w-72 overflow-hidden border-r border-cyan-400/10 bg-slate-950 p-4 text-white shadow-[20px_0_80px_rgba(0,0,0,0.35)] transition-all duration-300 lg:block"
        }
      >
      <div className="absolute -top-24 left-8 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-20 right-[-120px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 flex h-screen flex-col">
        <div
          className={
            compact
              ? "mb-4 flex items-center justify-center rounded-[1.4rem] border border-cyan-400/15 bg-white/[0.03] p-3 shadow-2xl backdrop-blur-xl"
              : "mb-4 rounded-[1.6rem] border border-cyan-400/15 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-xl"
          }
        >
          <div className="flex items-center gap-3">
            <Image
              src="/tal.png"
              alt="Tech Archery Lab"
              width={compact ? 46 : 58}
              height={compact ? 46 : 58}
              priority
              className="drop-shadow-[0_0_22px_rgba(34,211,238,0.42)]"
            />

            {!compact && (
              <div>
                <h1 className="text-lg font-black leading-tight tracking-tight">
                  Tech Archery
                  <span className="block tal-text-glow text-cyan-300">Lab</span>
                </h1>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.35em] text-cyan-300">
                  Performance
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCompact((current) => !current)}
          className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/10 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200 transition hover:border-cyan-300/30 hover:bg-cyan-400 hover:text-slate-950"
          title={compact ? "Expandir menu" : "Compactar menu"}
        >
          {compact ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!compact && <span>Compactar</span>}
        </button>

        <div className="mb-3">
          <ThemeToggle compact={compact} />
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.45)_transparent]">
          {loading && (
            <p className="rounded-2xl border border-cyan-400/10 bg-white/[0.03] px-4 py-4 text-sm font-bold text-slate-400">
              {compact ? "..." : "Cargando menu..."}
            </p>
          )}

          {!loading && compact && (
            <div className="space-y-2">
              {flatItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  compact
                />
              ))}
            </div>
          )}

          {!loading &&
            !compact &&
            navSections.map((section) => (
              <div
                key={section.id}
                className="rounded-[1.3rem] border border-white/5 bg-white/[0.025] p-2"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 transition hover:bg-white/[0.04] hover:text-cyan-300"
                >
                  <span>{section.label}</span>
                  <ChevronDown
                    size={16}
                    className={
                      openSections[section.id]
                        ? "text-cyan-300 transition"
                        : "-rotate-90 text-slate-500 transition"
                    }
                  />
                </button>

                {openSections[section.id] && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className={
            compact
              ? "group mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-red-400/10 text-red-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-white"
              : "group mt-3 flex w-full items-center gap-3 rounded-2xl border border-red-400/10 px-3 py-3 font-bold text-red-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-white"
          }
          title="Cerrar sesion"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300 transition group-hover:bg-red-500 group-hover:text-white">
            <LogOut size={18} />
          </span>

          {!compact && <span>Cerrar sesion</span>}
        </button>
      </div>
      </aside>
    </>
  );
}

function NavLink({
  item,
  active,
  compact = false,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onNavigate}
      className={
        compact
          ? active
            ? "group flex h-12 w-full items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)]"
            : "group flex h-12 w-full items-center justify-center rounded-2xl border border-transparent text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white"
          : active
            ? "group flex items-center gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-3 py-3 font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.12)]"
            : "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 font-bold text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white"
      }
    >
      <span
        className={
          active
            ? "flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400 text-slate-950"
            : "flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-slate-950"
        }
      >
        <Icon size={18} />
      </span>

      {!compact && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
