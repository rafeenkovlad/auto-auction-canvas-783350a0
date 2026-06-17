import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getReport,
  type CarReport,
  type InspectionElement,
  type FileRef,
} from "@/lib/report.functions";
import { ElementViewer } from "@/components/ElementViewer";
import { SchemaTabs } from "@/components/SchemaTabs";
import { MediaGallery, type GalleryItem } from "@/components/MediaGallery";
import { InspectionHistoryTimeline } from "@/components/InspectionHistoryTimeline";

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

const SECTION_LABELS: Record<string, string> = {
  bodyElements: "Кузов и ЛКП",
  bodyReinforcementElements: "Усиление кузова",
  glassElements: "Стёкла",
  interiorElements: "Салон",
  underHoodElements: "Под капотом",
  wheelsAndBrakesElements: "Колёса и тормоза",
  lightningElements: "Освещение",
  computerDiagnosticsElements: "Диагностика",
};
const SECTION_KEYS = [
  "bodyElements",
  "bodyReinforcementElements",
  "glassElements",
  "interiorElements",
  "underHoodElements",
  "wheelsAndBrakesElements",
  "lightningElements",
  "computerDiagnosticsElements",
] as const;

const SECTION_ICONS: Record<string, React.ReactNode> = {
  bodyElements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <circle cx="7.5" cy="16" r="1.5" /><circle cx="16.5" cy="16" r="1.5" />
    </svg>
  ),
  bodyReinforcementElements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
    </svg>
  ),
  glassElements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" />
    </svg>
  ),
  interiorElements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path d="M6 21V10a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v11" />
      <path d="M6 14h12" />
    </svg>
  ),
  underHoodElements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <rect x="4" y="9" width="16" height="9" rx="1" /><path d="M8 9V6h8v3" />
      <path d="M2 14h2M20 14h2" />
    </svg>
  ),
  wheelsAndBrakesElements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </svg>
  ),
  lightningElements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  ),
  computerDiagnosticsElements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" />
    </svg>
  ),
};

const ELEMENT_LABEL: Record<string, string> = {
  general_condition: "Общее состояние",
  hood: "Капот",
  roof: "Крыша",
  trunk: "Крышка багажника",
  trunk_lid: "Крышка багажника",
  front_bumper: "Передний бампер",
  rear_bumper: "Задний бампер",
  front_left_fender: "Переднее левое крыло",
  front_right_fender: "Переднее правое крыло",
  rear_left_fender: "Заднее левое крыло",
  rear_right_fender: "Заднее правое крыло",
  front_left_door: "Передняя левая дверь",
  front_right_door: "Передняя правая дверь",
  rear_left_door: "Задняя левая дверь",
  rear_right_door: "Задняя правая дверь",
  left_threshold: "Левый порог",
  right_threshold: "Правый порог",
  srs_airbag: "SRS / Подушки безопасности",
  windshield: "Лобовое стекло",
  rear_window: "Заднее стекло",
};

const STEP_LABELS: Record<string, string> = {
  car: "Авто",
  characteristics: "Характеристики",
  documents: "ПТС/СТС",
  legal: "Юр. проверка",
  inspection: "Осмотр",
  testDrive: "Тест-драйв",
  result: "Заключение",
};

type Status = "ok" | "minor" | "major";
type EnrichedElement = InspectionElement & {
  _status: Status;
  _category: string;
  _displayName: string;
  _sectionKey: string;
};

function elementStatus(el: InspectionElement): Status {
  if (el.seriousDamageTags.length > 0) return "major";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}
function fmtMileage(km: number | null | undefined) {
  if (km == null) return "—";
  return km.toLocaleString("ru-RU") + " км";
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return d;
  }
}
function statusMeta(s: Status) {
  if (s === "ok")
    return { icon: "✓", label: "Норма", bg: "var(--grade-good)", fg: "white" };
  if (s === "minor")
    return {
      icon: "!",
      label: "Незначительные повреждения",
      bg: "var(--grade-warn)",
      fg: "oklch(0.25 0.05 70)",
    };
  return { icon: "✕", label: "Серьёзные повреждения", bg: "var(--grade-bad)", fg: "white" };
}

function isImageFile(file: FileRef | null | undefined) {
  if (!file?.url) return false;
  const t = (file.type || "").toLowerCase();
  const ext = file.url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return t.includes("image") || ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext);
}
function isVideoFile(file: FileRef | null | undefined) {
  if (!file?.url) return false;
  const t = (file.type || "").toLowerCase();
  const url = file.url;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return (
    t.includes("video") ||
    ext === "m3u8" ||
    url.includes(".m3u8") ||
    ["mp4", "webm", "mov"].includes(ext)
  );
}

