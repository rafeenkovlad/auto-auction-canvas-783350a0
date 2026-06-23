import type { ReportHistoryEntry } from "@/lib/report.api";
import { fmtDate, fmtMileage } from "@/lib/report.utils";
import { History } from "lucide-react";

function extractToken(shareUrl?: string | null): string | null {
  if (!shareUrl) return null;
  const m = shareUrl.match(/\/share\/([^/?#]+)/);
  return m ? m[1] : null;
}

export function ReportHistoryTimeline({
  history,
  currentReportNumber,
}: {
  history?: ReportHistoryEntry[];
  currentReportNumber: string;
}) {
  if (!history || history.length === 0) return null;

  // Build full timeline (current + history), sorted newest → oldest
  const items = [
    { reportNumber: currentReportNumber, isCurrent: true, entry: null as ReportHistoryEntry | null },
    ...history.map((h) => ({ reportNumber: h.reportNumber, isCurrent: false, entry: h })),
  ];

  return (
    <section className="panel px-4 md:px-5 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <History size={14} strokeWidth={2} className="text-muted-foreground" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          История отчётов
        </h3>
        <span className="text-[11px] text-muted-foreground">
          · {items.length} {items.length === 1 ? "отчёт" : "отчёт(а/ов)"}
        </span>
      </div>

      <div className="relative overflow-x-auto pb-1 -mx-1 px-1">
        {/* horizontal rail */}
        <div
          aria-hidden
          className="absolute left-3 right-3 top-[22px] h-px"
          style={{ background: "var(--border)" }}
        />
        <ol className="relative flex items-stretch gap-3 min-w-max">
          {items.map((it) => {
            const date = it.isCurrent ? null : fmtDate(it.entry?.dateInspection ?? null);
            const mileage = it.isCurrent ? null : fmtMileage(it.entry?.mileage ?? null);
            const author = it.entry?.author;
            const authorName = author
              ? [author.firstName, author.lastName].filter(Boolean).join(" ")
              : null;
            const token = extractToken(it.entry?.shareUrl);
            const href = it.isCurrent || !token ? null : `/?token=${encodeURIComponent(token)}`;

            const dot = (
              <span
                className="w-3 h-3 rounded-full border-2 z-10"
                style={{
                  background: it.isCurrent ? "var(--foreground)" : "var(--background)",
                  borderColor: it.isCurrent ? "var(--foreground)" : "var(--border)",
                }}
              />
            );

            const body = (
              <>
                <div className="flex items-center justify-center h-[22px]">{dot}</div>
                <div
                  className="mt-2 rounded-lg border px-3 py-2 min-w-[170px] transition-colors"
                  style={{
                    background: it.isCurrent ? "var(--card)" : "transparent",
                    borderColor: it.isCurrent ? "var(--foreground)" : "var(--border)",
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mono">
                    {it.isCurrent ? "Текущий" : date ?? "—"}
                  </div>
                  <div className="text-xs font-semibold ink mono mt-0.5 truncate">
                    {it.reportNumber}
                  </div>
                  {!it.isCurrent && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {mileage}
                      {authorName ? ` · ${authorName}` : ""}
                    </div>
                  )}
                </div>
              </>
            );

            return (
              <li key={it.reportNumber} className="flex flex-col items-stretch flex-shrink-0">
                {href ? (
                  <a
                    href={href}
                    className="flex flex-col items-stretch hover:opacity-90 transition-opacity"
                  >
                    {body}
                  </a>
                ) : (
                  <div className="flex flex-col items-stretch">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
