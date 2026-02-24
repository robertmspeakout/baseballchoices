"use client";

import AuthGate from "@/components/AuthGate";
import ProgramsView from "@/components/ProgramsView";

export default function D1ProgramsPage() {
  return (
    <AuthGate>
      <ProgramsView mode="D1" pageTitle="Division I Programs" activeNavLabel="DI Programs" />
    </AuthGate>
  );
}
