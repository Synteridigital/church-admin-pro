import { EmptyState } from "@/components/ui/states/EmptyState";

export default function SupportPage() {
  return (
    <EmptyState
      icon="LifeBuoy"
      headline="Support coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
