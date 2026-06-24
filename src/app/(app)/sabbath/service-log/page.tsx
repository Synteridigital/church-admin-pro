import { EmptyState } from "@/components/ui/states/EmptyState";

export default function ServiceLogPage() {
  return (
    <EmptyState
      icon="ClipboardList"
      headline="Service Log coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
