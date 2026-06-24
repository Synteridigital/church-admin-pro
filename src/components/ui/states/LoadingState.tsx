export function LoadingState({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3 py-6" role="status">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-gray-200"
          style={{ width: `${70 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
