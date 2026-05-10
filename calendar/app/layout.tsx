import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Caveat, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const dm = DM_Sans({
  variable: "--font-dm",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  weight: ["500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ditch Content Calendar",
  description:
    "Marketing content calendar for Ditch Hospitality Group — May 2026 to June 2027.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${dm.variable} ${caveat.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
