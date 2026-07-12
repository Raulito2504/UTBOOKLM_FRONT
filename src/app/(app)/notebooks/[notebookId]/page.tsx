import { NotebookWorkspace } from "@/src/features/notebooks/components/notebook-workspace";

interface NotebookPageProps {
  params: Promise<{ notebookId: string }>;
}

export default async function NotebookPage({ params }: NotebookPageProps) {
  const { notebookId } = await params;
  return <NotebookWorkspace notebookId={notebookId} />;
}
