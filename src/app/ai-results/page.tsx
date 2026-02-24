"use client";

import { Suspense } from "react";
import AuthGate from "@/components/AuthGate";
import ProgramsView from "@/components/ProgramsView";

function AIResultsContent() {
  return <ProgramsView mode="ai" pageTitle="AI Scout Results" activeNavLabel="AI Scout" />;
}

export default function AIResultsPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
          </div>
        }
      >
        <AIResultsContent />
      </Suspense>
    </AuthGate>
  );
}
