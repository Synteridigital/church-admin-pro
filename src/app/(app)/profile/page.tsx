import { EmptyState } from "@/components/ui/states/EmptyState";

export default function ProfilePage() {
  return (
    <EmptyState
      icon="CircleUser"
      headline="My Profile coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
