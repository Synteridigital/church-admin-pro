import { EmptyState } from "@/components/ui/states/EmptyState";

export default function OrderOfServicePage() {
  return (
    <EmptyState
      icon="ListOrdered"
      headline="Order of Service coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
