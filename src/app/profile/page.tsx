import { UserProfilePage } from "@/components/user-profile-page";
import { ProtectedRoute } from "@/components/protected-route";

export default function Profile() {
  return (
    <ProtectedRoute>
      <UserProfilePage />
    </ProtectedRoute>
  );
}
