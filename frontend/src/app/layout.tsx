/**
 * Root layout registers the global providers.
 *
 * NOTE (scope): the spec Folder Tree wants (Query, Auth, FCM, Theme).
 * FCM + Theme providers are intentionally NOT built yet - they belong to
 * the notifications/UI phases and adding them now would be scope creep.
 */
import { Kanit } from "next/font/google";
import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import "./globals.css";

// Brand font: Kanit (supports Thai + Latin). Self-hosted by next/font.
const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WellTrip",
  description: "Smart Wellness Tourism Platform for Community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={kanit.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
