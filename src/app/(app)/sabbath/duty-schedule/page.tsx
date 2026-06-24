import { EmptyState } from "@/components/ui/states/EmptyState";

export default function DutySchedulePage() {
  return (
    <EmptyState
      icon="CalendarClock"
      headline="Duty Schedule coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
