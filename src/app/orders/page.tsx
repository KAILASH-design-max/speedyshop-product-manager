
import { OrdersPage } from "@/components/orders-page";
import { ProtectedRoute } from "@/components/protected-route";

export default function Orders() {
  return (
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  );
}
