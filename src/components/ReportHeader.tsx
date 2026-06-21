import type { CarReport } from "@/lib/report.api";
import { fmtDate, fmtMileage } from "@/lib/report.utils";

export function ReportHeader({ report }: { report: CarReport }) {
  const inspectionDate = fmtDate(
    report.carStep.dateInspection ?? report.reportDate,
  );
  const city = report.carStep.cityInspection;
  const mileage = fmtMileage(report.carStep.mileage);
  const gosNumber = report.carStep.gosNumber;

  return (
    <header className="panel px-4 md:px-5 py-3 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
      {/* Brand + report id */}
      <div className="flex items-center gap-3 min-w-0 lg:pr-5 lg:border-r lg:border-border">
        <div
          className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
          style={{ background: "var(--ink)" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className="min-w-0 leading-tight">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black ink tracking-[0.18em]">VIN</span>
            <span
              className="text-sm font-black tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              DIEZEL
            </span>
          </div>
          <div className="mono text-[11px] text-muted-foreground mt-0.5 truncate">
            ID:{" "}
            <span className="ink font-semibold">{report.reportNumber}</span>
          </div>
        </div>
      </div>

      {/* Meta cells */}
      <dl className="flex-1 flex flex-wrap items-center gap-x-5 gap-y-2 min-w-0">
        <MetaItem
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3.5" y="5" width="17" height="15" rx="2" />
              <path d="M3.5 9.5h17M8 3v4M16 3v4" />
            </svg>
          }
          label="Дата осмотра"
          value={inspectionDate}
        />
        {city && (
          <MetaItem
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s-7-6.2-7-12a7 7 0 1 1 14 0c0 5.8-7 12-7 12z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            }
            label="Город"
            value={city}
            truncate
          />
        )}
        <MetaItem
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
          }
          label="Пробег"
          value={mileage}
        />
      </dl>

      {gosNumber && (
        <div className="shrink-0 self-start lg:self-center">
          <div className="flex items-stretch rounded-md overflow-hidden border-2 border-foreground bg-white">
            <span className="flex items-center px-1.5 bg-[#1a4a8a] text-white mono text-[8px] font-bold tracking-widest">
              RU
            </span>
            <span className="mono text-sm font-bold ink tracking-wider px-2.5 py-1">
              {gosNumber}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}

function MetaItem({
  icon,
  label,
  value,
  truncate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="w-7 h-7 shrink-0 rounded-md bg-muted text-muted-foreground flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
        {icon}
      </span>
      <div className="leading-tight min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div
          className={`text-sm font-semibold ink ${truncate ? "truncate max-w-[180px] xl:max-w-[260px]" : ""}`}
          title={truncate ? value : undefined}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
