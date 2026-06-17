import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getReport,
  type InspectionElement,
  type FileRef,
} from "@/lib/report.functions";
import { ElementViewer } from "@/components/ElementViewer";
import { SchemaTabs } from "@/components/SchemaTabs";
import { MediaGallery, type GalleryItem } from "@/components/MediaGallery";
import { InspectionHistoryTimeline } from "@/components/InspectionHistoryTimeline";
import { SectionCard } from "@/components/SectionCard";
import { TestDriveCard } from "@/components/TestDriveCard";
import { GalleryTileBody } from "@/components/GalleryTile";
import { CheckRow, MetaCell, Stat } from "@/components/ReportPrimitives";
import {
  SECTION_KEYS,
  SECTION_LABELS,
  ELEMENT_LABEL,
  STEP_LABELS,
} from "@/lib/report.constants";
import {
  getElementStatus,
  statusMeta,
  fmtMileage,
  fmtDate,
  isVideoFile,
  type EnrichedElement,
} from "@/lib/report.utils";

const reportQuery = (token?: string) =>
  queryOptions({
    queryKey: ["report", token ?? "default"],
    queryFn: () => getReport({ data: token ? { token } : undefined }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(reportQuery(deps.token)),
  head: () => ({
    meta: [
      { title: "Отчёт о проверке автомобиля — Auto Auction Canvas" },
      {
        name: "description",
        content:
          "Подробный отчёт о техническом состоянии автомобиля: схема кузова, осмотр элементов, тест-драйв и заключение специалиста.",
      },
    ],
  }),
  component: AuctionSheetPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="panel p-8 max-w-lg text-center">
        <h1 className="text-2xl font-bold ink mb-2">Не удалось загрузить отчёт</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </div>
    </div>
  ),
});

