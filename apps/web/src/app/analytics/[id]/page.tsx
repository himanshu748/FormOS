import { AdminGate } from "@/components/admin-gate";
import { AnalyticsView } from "@/components/analytics-view";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminGate>
      <AnalyticsView formId={id} />
    </AdminGate>
  );
}
