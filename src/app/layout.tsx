import type { Metadata } from "next";
import { Permanent_Marker } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ExtraBase - College Baseball Recruiting Directory",
  description:
    "Search and track college baseball programs across D1, D2, D3 and JUCO. Your college baseball recruiting personal assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ "--font-marker": permanentMarker.style.fontFamily } as React.CSSProperties}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
