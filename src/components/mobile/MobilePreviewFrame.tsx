export function MobilePreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-soft-sky min-[480px]:flex min-[480px]:h-auto min-[480px]:min-h-screen min-[480px]:items-start min-[480px]:justify-center min-[480px]:overflow-visible min-[480px]:bg-[#D9E4EE] min-[480px]:px-4 min-[480px]:py-8">
      <div className="relative mx-auto flex h-full w-full max-w-none flex-col overflow-hidden bg-soft-sky min-[480px]:mx-0 min-[480px]:h-[min(844px,calc(100dvh-64px))] min-[480px]:max-w-[390px] min-[480px]:rounded-[32px] min-[480px]:border min-[480px]:border-white/70 min-[480px]:shadow-float">
        <div
          className="pointer-events-none absolute left-1/2 top-2 z-50 hidden h-1 w-24 -translate-x-1/2 rounded-full bg-brand-ink/10 min-[480px]:block"
          aria-hidden="true"
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
