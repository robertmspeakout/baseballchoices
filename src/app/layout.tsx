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
  title: {
    default: "ExtraBase - College Baseball Recruiting Directory",
    template: "%s | ExtraBase",
  },
  description:
    "Search and track 1,800+ college baseball programs across D1, D2, D3 and JUCO. Rate your favorites, get AI-powered matches, and build your personalized recruiting list.",
  keywords: [
    "college baseball recruiting",
    "college baseball directory",
    "D1 baseball programs",
    "D2 baseball programs",
    "D3 baseball programs",
    "JUCO baseball",
    "baseball recruiting",
    "college baseball search",
    "baseball program finder",
    "college baseball rankings",
    "baseball recruiting tool",
    "high school baseball recruiting",
  ],
  authors: [{ name: "ExtraBase" }],
  creator: "ExtraBase",
  publisher: "ExtraBase",
  metadataBase: new URL("https://extrabase.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://extrabase.app",
    siteName: "ExtraBase",
    title: "ExtraBase - College Baseball Recruiting Directory",
    description:
      "Search and track 1,800+ college baseball programs across D1, D2, D3 and JUCO. Rate your favorites, get AI-powered matches, and build your personalized recruiting list.",
  },
  twitter: {
    card: "summary",
    title: "ExtraBase - College Baseball Recruiting Directory",
    description:
      "Search and track 1,800+ college baseball programs. Rate favorites, get AI matches, and build your recruiting list.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
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
