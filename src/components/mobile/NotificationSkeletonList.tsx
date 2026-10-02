export function NotificationSkeletonList() {
  return (
    <ul className="list-none space-y-2.5 p-0" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <li
          key={i}
          className="list-none animate-pulse rounded-mobile-lg border border-brand-line/60 bg-white/90 px-3.5 py-3.5 shadow-soft"
        >
          <div className="h-4 w-2/3 rounded bg-brand-line/80" />
          <div className="mt-2 h-3 w-1/2 rounded bg-brand-line/60" />
          <div className="mt-3 h-3 w-full rounded bg-brand-line/50" />
          <div className="mt-2 h-3 w-1/3 rounded bg-brand-line/40" />
        </li>
      ))}
    </ul>
  );
}
