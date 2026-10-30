import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KelvJessia Transport | Travel with confidence",
  description: "A safe, simple way to plan your next journey.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
