"use client";

import { SessionProvider } from "next-auth/react";
import { SchoolsProvider } from "@/lib/SchoolsContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SchoolsProvider>{children}</SchoolsProvider>
    </SessionProvider>
  );
}
