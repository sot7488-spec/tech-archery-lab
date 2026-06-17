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
    <div className="flex min-h-screen bg-background">
      {!hideSidebar && <Sidebar />}

      <main
        className={
          hideSidebar
            ? "flex-1 overflow-hidden"
            : "flex-1 overflow-hidden pt-[74px] lg:pt-0"
        }
      >
        {children}
      </main>
    </div>
  );
}
