import { AdminGate } from "@/components/admin-gate";
import { Editor } from "@/components/editor/editor";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminGate>
      <Editor id={id} />
    </AdminGate>
  );
}
