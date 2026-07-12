import type { CarReport } from "@/lib/report.api";

export function ExpertConclusion({
  result,
}: {
  result: CarReport["resultStep"];
}) {
  if (!result.summaryInspectionNote && !result.resultSpecialistNote) return null;

  return (
    <section className="panel p-5 md:p-6">
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "color-mix(in oklab, var(--grade-good) 25%, white)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--grade-good)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <rect x="8" y="3" width="8" height="4" rx="1" />
            <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        </span>
        <h3 className="text-base font-bold ink">Заключение специалиста</h3>
      </div>
      <div className="min-w-0">
        {result.summaryInspectionNote &&
          result.summaryInspectionNote !== result.resultSpecialistNote && (
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground mb-2">
              {result.summaryInspectionNote}
            </p>
          )}
        {result.resultSpecialistNote && (
          <p className="text-sm leading-relaxed whitespace-pre-line ink">
            {result.resultSpecialistNote}
          </p>
        )}
      </div>
    </section>
  );
}
