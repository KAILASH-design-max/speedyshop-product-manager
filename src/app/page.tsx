import { InventoryDashboard } from "@/components/inventory-dashboard";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";

export default function Home() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <InventoryDashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}
