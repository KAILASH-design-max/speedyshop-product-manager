
import { PurchaseOrdersPage } from "@/components/purchase-orders-page";
import { ProtectedRoute } from "@/components/protected-route";

export default function PurchaseOrders() {
  return (
    <ProtectedRoute>
      <PurchaseOrdersPage />
    </ProtectedRoute>
  );
}
