import type { CarReport } from "@/lib/report.functions";
import { MetaCell } from "@/components/ReportPrimitives";
import { fmtDate, fmtMileage } from "@/lib/report.utils";

export function ReportHeader({ report }: { report: CarReport }) {
  return (
    <header className="panel px-4 md:px-5 py-3 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
          style={{ background: "var(--ink)" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            className="w-5 h-5"
          >
            <path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
            <circle cx="7.5" cy="16" r="1.5" fill="white" />
            <circle cx="16.5" cy="16" r="1.5" fill="white" />
          </svg>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">
            AUTO AUCTION
          </div>
          <div className="text-sm font-black ink tracking-wider truncate">
            CANVAS
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Отчёт о проверке автомобиля
        </div>
        <div className="mono text-xs text-muted-foreground mt-0.5 truncate">
          ID отчёта:{" "}
          <span className="ink font-semibold">{report.reportNumber}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-6">
        <MetaCell
          label="Дата осмотра"
          value={fmtDate(
            report.carStep.dateInspection ?? report.reportDate,
          )}
        />
        {report.carStep.cityInspection && (
          <MetaCell label="Город" value={report.carStep.cityInspection} />
        )}
        <MetaCell label="Пробег" value={fmtMileage(report.carStep.mileage)} />
        {report.carStep.gosNumber && (
          <div className="flex flex-col items-center justify-center px-3 py-1 border-2 border-foreground bg-white rounded">
            <span className="mono text-[8px] uppercase tracking-widest text-muted-foreground">
              Гос. номер
            </span>
            <span className="mono text-sm font-bold ink tracking-wider">
              {report.carStep.gosNumber}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
