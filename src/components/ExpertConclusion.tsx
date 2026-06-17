import type { CarReport } from "@/lib/report.functions";

export function ExpertConclusion({
  result,
}: {
  result: CarReport["resultStep"];
}) {
  if (!result.summaryInspectionNote && !result.resultSpecialistNote) return null;

  return (
    <section className="panel p-5 md:p-6">
      <div className="flex items-start gap-4">
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "color-mix(in oklab, var(--grade-good) 25%, white)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--grade-good)"
            strokeWidth="2"
            className="w-6 h-6"
          >
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold ink mb-1">Заключение специалиста</h3>
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
      </div>
    </section>
  );
}
