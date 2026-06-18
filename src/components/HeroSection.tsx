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
  const hasImage = Boolean(heroImage);

  return (
    <section
      className={`panel p-5 md:p-6 grid gap-5 md:gap-6 items-stretch ${
        hasImage ? "md:grid-cols-[minmax(240px,320px)_1fr]" : ""
      }`}
    >
      {hasImage ? (
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted">
          <img
            src={heroImage!}
            srcSet={heroSrcSet ?? undefined}
            sizes="(min-width: 768px) 320px, 100vw"
            alt={carName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex flex-col">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ink)" }} />
          Объект осмотра
        </div>

        <h1 className="mt-1.5 text-2xl md:text-3xl font-bold ink leading-tight">
          {carName}
        </h1>

        {report.carStep.uriListing && (
          <a
            href={report.carStep.uriListing}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 self-start text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span>Перейти к объявлению</span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              <path d="M3.5 8.5L8.5 3.5M4 3.5h4.5V8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}

        {!hasImage && (
          <div className="mt-4 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5 flex items-center gap-2.5 text-xs text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="11" r="1.5" />
              <path d="M21 17l-5-5-7 7" />
            </svg>
            Изображение модификации не предоставлено
          </div>
        )}

        {characteristics.length > 0 && (
          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
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
