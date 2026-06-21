import { useMemo } from "react";
import type { CarReport } from "@/lib/report.api";
import { fmtDate, fmtMileage } from "@/lib/report.utils";
import { Calendar, MapPin, Gauge, Hash, FileText } from "lucide-react";

interface Props {
  report: CarReport;
  carName: string;
  heroImage: string | null;
  heroSrcSet: string | null;
  characteristics: Array<[string, string | number]>;
}


export function ReportHeaderCard({
  report,
  carName,
  heroImage,
  heroSrcSet,
  characteristics,
}: Props) {


  const chips = useMemo(() => {
    const wanted = ["Двигатель", "КПП", "Привод", "Объём"];
    const map = new Map(characteristics.map(([k, v]) => [k, v]));
    const result: Array<{ label: string; value: string }> = [];
    for (const k of wanted) {
      const v = map.get(k);
      if (v != null) result.push({ label: k, value: String(v) });
      if (result.length >= 4) break;
    }
    return result;
  }, [characteristics]);

  const inspectionDate = fmtDate(report.carStep.dateInspection ?? report.reportDate);
  const city = report.carStep.cityInspection ?? "—";
  const mileage = fmtMileage(report.carStep.mileage);
  const vinShort = report.vin || "—";

  return (
    <section className="panel p-4 sm:p-5 md:p-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {/* === Column 1: Car === */}
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold ink leading-tight mb-3">
          {carName}
        </h1>

        {heroImage && (
          <div className="float-left mr-4 mb-3 w-[160px] sm:w-[200px] md:w-[240px] aspect-[16/10] rounded-lg overflow-hidden border border-border bg-muted shrink-0">
            <img
              src={heroImage}
              srcSet={heroSrcSet ?? undefined}
              sizes="240px"
              alt={carName}
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {chips.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-border bg-muted/40 text-muted-foreground"
                title={c.label}
              >
                <span className="ink font-medium">{c.value}</span>
              </span>
            ))}
          </div>
        )}

        {report.carStep.uriListing && (
          <a
            href={report.carStep.uriListing}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Перейти к объявлению</span>
            <span aria-hidden>↗</span>
          </a>
        )}

        <div className="clear-both" />
      </div>


      {/* === Column 3: Meta === */}
      <div className="min-w-0 flex flex-col gap-2.5 lg:border-l lg:border-border lg:pl-5">
        <MetaRow icon={<Calendar size={14} />} label="Дата осмотра" value={inspectionDate} />
        <MetaRow icon={<MapPin size={14} />} label="Город" value={city} truncate />
        <MetaRow icon={<Gauge size={14} />} label="Пробег" value={mileage} mono />
        <MetaRow icon={<Hash size={14} />} label="VIN" value={vinShort} mono truncate />
        <MetaRow icon={<FileText size={14} />} label="Номер отчёта" value={report.reportNumber} mono />
      </div>
    </section>
  );
}

function MetaRow({
  icon,
  label,
  value,
  mono,
  truncate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-2 last:border-0 last:pb-0">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
      </span>
      <span
        className={`text-sm font-semibold ink text-right min-w-0 ${truncate ? "truncate" : ""} ${mono ? "mono text-[13px]" : ""}`}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}