function AuctionSheetPage() {
  const { token } = Route.useSearch();
  const { data: report } = useSuspenseQuery(reportQuery(token));
  const carName = report.reportName.replace(/^.*·\s*/, "");

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const { sections, allElements, gallery, additional, heroImage, heroSrcSet } = useMemo(() => {
    const secs: Array<{ key: string; elements: EnrichedElement[] }> = [];
    const body: EnrichedElement[] = [];
    for (const key of SECTION_KEYS) {
      const arr = report.inspectionStep[key] as InspectionElement[] | undefined;
      if (!arr || arr.length === 0) {
        secs.push({ key, elements: [] });
        continue;
      }
      const enriched: EnrichedElement[] = arr.map((el) => ({
        ...el,
        _status: getElementStatus(el),
        _category: SECTION_LABELS[key] ?? key,
        _displayName: ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " "),
        _sectionKey: key,
      }));
      body.push(...enriched);
      secs.push({ key, elements: enriched });
    }

    const all: EnrichedElement[] = [...body];
    const galleryItems: GalleryItem[] = [];

    for (let i = 0; i < body.length; i++) {
      const el = body[i];
      if (el.file?.url) {
        galleryItems.push({
          file: el.file,
          idx: i,
          caption: el._displayName,
          sectionKey: el._sectionKey,
          isVideo: isVideoFile(el.file),
          isDamage: el._status !== "ok",
        });
      }
    }

    const fileSources: Array<{ key: string; files: (FileRef | null | undefined)[] }> = [
      { key: "car", files: [report.carStep.listingFile, ...(report.carStep.files ?? [])] },
      { key: "characteristics", files: report.characteristicsStep?.files ?? [] },
      { key: "documents", files: report.documentReconciliationStep.files ?? [] },
      { key: "legal", files: report.legalReviewStep?.files ?? [] },
      { key: "inspection", files: report.inspectionStep.files ?? [] },
      { key: "testDrive", files: report.testDriveStep.files ?? [] },
      { key: "result", files: report.resultStep.files ?? [] },
    ];
    const additionalItems: GalleryItem[] = [];
    for (const src of fileSources) {
      const caption = STEP_LABELS[src.key] ?? src.key;
      const isInspection = src.key === "inspection";
      for (const f of src.files) {
        if (!f || !f.url) continue;
        const idx = all.length;
        const pseudo: EnrichedElement = {
          // Use a large negative offset so pseudo ids cannot collide with real (positive or small-negative) ids.
          id: -1_000_000 - idx,
          elementType: src.key,
          noDamage: true,
          seriousDamageTags: [],
          noSeriousDamageTags: [],
          note: null,
          audioNotes: [],
          file: f,
          _status: "ok",
          _category: caption,
          _displayName: caption,
          _sectionKey: src.key,
        };
        all.push(pseudo);
        const item: GalleryItem = {
          file: f,
          idx,
          caption,
          sectionKey: src.key,
          isVideo: isVideoFile(f),
          isDamage: false,
        };
        if (isInspection) galleryItems.push(item);
        else additionalItems.push(item);
      }
    }

    // Hero image: photo from carReference (по модификации).
    const SIZE_WIDTHS: Record<string, number> = { s: 240, m: 300, l: 400, xl: 600 };
    const photos = (report.carReference ?? report.characteristicsStep?.carReference)?.photos ?? [];
    const srcSetEntries: string[] = [];
    for (const p of photos) {
      const base = SIZE_WIDTHS[p.size] ?? 300;
      if (p.urlX1) srcSetEntries.push(`${p.urlX1} ${base}w`);
      if (p.urlX2) srcSetEntries.push(`${p.urlX2} ${base * 2}w`);
    }
    const heroSet = srcSetEntries.join(", ") || null;
    const pickPhoto =
      photos.find((p) => p.size === "m") ??
      photos.find((p) => p.size === "s") ??
      photos[0];
    const hero =
      pickPhoto?.urlX2 ??
      pickPhoto?.urlX1 ??
      report.characteristicsStep?.carImageUrl ??
      null;

    return {
      sections: secs,
      allElements: all,
      gallery: galleryItems,
      additional: additionalItems,
      heroImage: hero,
      heroSrcSet: heroSet,
    };
  }, [report]);

  const openElement = (el: InspectionElement) => {
    const idx = allElements.findIndex((e) => e.id === el.id);
    if (idx >= 0) setActiveIdx(idx);
  };

  const characteristics = useMemo(() => {
    const c = report.characteristicsStep;
    const ref = report.carReference ?? report.characteristicsStep?.carReference;
    const restyling = ref?.restyling;
    const yearStart = restyling?.yearStart ? new Date(restyling.yearStart).getFullYear() : null;
    const yearEnd = restyling?.yearEnd ? new Date(restyling.yearEnd).getFullYear() : null;
    const yearsStr = yearStart ? `${yearStart}–${yearEnd ?? "н.в."}` : null;
    const brandStr = ref?.brand
      ? [ref.brand.nameRus, ref.brand.name].filter(Boolean).join(" / ")
      : null;
    const modelStr = ref?.model
      ? [ref.model.nameRus, ref.model.name].filter(Boolean).join(" / ")
      : null;
    const rows: Array<[string, string | number | null | undefined]> = [
      ["VIN", report.vin],
      ["Марка", brandStr],
      ["Модель", modelStr],
      ["Поколение", ref?.generation?.name ?? null],
      ["Рестайлинг", restyling?.name ? `${restyling.name}${yearsStr ? ` (${yearsStr})` : ""}` : yearsStr],
      ["Кузов (frame)", ref?.frame?.name ?? null],
      ["Комплектация", c?.equipment ?? null],
      ["Двигатель", c?.engineType],
      ["Объём", c?.engineVolume],
      ["КПП", c?.transmission],
      ["Привод", c?.driveType],
      ["Цвет", c?.color],
    ];
    return rows.filter(([, v]) => v != null && v !== "");
  }, [report]);

  return (
    <main
      className="min-h-screen py-5 px-3 md:px-6"
      // Hide underlying content (esp. native <video> thumbnails on iOS which
      // render in a separate compositor layer and can bleed through overlays).
      style={activeIdx != null ? { visibility: "hidden" } : undefined}
      aria-hidden={activeIdx != null ? true : undefined}
    >
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Top bar */}
        <header className="panel px-4 md:px-5 py-3 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
              style={{ background: "var(--ink)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
                <path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
                <circle cx="7.5" cy="16" r="1.5" fill="white" />
                <circle cx="16.5" cy="16" r="1.5" fill="white" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">
                AUTO AUCTION
              </div>
              <div className="text-sm font-black ink tracking-wider truncate">CANVAS</div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Отчёт о проверке автомобиля
            </div>
            <div className="mono text-xs text-muted-foreground mt-0.5 truncate">
              ID отчёта: <span className="ink font-semibold">{report.reportNumber}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <MetaCell
              label="Дата осмотра"
              value={fmtDate(report.carStep.dateInspection ?? report.reportDate)}
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

        {/* Hero */}
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
            <h1 className="text-2xl md:text-3xl font-bold ink leading-tight">{carName}</h1>
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
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider">{k}</dt>
                    <dd className="ink font-semibold text-right mono text-[13px]">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        {/* Body schema + technical state */}
        <section className="grid lg:grid-cols-2 gap-4">
          <SchemaTabs
            bodyElements={report.inspectionStep.bodyElements ?? []}
            interiorElements={report.inspectionStep.interiorElements ?? []}
            frameElements={report.inspectionStep.bodyReinforcementElements ?? []}
            wheelsElements={report.inspectionStep.wheelsAndBrakesElements ?? []}
            glassElements={report.inspectionStep.glassElements ?? []}
            lightingElements={report.inspectionStep.lightningElements ?? []}
            onElementClick={openElement}
          />

          <div className="panel p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Техническое состояние
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {sections
                .filter((s) => s.elements.length > 0)
                .map((s) => (
                  <SectionCard key={s.key} sectionKey={s.key} elements={s.elements} />
                ))}
            </div>
            {(report.inspectionStep.bodyPaintworkThicknessFrom != null ||
              report.inspectionStep.bodyReinforcementPaintworkThicknessFrom != null) && (
              <div className="grid sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
                <Stat
                  label="ЛКП кузова"
                  value={`${report.inspectionStep.bodyPaintworkThicknessFrom ?? "—"}–${report.inspectionStep.bodyPaintworkThicknessTo ?? "—"}`}
                  unit="мкм"
                />
                <Stat
                  label="ЛКП силовых"
                  value={`${report.inspectionStep.bodyReinforcementPaintworkThicknessFrom ?? "—"}–${report.inspectionStep.bodyReinforcementPaintworkThicknessTo ?? "—"}`}
                  unit="мкм"
                />
              </div>
            )}
          </div>
        </section>

        {/* Inspection history timeline (placeholder, previous reports) */}
        <InspectionHistoryTimeline />

        {/* Media gallery */}
        <MediaGallery
          items={gallery}
          onOpen={setActiveIdx}
          renderTile={(item) => <GalleryTileBody item={item} />}
        />

        {/* Additional materials (files from other steps) */}
        {additional.length > 0 && (
          <section className="panel p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Дополнительные материалы
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {additional.map((item) => (
                <button
                  key={`${item.file.id}-${item.idx}`}
                  type="button"
                  onClick={() => setActiveIdx(item.idx)}
                  className="text-left rounded-lg border border-border bg-card hover:border-accent hover:shadow-sm transition-all overflow-hidden flex flex-col"
                >
                  <GalleryTileBody item={item} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Documents + Test drive */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="panel p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Сверка ПТС / СТС
            </h3>
            <CheckRow
              label="ФИО владельца совпадает с ПТС/СТС"
              ok={report.documentReconciliationStep.ownerFullNameMatchWithPtsOrSts}
            />
            <CheckRow
              label="VIN на кузове совпадает с ПТС/СТС"
              ok={report.documentReconciliationStep.vinOnBodyMatchWithPtsOrSts}
            />
            <CheckRow
              label="Модель двигателя совпадает с ПТС/СТС"
              ok={report.documentReconciliationStep.engineModelMatchWithPtsOrSts}
            />
            <div className="flex items-center justify-between gap-3 py-2 border-b border-dashed border-border last:border-0">
              <span className="text-sm">Количество владельцев</span>
              <span className="mono text-sm font-semibold ink">
                {report.documentReconciliationStep.ownersCount ?? "—"}
              </span>
            </div>
          </div>

          <TestDriveCard report={report} />
        </section>

        {/* Summary + Specialist conclusion */}
        {(report.resultStep.summaryInspectionNote ||
          report.resultStep.resultSpecialistNote) && (
          <section className="panel p-5 md:p-6">
            <div className="flex items-start gap-4">
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "color-mix(in oklab, var(--grade-good) 25%, white)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--grade-good)" strokeWidth="2" className="w-6 h-6">
                  <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold ink mb-1">Заключение специалиста</h3>
                {report.resultStep.summaryInspectionNote &&
                  report.resultStep.summaryInspectionNote !==
                    report.resultStep.resultSpecialistNote && (
                    <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground mb-2">
                      {report.resultStep.summaryInspectionNote}
                    </p>
                  )}
                {report.resultStep.resultSpecialistNote && (
                  <p className="text-sm leading-relaxed whitespace-pre-line ink">
                    {report.resultStep.resultSpecialistNote}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <footer className="text-center mono text-[11px] text-muted-foreground py-4">
          Сгенерировано на основе данных carreports.ru · {report.reportNumber}
        </footer>
      </div>

      <ElementViewer
        elements={allElements}
        index={activeIdx}
        onClose={() => setActiveIdx(null)}
        onChange={(i) => setActiveIdx(i)}
        statusMeta={statusMeta}
      />
    </main>
  );
}
