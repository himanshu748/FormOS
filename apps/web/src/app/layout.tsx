import "./globals.css";
import "@formos/ui/styles.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { AppTaskbar } from "@/components/app-taskbar";

export const metadata: Metadata = {
  title: "FormOS — a form builder with a retro soul",
  description:
    "Build, publish, and analyze forms in a playful Windows-95-flavored workspace. Powered by Next.js, tRPC, Drizzle and PostgreSQL.",
};

export const viewport: Viewport = {
  themeColor: "#128a8a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TRPCProvider>
          {children}
          <AppTaskbar />
        </TRPCProvider>
      </body>
    </html>
  );
}
