import { InventoryDashboard } from "@/components/inventory-dashboard";
import { ProtectedRoute } from "@/components/protected-route";

export default function Home() {
  return (
    <ProtectedRoute>
      <InventoryDashboard />
    </ProtectedRoute>
  );
}
