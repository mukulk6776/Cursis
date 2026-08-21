import { AppShell } from "@/components/layout/AppShell";
import { WebBuilderEditor } from "@/components/web-builder/WebBuilderEditor";

export default function WebBuilderPage() {
  return (
    <AppShell title="Web Builder" actionLabel="Website settings">
      <WebBuilderEditor />
    </AppShell>
  );
}
