"use client";

import AuthGate from "@/components/AuthGate";
import ProgramsView from "@/components/ProgramsView";

export default function MyListPage() {
  return (
    <AuthGate>
      <ProgramsView mode="mylist" pageTitle="My Top Programs" activeNavLabel="My Top Programs" />
    </AuthGate>
  );
}
