import { AppShell } from "@/components/layout/AppShell";
import { WebBuilderEditor } from "@/components/web-builder/WebBuilderEditor";

export default function EditorPage() {
  return (
    <AppShell title="Web Builder Editor" actionLabel="Website settings" breadcrumb="Cursis / Web Builder">
      <WebBuilderEditor />
    </AppShell>
  );
}
