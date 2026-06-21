import { createFileRoute } from "@tanstack/react-router";
import { DefterimProvider, useDefterim } from "@/lib/defterim-store";
import { Sidebar } from "@/components/defterim/Sidebar";
import { Editor } from "@/components/defterim/Editor";
import { Dashboard } from "@/components/defterim/Dashboard";
import { Schedule } from "@/components/defterim/Schedule";
import { Submissions } from "@/components/defterim/Submissions";

export const Route = createFileRoute("/_authenticated/depderim")({
  head: () => ({
    meta: [
      { title: "Depderim — Sanly depderiňiz" },
      { name: "description", content: "Talyplar üçin sada we dykgaty bölmeýän sanly depder." },
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
  const { selectedNoteId, view } = useDefterim();
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {selectedNoteId
          ? <Editor noteId={selectedNoteId} />
          : view === "schedule"
          ? <Schedule />
          : view === "submissions"
          ? <Submissions />
          : <Dashboard />}
      </main>
    </div>
  );
}
