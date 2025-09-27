import { FestivalsPage } from "@/components/festivals-page";
import { ProtectedRoute } from "@/components/protected-route";

export default function Festivals() {
  return (
    <ProtectedRoute>
      <FestivalsPage />
    </ProtectedRoute>
  );
}
