export function MobileCard({
  children,
  className = "",
  as: Tag = "div",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "button" | "article";
  onClick?: () => void;
}) {
  const base =
    "rounded-mobile-lg border border-brand-line bg-brand-surface shadow-card";
  if (Tag === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} w-full text-left transition active:scale-[0.99] ${className}`}
      >
        {children}
      </button>
    );
  }
  return <Tag className={`${base} ${className}`}>{children}</Tag>;
}
