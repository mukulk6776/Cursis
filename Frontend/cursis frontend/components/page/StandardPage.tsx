import { AppShell } from "@/components/layout/AppShell";
import { PlaceholderContent } from "@/components/page/PlaceholderContent";

type StandardPageProps = { title: string; actionLabel?: string; breadcrumb?: string };

export function StandardPage({ title, actionLabel, breadcrumb }: StandardPageProps) {
  return (
    <AppShell title={title} actionLabel={actionLabel} breadcrumb={breadcrumb}>
      <PlaceholderContent title={title} />
    </AppShell>
  );
}
