import type { CarReport } from "@/lib/report.api";

interface HeroSectionProps {
  report: CarReport;
  carName: string;
  heroImage: string | null;
  heroSrcSet: string | null;
  characteristics: Array<[string, string | number]>;
}

export function HeroSection({
  report,
  carName,
  heroImage,
  heroSrcSet,
  characteristics,
}: HeroSectionProps) {
  return (
    <section className="panel p-5 md:p-6 grid md:grid-cols-[260px_1fr] gap-5 md:gap-6 items-center">
      <div className="aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted">
        {heroImage ? (
          <img
            src={heroImage}
            srcSet={heroSrcSet ?? undefined}
            sizes="(min-width: 768px) 260px, 100vw"
            alt={carName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center px-3">
            Модификация не определена
          </div>
        )}
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold ink leading-tight">
          {carName}
        </h1>
        {report.carStep.uriListing && (
          <a
            href={report.carStep.uriListing}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-1 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Объявление ↗
          </a>
        )}
        {characteristics.length > 0 && (
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            {characteristics.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-1.5"
              >
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                  {k}
                </dt>
                <dd className="ink font-semibold text-right mono text-[13px]">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
