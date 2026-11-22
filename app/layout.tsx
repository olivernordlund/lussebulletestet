import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lussebulletestet",
  description: "Rösta på årets bästa lussebulle",
  icons: { icon: "/lussebulle.svg", apple: "/lussebulle.svg" },
  appleWebApp: { capable: true, title: "Lussebullar", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
