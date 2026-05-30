"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/register/");

  return (
    <div className="flex min-h-screen bg-slate-950">
      {!hideSidebar && <Sidebar />}

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
