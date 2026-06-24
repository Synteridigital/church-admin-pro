import { EmptyState } from "@/components/ui/states/EmptyState";

export default function ResourcesPage() {
  return (
    <EmptyState
      icon="BookOpen"
      headline="Resource Center coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
