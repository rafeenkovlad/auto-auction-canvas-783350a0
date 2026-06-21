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
          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted mb-4">
            <img
              src={heroImage}
              srcSet={heroSrcSet ?? undefined}
              sizes="(max-width: 1024px) 100vw, 800px"
              alt={carName}
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="text-xl md:text-2xl font-bold ink leading-tight mb-4">
          {carName}
        </h1>

        {specs.length > 0 && (
          <div className="flex flex-col">
            {specs.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 border-b border-dashed border-border py-2.5 last:border-b-0">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
                  {s.label}
                </span>
                <span className="text-sm font-semibold ink text-right min-w-0 truncate" title={s.value}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}
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
