import { EmptyState } from "@/components/ui/states/EmptyState";

export default function BudgetsPage() {
  return (
    <EmptyState
      icon="ChartPie"
      headline="Budgets coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
