import { useMemo } from "react";
import type { EnrichedElement } from "@/lib/report.utils";
import { SECTION_LABELS } from "@/lib/report.constants";

interface Props {
  sections: Array<{ key: string; elements: EnrichedElement[] }>;
  title?: string;
}

function gradeFor(elements: EnrichedElement[]): { score: number; color: string } {
  if (elements.length === 0) return { score: 0, color: "var(--grade-skip)" };
  let serious = 0, minor = 0;
  for (const e of elements) {
    if (e._status === "serious") serious++;
    else if (e._status === "minor") minor++;
  }
  const raw = 10 - (serious / elements.length) * 10 - (minor / elements.length) * 2.5;
  const score = Math.max(1, Math.min(10, Math.round(raw * 10) / 10));
  const color =
    score >= 8.5 ? "var(--grade-good)" : score >= 6.5 ? "var(--grade-warn)" : "var(--grade-bad)";
  return { score, color };
}

export function TechStateCompact({ sections, title = "Техническое состояние" }: Props) {
  const rows = useMemo(
    () =>
      sections
        .filter((s) => s.elements.length > 0)
        .map((s) => ({
          key: s.key,
          label: SECTION_LABELS[s.key] ?? s.key,
          ...gradeFor(s.elements),
        })),
    [sections],
  );

  if (rows.length === 0) return null;

  const overall =
    rows.reduce((acc, r) => acc + r.score, 0) / rows.length;
  const overallScore = Math.round(overall * 10) / 10;
  const overallColor =
    overallScore >= 8.5
      ? "var(--grade-good)"
      : overallScore >= 6.5
        ? "var(--grade-warn)"
        : "var(--grade-bad)";

  return (
    <div className="panel p-5 md:p-6 flex flex-col">
      <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {title}
      </h3>

      <div className="flex flex-col gap-2.5 flex-1">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3">
            <span className="text-[12px] ink font-medium flex-1 min-w-0 truncate">
              {r.label}
            </span>
            <div className="w-20 sm:w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(r.score / 10) * 100}%`,
                  background: r.color,
                }}
              />
            </div>
            <span className="mono text-[11px] font-bold tabular-nums w-12 text-right" style={{ color: r.color }}>
              {r.score.toFixed(1)} / 10
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: overallColor }}>
          Общая оценка
        </span>
        <span className="mono text-base font-black tabular-nums" style={{ color: overallColor }}>
          {overallScore.toFixed(1)} / 10
        </span>
      </div>
    </div>
  );
}
