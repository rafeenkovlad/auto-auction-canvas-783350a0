import { useRef, useState } from "react";
import type { ReportHistoryEntry } from "@/lib/report.api";
import { fmtDate, fmtMileage } from "@/lib/report.utils";
import { History, ArrowUpRight, Check } from "lucide-react";

function extractToken(shareUrl?: string | null): string | null {
  if (!shareUrl) return null;
  const m = shareUrl.match(/\/share\/([^/?#]+)/);
  return m ? m[1] : null;
}

type Item = {
  reportNumber: string;
  isCurrent: boolean;
  entry: ReportHistoryEntry | null;
};

export function ReportHistoryTimeline({
  history,
  currentReportNumber,
  currentDateInspection,
  currentMileage,
}: {
  history?: ReportHistoryEntry[];
  currentReportNumber: string;
  currentDateInspection?: string | null;
  currentMileage?: number | null;
}) {
  const [selectedId, setSelectedId] = useState<string>(currentReportNumber);

  if (!history || history.length === 0) return null;

  const items: Item[] = [
    {
      reportNumber: currentReportNumber,
      isCurrent: true,
      entry: {
        reportNumber: currentReportNumber,
        dateInspection: currentDateInspection ?? null,
        mileage: currentMileage ?? null,
      },
    },
    ...history.map((h) => ({
      reportNumber: h.reportNumber,
      isCurrent: false,
      entry: h,
    })),
  ];

  const selected = items.find((i) => i.reportNumber === selectedId) ?? items[0];
  const selectedToken = extractToken(selected.entry?.shareUrl);
  const selectedHref =
    selected.isCurrent || !selectedToken
      ? null
      : `/?token=${encodeURIComponent(selectedToken)}`;
  const selectedDate = selected.isCurrent
    ? null
    : fmtDate(selected.entry?.dateInspection ?? null);

  const railRef = useRef<HTMLDivElement | null>(null);

  // Translate vertical wheel into horizontal scroll on the rail.
  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const el = railRef.current;
    if (!el) return;
    if (e.deltaY === 0) return;
    // Only intercept when there's room to scroll horizontally.
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  return (
    <section className="panel px-4 md:px-5 py-3 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <History size={14} strokeWidth={2} className="text-muted-foreground" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          История отчётов
        </h3>
        <span className="text-[11px] text-muted-foreground">· {items.length}</span>

        <div className="ml-auto flex items-center gap-2 min-w-0">
          {!selected.isCurrent && (
            <>
              <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                {selected.reportNumber} · {selectedDate}
              </span>
              {selectedHref && (
                <a
                  href={selectedHref}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md transition-opacity hover:opacity-90"
                  style={{
                    background: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  Открыть
                  <ArrowUpRight size={12} strokeWidth={2.5} />
                </a>
              )}
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          onWheel={onWheel}
          className="relative overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth overscroll-x-contain [touch-action:pan-x] [-webkit-overflow-scrolling:touch]"
        >
          {/* horizontal rail */}
          <div
            aria-hidden
            className="absolute left-3 right-3 top-[14px] h-px"
            style={{ background: "var(--border)" }}
          />
          <ol className="relative flex items-stretch gap-3 min-w-max">
            {items.map((it) => {
              const isSelected = it.reportNumber === selectedId;
              const date = fmtDate(it.entry?.dateInspection ?? null);
              const mileage = fmtMileage(it.entry?.mileage ?? null);
              const author = it.entry?.author;
              const authorName = author
                ? [author.firstName, author.lastName].filter(Boolean).join(" ")
                : null;
              const meta = [mileage, authorName].filter(Boolean).join(" · ");

              return (
                <li
                  key={it.reportNumber}
                  className="flex flex-col items-stretch flex-shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(it.reportNumber)}
                    aria-pressed={isSelected}
                    className="group flex flex-col items-stretch text-left focus:outline-none"
                  >
                    {/* Dot on rail */}
                    <div className="flex items-center justify-center h-[28px] relative">
                      <span
                        aria-hidden
                        className={`absolute rounded-full transition-all duration-200 ${
                          isSelected
                            ? "w-5 h-5 opacity-30"
                            : "w-0 h-0 opacity-0 group-hover:w-4 group-hover:h-4 group-hover:opacity-20"
                        }`}
                        style={{
                          background: it.isCurrent
                            ? "var(--accent)"
                            : "var(--foreground)",
                        }}
                      />
                      <span
                        className="w-3 h-3 rounded-full border-2 z-10 transition-all duration-200 group-hover:scale-110"
                        style={{
                          background: isSelected
                            ? it.isCurrent
                              ? "var(--accent)"
                              : "var(--foreground)"
                            : "var(--background)",
                          borderColor: it.isCurrent
                            ? "var(--accent)"
                            : isSelected
                              ? "var(--foreground)"
                              : "var(--border)",
                        }}
                      />
                    </div>

                    {/* Card */}
                    <div
                      className="mt-2 rounded-lg border px-3 py-2 min-w-[170px] transition-all duration-200 group-hover:-translate-y-0.5"
                      style={{
                        background: isSelected
                          ? "var(--card)"
                          : "transparent",
                        borderColor: isSelected
                          ? it.isCurrent
                            ? "var(--accent)"
                            : "var(--foreground)"
                          : "var(--border)",
                        boxShadow: isSelected
                          ? "0 6px 16px -8px rgba(0,0,0,0.18), 0 0 0 1px var(--border)"
                          : undefined,
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mono">
                        <span
                          className={
                            it.isCurrent
                              ? "font-semibold"
                              : "text-muted-foreground"
                          }
                          style={
                            it.isCurrent ? { color: "var(--accent)" } : undefined
                          }
                        >
                          {it.isCurrent ? "Текущий" : date ?? "—"}
                        </span>
                        {isSelected && (
                          <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                            <Check size={9} strokeWidth={3} />
                          </span>
                        )}
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
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
