import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tech Archery Lab",
  description: "Sistema de gestión deportiva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('tal-theme') === 'light' ? 'light' : 'dark';
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (error) {
                  document.documentElement.dataset.theme = 'dark';
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
