/** Merge Tailwind icon size utilities so callers cannot accidentally drop width/height. */
export function iconClasses(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}
