import { useMemo } from "react";
import type { CarReport } from "@/lib/report.api";

interface Props {
  report: CarReport;
  carName: string;
  heroImage: string | null;
  heroSrcSet: string | null;
  characteristics: Array<[string, string | number]>;
}

export function ReportHeaderCard({
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

  return (
    <section className="panel p-4 sm:p-5 md:p-6">
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
    </section>
  );
}
