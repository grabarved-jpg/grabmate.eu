import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arvegeneraator",
  description: "Lihtne Eesti arvegeneraator Äriregistri autocomplete'iga."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="et">
      <body>{children}</body>
    </html>
  );
}
