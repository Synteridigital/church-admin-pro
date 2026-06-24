import { EmptyState } from "@/components/ui/states/EmptyState";

export default function FundRequestsPage() {
  return (
    <EmptyState
      icon="HandCoins"
      headline="Fund Requests coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
