import type { CarReport } from "@/lib/report.api";
import { fmtDate } from "@/lib/report.utils";

export function ExpertConclusion({
  result,
  report,
}: {
  result: CarReport["resultStep"];
  report?: CarReport;
}) {
  if (!result.summaryInspectionNote && !result.resultSpecialistNote) return null;

  const intro =
    result.summaryInspectionNote &&
    result.summaryInspectionNote !== result.resultSpecialistNote
      ? result.summaryInspectionNote
      : null;
  const body = result.resultSpecialistNote;

  return (
    <section
      className="panel p-6 md:p-10 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--grade-good) 6%, var(--card)) 0%, var(--card) 60%)",
      }}
    >
      {/* Decorative quote mark */}
      <span
        aria-hidden
        className="absolute top-2 right-4 md:right-8 select-none pointer-events-none font-serif leading-none"
        style={{
          fontSize: "180px",
          color: "color-mix(in oklab, var(--grade-good) 15%, transparent)",
        }}
      >
        “
      </span>

      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider text-white"
            style={{ background: "var(--grade-good)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
              <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Заключение специалиста
          </span>
        </div>

        {intro && (
          <p className="text-base md:text-lg font-medium leading-relaxed ink mb-4 whitespace-pre-line">
            {intro}
          </p>
        )}

        {body && (
          <p
            className={`leading-relaxed whitespace-pre-line ${
              intro ? "text-sm text-muted-foreground" : "text-base md:text-lg ink font-medium"
            }`}
          >
            {body}
          </p>
        )}

        {report && (
          <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground mono">
            <span>
              Отчёт{" "}
              <span className="ink font-semibold">{report.reportNumber}</span>
            </span>
            <span>·</span>
            <span>
              Дата осмотра{" "}
              <span className="ink font-semibold">
                {fmtDate(report.carStep.dateInspection ?? report.reportDate)}
              </span>
            </span>
            {report.carStep.cityInspection && (
              <>
                <span>·</span>
                <span>
                  <span className="ink font-semibold">
                    {report.carStep.cityInspection}
                  </span>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
