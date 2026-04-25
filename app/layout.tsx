import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ditch Marketing OS",
  description: "Internal marketing OS for the Ditch team.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
