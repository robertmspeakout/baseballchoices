"use client";

import AuthGate from "@/components/AuthGate";
import ProgramsView from "@/components/ProgramsView";

export default function JUCOProgramsPage() {
  return (
    <AuthGate>
      <ProgramsView mode="JUCO" pageTitle="JUCO Programs" activeNavLabel="JUCO Programs" />
    </AuthGate>
  );
}
