import EditorScreen from "@/components/editor/EditorScreen";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <EditorScreen projectId={projectId} />;
}
