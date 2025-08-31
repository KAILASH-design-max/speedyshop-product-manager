import { SuppliersPage } from "@/components/suppliers-page";
import { ProtectedRoute } from "@/components/protected-route";

export default function Suppliers() {
  return (
    <ProtectedRoute>
      <SuppliersPage />
    </ProtectedRoute>
  );
}
