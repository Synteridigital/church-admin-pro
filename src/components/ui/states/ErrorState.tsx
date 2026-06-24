import { AlertTriangle } from "lucide-react";

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 rounded-full bg-red-50 p-4">
        <AlertTriangle size={32} className="text-red-400" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-gray-900">Error</h2>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>
      <div className="mt-4 flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Try again
          </button>
        )}
        <a
          href="/support"
          className="text-sm text-gray-500 underline hover:text-gray-700"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