/* ===== Section status card ===== */
function sectionSummary(elements: EnrichedElement[]) {
  if (elements.length === 0) return { status: null as Status | null, summary: "—" };
  let major = 0, minor = 0, ok = 0;
  for (const e of elements) {
    if (e._status === "major") major++;
    else if (e._status === "minor") minor++;
    else ok++;
  }
  const status: Status = major > 0 ? "major" : minor > 0 ? "minor" : "ok";
  const damaged = elements.filter((e) => e._status !== "ok");
  let summary: string;
  if (status === "ok") {
    summary = "Замечаний не выявлено. Все элементы в норме.";
  } else {
    const top = damaged[0];
    const tag =
      top?.seriousDamageTags[0]?.name ?? top?.noSeriousDamageTags[0]?.name;
    const count = damaged.length;
    summary =
      `Замечания по ${count} ${pluralize(count, "элементу", "элементам", "элементам")}` +
      (tag ? `: ${tag.toLowerCase()}.` : ".");
  }
  return { status, summary };
}
function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function SectionCard({
  sectionKey,
  elements,
}: {
  sectionKey: string;
  elements: EnrichedElement[];
}) {
  const { status } = sectionSummary(elements);
  const labelText =
    status === "ok"
      ? "Хорошо"
      : status === "minor"
        ? "Внимание"
        : status === "major"
          ? "Замечания"
          : "Нет данных";
  const meta = status ? statusMeta(status) : null;

  // Collect tags with severity
  const tags: Array<{ name: string; severe: boolean }> = [];
  for (const el of elements) {
    for (const t of el.seriousDamageTags) tags.push({ name: t.name, severe: true });
    for (const t of el.noSeriousDamageTags) tags.push({ name: t.name, severe: false });
  }

  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground"
            style={{ background: "oklch(0.96 0.005 250)" }}
          >
            {SECTION_ICONS[sectionKey]}
          </span>
          <span className="text-sm font-semibold ink">
            {SECTION_LABELS[sectionKey] ?? sectionKey}
          </span>
        </div>
        {meta && (
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
            style={{ background: meta.bg, color: meta.fg }}
          >
            {labelText}
          </span>
        )}
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border"
              style={{
                background: t.severe
                  ? "color-mix(in oklab, var(--grade-bad) 12%, white)"
                  : "color-mix(in oklab, var(--grade-warn) 18%, white)",
                borderColor: t.severe ? "var(--grade-bad)" : "var(--grade-warn)",
                color: "var(--foreground)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: t.severe ? "var(--grade-bad)" : "var(--grade-warn)",
                }}
                aria-label={t.severe ? "Серьёзное" : "Незначительное"}
              />
              {t.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground leading-snug">
          Замечаний не выявлено. Все элементы в норме.
        </p>
      )}
    </div>
  );
}


/* ===== Page ===== */
function AuctionSheetPage() {
  const { token } = Route.useSearch();
  const { data: report } = useSuspenseQuery(reportQuery(token));
  const carName = report.reportName.replace(/^.*·\s*/, "");

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const { sections, bodyElements, allElements, gallery, additional, heroImage, heroSrcSet } = useMemo(() => {
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
        _status: elementStatus(el),
        _category: SECTION_LABELS[key] ?? key,
        _displayName: ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " "),
        _sectionKey: key,
      }));
      body.push(...enriched);
      secs.push({ key, elements: enriched });
    }

    const all: EnrichedElement[] = [...body];
    const galleryItems: GalleryItem[] = [];

    // Elements with attached file get added to gallery
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

    // Per-step file groups
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
          id: -1 - idx,
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
        if (isInspection) {
          galleryItems.push(item);
        } else {
          additionalItems.push(item);
        }
      }
    }


    // Hero image: photo from carReference (по модификации).
    // Build srcSet so the browser picks the best match for screen width + DPR.
    const SIZE_WIDTHS: Record<string, number> = { s: 240, m: 300, l: 400, xl: 600 };
    const photos = (report.carReference ?? report.characteristicsStep?.carReference)?.photos ?? [];
    const srcSetEntries: string[] = [];
    for (const p of photos) {
      const base = SIZE_WIDTHS[p.size] ?? 300;
      if (p.urlX1) srcSetEntries.push(`${p.urlX1} ${base}w`);
      if (p.urlX2) srcSetEntries.push(`${p.urlX2} ${base * 2}w`);
    }
    const heroSrcSet = srcSetEntries.join(", ") || null;
    // Fallback src: prefer "m" then "s" then first; x2 by default
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
      bodyElements: body,
      allElements: all,
      gallery: galleryItems,
      additional: additionalItems,
      heroImage: hero,
      heroSrcSet,
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
    const yearsStr = yearStart
      ? `${yearStart}–${yearEnd ?? "н.в."}`
      : null;
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
      // Hide underlying content (in particular native <video> thumbnails,
      // which on iOS render in a separate compositor layer and can bleed
      // through fullscreen overlays) while the lightbox is open.
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
                  <SectionCard
                    key={s.key}
                    sectionKey={s.key}
                    elements={s.elements}
                  />

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

/* ===== Small subcomponents ===== */
function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold ink mt-0.5">{value}</span>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-md border border-border p-3 flex items-center justify-between bg-muted/30">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="text-base font-bold ink mono">{value}</span>
        {unit && <span className="mono text-[10px] text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
}

