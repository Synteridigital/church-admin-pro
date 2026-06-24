import { icons } from "lucide-react";

type Props = {
  icon?: keyof typeof icons;
  headline: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function EmptyState({
  icon = "Inbox",
  headline,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
}: Props) {
  const Icon = icons[icon] ?? icons.Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        <Icon size={32} className="text-gray-400" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-gray-900">{headline}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-4 inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ backgroundColor: "var(--brand-color, #7A1E2B)" }}
        >
          {actionLabel}
        </a>
      )}
      {secondaryLabel && secondaryHref && (
        <a
          href={secondaryHref}
          className="mt-2 text-sm text-gray-500 underline hover:text-gray-700"
        >
          {secondaryLabel}
        </a>
      )}
    </div>
  );
}
