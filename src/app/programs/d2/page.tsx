"use client";

import AuthGate from "@/components/AuthGate";
import ProgramsView from "@/components/ProgramsView";

export default function D2ProgramsPage() {
  return (
    <AuthGate>
      <ProgramsView mode="D2" pageTitle="Division II Programs" activeNavLabel="DII Programs" />
    </AuthGate>
  );
}