function CheckRow({
  label,
  ok,
  okLabel = "Соответствует",
  failLabel = "Не соответствует",
  skipLabel = "Не указано",
}: {
  label: string;
  ok: boolean | null;
  okLabel?: string;
  failLabel?: string;
  skipLabel?: string;
}) {
  const color = ok == null ? "var(--grade-skip)" : ok ? "var(--grade-good)" : "var(--grade-bad)";
  const text = ok == null ? skipLabel : ok ? okLabel : failLabel;
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-dashed border-border last:border-0">
      <span className="text-sm">{label}</span>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
        {text}
      </span>
    </div>
  );
}

function TestDriveCard({ report }: { report: CarReport }) {
  const td = report.testDriveStep;
  const done = !!td.testDriveIsIncluded;
  const rows = [
    { label: "Двигатель", ok: done ? td.testDriveEngineIsWorkingProperly : null, tags: done ? td.testDriveEngineTags : [] },
    { label: "Коробка передач", ok: done ? td.testDriveTransmissionIsWorkingProperly : null, tags: done ? td.testDriveTransmissionTags : [] },
    { label: "Рулевое управление", ok: done ? td.testDriveSteeringWheelIsWorkingProperly : null, tags: done ? td.testDriveSteeringWheelTags : [] },
    { label: "Подвеска в движении", ok: done ? td.testDriveSuspensionInDriveIsWorkingProperly : null, tags: done ? td.testDriveSuspensionInDriveTags : [] },
    { label: "Тормоза в движении", ok: done ? td.testDriveBrakesInDriveIsWorkingProperly : null, tags: done ? td.testDriveBrakesInDriveTags : [] },
  ];
  return (
    <div className="panel p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Тест-драйв
        </h3>
        <span
          className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border"
          style={{
            borderColor: done ? "var(--grade-good)" : "var(--grade-skip)",
            color: done ? "var(--grade-good)" : "var(--grade-skip)",
          }}
        >
          {done ? "Проведён" : "Не проводился"}
        </span>
      </div>
      <div>
        {rows.map((r) => (
          <div key={r.label} className="py-1.5 border-b border-dashed border-border last:border-0">
            <CheckRow label={r.label} ok={r.ok} okLabel="В порядке" failLabel="Неисправно" skipLabel="—" />
            {r.tags && r.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {r.tags.map((t) => (
                  <span
                    key={t.id}
                    className="inline-block px-1.5 py-0.5 rounded text-[11px] border"
                    style={{
                      borderColor: t.type === "serious" ? "var(--grade-bad)" : "var(--grade-warn)",
                      color: t.type === "serious" ? "var(--grade-bad)" : "var(--grade-warn)",
                    }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {td.testDriveNote && (
        <p className="mt-3 text-sm text-muted-foreground italic whitespace-pre-line">
          {td.testDriveNote}
        </p>
      )}
    </div>
  );
}

/* ===== Gallery tile ===== */
function GalleryTileBody({ item }: { item: GalleryItem }) {
  const file = item.file;
  const url = file.url;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const isHls = ext === "m3u8" || url.includes(".m3u8");
  const isImage = isImageFile(file);
  return (
    <>
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {isImage ? (
          <img src={url} alt={item.caption} loading="lazy" className="w-full h-full object-cover" />
        ) : item.isVideo ? (
          <>
            <VideoThumb url={url} isHls={isHls} />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 10 10" fill="white">
                  <path d="M2 1l7 4-7 4z" />
                </svg>
              </span>
            </span>
            <span className="absolute bottom-1.5 right-1.5 mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/55 text-white">
              {isHls ? "HLS" : "Видео"}
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M4 14l4-4 4 4 4-4 4 4" />
            </svg>
          </div>
        )}
        {item.isDamage && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
            style={{ background: "var(--grade-bad)", color: "white" }}>
            замечание
          </span>
        )}
      </div>
      <div className="px-2 py-1.5 border-t border-border bg-card">
        <div className="text-xs font-medium ink truncate">{item.caption}</div>
        <div className="text-[10px] text-muted-foreground truncate">
          {SECTION_LABELS[item.sectionKey] ?? STEP_LABELS[item.sectionKey] ?? item.sectionKey}
        </div>
      </div>
    </>
  );
}

function VideoThumb({ url, isHls }: { url: string; isHls: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let hls: any;
    if (isHls) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        let cancelled = false;
        import("hls.js").then(({ default: Hls }) => {
          if (cancelled) return;
          if (Hls.isSupported()) {
            hls = new Hls({ maxBufferLength: 1 });
            hls.loadSource(url);
            hls.attachMedia(video);
          } else {
            video.src = url;
          }
        });
        return () => {
          cancelled = true;
          if (hls) hls.destroy();
        };
      }
    } else {
      video.src = url.includes("#") ? url : `${url}#t=0.1`;
    }
  }, [url, isHls]);
  return (
    <video
      ref={ref}
      muted
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
    />
  );
}
