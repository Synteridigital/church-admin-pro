import { EmptyState } from "@/components/ui/states/EmptyState";

export default function AnnouncementsPage() {
  return (
    <EmptyState
      icon="Megaphone"
      headline="Announcements coming soon"
      description="This feature is being built. Check back shortly."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
