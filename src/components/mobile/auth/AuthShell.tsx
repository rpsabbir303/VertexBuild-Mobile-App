import type { ReactNode } from "react";

export function AuthShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-soft-sky">
      <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col">{children}</div>
        {footer ? <div className="mt-6 shrink-0">{footer}</div> : null}
      </div>
    </div>
  );
}
