import type { DrawingDiscipline } from "@/lib/mobile/drawings";

const DISCIPLINE_TONE: Record<DrawingDiscipline, string> = {
  architectural: "#5B7C99",
  structural: "#6B6258",
  mechanical: "#4A7C59",
  electrical: "#8A6232",
};

export function ConstructionSheetPreview({
  sheetNumber,
  title,
  discipline,
  revision,
  superseded,
}: {
  sheetNumber: string;
  title: string;
  discipline: DrawingDiscipline;
  revision: number;
  superseded: boolean;
}) {
  const accent = DISCIPLINE_TONE[discipline];
  const grid = superseded ? "#D8DEE4" : "#C5CED6";

  return (
    <svg
      viewBox="0 0 800 1100"
      className="h-full w-full select-none"
      role="img"
      aria-label={`${sheetNumber} revision ${revision}`}
    >
      <rect width="800" height="1100" fill="#F7F9FB" />
      <rect x="24" y="24" width="752" height="1052" fill="#FFFFFF" stroke="#08233F" strokeWidth="2" />
      {Array.from({ length: 16 }).map((_, i) => (
        <line key={`v-${i}`} x1={48 + i * 44} y1="72" x2={48 + i * 44} y2="1028" stroke={grid} strokeWidth="1" />
      ))}
      {Array.from({ length: 22 }).map((_, i) => (
        <line key={`h-${i}`} x1="48" y1={72 + i * 44} x2="752" y2={72 + i * 44} stroke={grid} strokeWidth="1" />
      ))}
      <rect x="560" y="40" width="216" height="120" fill="#FAFCFE" stroke="#08233F" strokeWidth="1.5" />
      <text x="576" y="78" fill="#08233F" fontFamily="ui-monospace, monospace" fontSize="28" fontWeight="700">
        {sheetNumber}
      </text>
      <text x="576" y="108" fill="#5A6B7A" fontFamily="system-ui, sans-serif" fontSize="14" fontWeight="600">
        {title.length > 28 ? `${title.slice(0, 28)}…` : title}
      </text>
      <text x="576" y="132" fill={accent} fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="700">
        REV {revision}
        {superseded ? " · SUPERSEDED" : " · CURRENT"}
      </text>
      <rect x="72" y="160" width="460" height="320" fill="none" stroke={accent} strokeWidth="2.5" />
      <rect x="120" y="220" width="180" height="120" fill="none" stroke="#08233F" strokeWidth="1.5" strokeDasharray="8 6" />
      <rect x="340" y="240" width="140" height="180" fill="none" stroke="#08233F" strokeWidth="1.5" />
      <circle cx="280" cy="520" r="56" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M72 560 H532" stroke="#08233F" strokeWidth="1.5" />
      <path d="M72 640 H420" stroke="#08233F" strokeWidth="1.5" strokeDasharray="6 5" />
      <text x="72" y="980" fill="#5A6B7A" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="600">
        FIELD VIEW · NOT FOR CONSTRUCTION
      </text>
    </svg>
  );
}
