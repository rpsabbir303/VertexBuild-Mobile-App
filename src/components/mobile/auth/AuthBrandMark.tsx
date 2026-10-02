import { VertexMark } from "../icons";

export function AuthBrandMark() {
  return (
    <div className="flex flex-col items-center text-center">
      <VertexMark className="h-14 w-14 rounded-[18px] shadow-soft" />
      <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
        Vertex CMS
      </p>
    </div>
  );
}
