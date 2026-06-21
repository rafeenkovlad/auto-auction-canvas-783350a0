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


  const specs = useMemo(() => {
    const wanted = [
      "VIN",
      "Марка",
      "Модель",
      "Поколение",
      "Рестайлинг",
      "Кузов (frame)",
      "Двигатель",
      "Объём",
      "КПП",
      "Привод",
      "Цвет",
    ];
    const map = new Map(characteristics.map(([k, v]) => [k, v]));
    const rows: Array<{ label: string; value: string }> = [];
    for (const k of wanted) {
      const v = map.get(k);
      if (v != null && v !== "") rows.push({ label: k, value: String(v) });
    }
    return rows;
  }, [characteristics]);

  const inspectionDate = fmtDate(report.carStep.dateInspection ?? report.reportDate);
  const city = report.carStep.cityInspection ?? "—";
  const mileage = fmtMileage(report.carStep.mileage);
  const vinShort = report.vin || "—";

  return (
    <section className="panel p-4 sm:p-5 md:p-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {/* === Column 1: Car === */}
      <div className="min-w-0">
        {heroImage && (
          <div className="float-left mr-4 mb-2 w-[140px] sm:w-[170px] md:w-[200px] aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted shrink-0">
            <img
              src={heroImage}
              srcSet={heroSrcSet ?? undefined}
              sizes="200px"
              alt={carName}
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="text-lg md:text-xl font-bold ink leading-tight mb-2">
          {carName}
        </h1>

        {specs.length > 0 && (
          <dl className="text-[13px] leading-relaxed">
            {specs.map((s) => (
              <div key={s.label} className="flex flex-wrap gap-x-2">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium self-center">
                  {s.label}:
                </dt>
                <dd className="ink font-semibold min-w-0 break-words">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {report.carStep.uriListing && (
          <a
            href={report.carStep.uriListing}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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
