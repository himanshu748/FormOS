import { AdminGate } from "@/components/admin-gate";
import { DesktopDashboard } from "@/components/desktop-dashboard";

export default function HomePage() {
  return (
    <AdminGate>
      <DesktopDashboard />
    </AdminGate>
  );
}
