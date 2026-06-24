import { EmptyState } from "@/components/ui/states/EmptyState";

export default function MembersPage() {
  return (
    <EmptyState
      icon="Users"
      headline="Member Directory coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
