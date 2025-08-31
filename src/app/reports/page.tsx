import { ReportsPage } from "@/components/reports-page";
import { ProtectedRoute } from "@/components/protected-route";

export default function Reports() {
  return (
    <ProtectedRoute>
      <ReportsPage />
    </ProtectedRoute>
  );
}
