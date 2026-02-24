"use client";

import AuthGate from "@/components/AuthGate";
import ProgramsView from "@/components/ProgramsView";

export default function D3ProgramsPage() {
  return (
    <AuthGate>
      <ProgramsView mode="D3" pageTitle="Division III Programs" activeNavLabel="DIII Programs" />
    </AuthGate>
  );
}
