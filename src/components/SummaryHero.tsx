import type { CarReport } from "@/lib/report.api";
import type { ReportScore } from "@/lib/report.score";
import { sectionLabel } from "@/lib/report.score";
import { Check, AlertTriangle, AlertOctagon, ArrowRight } from "lucide-react";

interface SummaryHeroProps {
  report: CarReport;
  carName: string;
  heroImage: string | null;
  heroSrcSet: string | null;
  score: ReportScore;
  onSeeDetails: () => void;
}

function verdictColor(v: ReportScore["verdict"]) {
  if (v === "buy") return "var(--grade-good)";
  if (v === "caution") return "var(--grade-warn)";
  return "var(--grade-bad)";
}

export function SummaryHero({
  report,
  carName,
  heroImage,
  heroSrcSet,
  score,
  onSeeDetails,
}: SummaryHeroProps) {
  const color = verdictColor(score.verdict);
  const pct = Math.max(4, Math.min(100, (score.score / 10) * 100));
  const VerdictIcon =
    score.verdict === "buy"
      ? Check
      : score.verdict === "caution"
        ? AlertTriangle
        : AlertOctagon;

  return (
    <section className="panel p-5 md:p-8 grid gap-6 md:grid-cols-[minmax(240px,360px)_1fr] items-start">
      {heroImage ? (
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
          <img
            src={heroImage}
            srcSet={heroSrcSet ?? undefined}
            sizes="(min-width: 768px) 360px, 100vw"
            alt={carName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] rounded-xl border border-dashed border-border bg-muted/40" />
      )}

      <div className="min-w-0 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold ink leading-tight">
            {carName}
          </h1>
          <div className="mt-1 text-xs text-muted-foreground mono">
            VIN {report.vin} · отчёт {report.reportNumber}
          </div>
        </div>

        {/* Score */}
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl md:text-6xl font-bold ink mono leading-none">
              {score.score.toFixed(1)}
            </span>
            <span className="text-lg text-muted-foreground mono">/ 10</span>
          </div>
          <div
            className="mt-3 h-2.5 rounded-full overflow-hidden"
            style={{
              background: "color-mix(in oklab, var(--muted) 70%, transparent)",
            }}
            role="meter"
            aria-valuenow={score.score}
            aria-valuemin={0}
            aria-valuemax={10}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>

          {/* Verdict */}
          <div
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: `color-mix(in oklab, ${color} 18%, white)`,
              color,
              border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
            }}
          >
            <VerdictIcon size={16} strokeWidth={2.5} />
            <span>{score.verdictLabel}</span>
          </div>
        </div>

        {/* Key checks */}
        {(score.okChecks.length > 0 || score.issues.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {score.okChecks.length > 0 && (
              <ul className="space-y-1.5">
                {score.okChecks.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-snug"
                  >
                    {c.ok ? (
                      <Check
                        size={16}
                        strokeWidth={2.5}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: "var(--grade-good)" }}
                      />
                    ) : (
                      <AlertTriangle
                        size={16}
                        strokeWidth={2.5}
                        className="mt-0.5 flex-shrink-0"
                        style={{
                          color:
                            c.severity === "serious"
                              ? "var(--grade-bad)"
                              : "var(--grade-warn)",
                        }}
                      />
                    )}
                    <span className="ink">{c.label}</span>
                  </li>
                ))}
              </ul>
            )}

            {score.issues.length > 0 && (
              <ul className="space-y-1.5">
                {score.issues.map((iss, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-snug"
                  >
                    {iss.severity === "serious" ? (
                      <AlertOctagon
                        size={16}
                        strokeWidth={2.5}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: "var(--grade-bad)" }}
                      />
                    ) : (
                      <AlertTriangle
                        size={16}
                        strokeWidth={2.5}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: "var(--grade-warn)" }}
                      />
                    )}
                    <span className="min-w-0">
                      <span className="ink font-medium">{iss.label}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        — {iss.detail.toLowerCase()}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70 ml-1">
                        ({sectionLabel(iss.sectionKey)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Counters */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md border border-border bg-card mono">
            Проверено: <span className="font-semibold ink">{score.total}</span>
          </span>
          {score.serious > 0 && (
            <span
              className="px-2.5 py-1 rounded-md mono font-semibold"
              style={{
                background: "color-mix(in oklab, var(--grade-bad) 14%, white)",
                color: "var(--grade-bad)",
              }}
            >
              Серьёзных: {score.serious}
            </span>
          )}
          {score.minor > 0 && (
            <span
              className="px-2.5 py-1 rounded-md mono font-semibold"
              style={{
                background: "color-mix(in oklab, var(--grade-warn) 18%, white)",
                color: "oklch(0.35 0.1 70)",
              }}
            >
              Замечаний: {score.minor}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSeeDetails}
          className="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          Смотреть детали
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
