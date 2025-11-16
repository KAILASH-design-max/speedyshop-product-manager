import { DealsPage } from "@/components/deals-page";
import { ProtectedRoute } from "@/components/protected-route";

export default function Deals() {
  return (
    <ProtectedRoute>
      <DealsPage />
    </ProtectedRoute>
  );
}
