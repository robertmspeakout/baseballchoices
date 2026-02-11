import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextBase - College Baseball Recruiting Directory",
  description:
    "Search and track college baseball programs across D1, D2, D3 and JUCO. Your personal recruiting companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
