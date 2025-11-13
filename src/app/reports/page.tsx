"use client";

import { ReportsDashboard } from "@/components/reports-dashboard";
import { ProtectedRoute } from "@/components/protected-route";

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsDashboard />
    </ProtectedRoute>
  );
}
