import { createFileRoute } from "@tanstack/react-router";
import { DefterimProvider, useDefterim } from "@/lib/defterim-store";
import { Sidebar } from "@/components/defterim/Sidebar";
import { Editor } from "@/components/defterim/Editor";
import { Dashboard } from "@/components/defterim/Dashboard";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Defterim — Your Digital Notebook" },
      { name: "description", content: "A minimal, distraction-free digital notebook for university and school students." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <DefterimProvider>
      <Shell />
    </DefterimProvider>
  );
}

function Shell() {
  const { selectedNoteId } = useDefterim();
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {selectedNoteId ? <Editor noteId={selectedNoteId} /> : <Dashboard />}
      </main>
    </div>
  );
}
