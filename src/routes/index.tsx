import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getReport,
  type CarReport,
  type InspectionElement,
  type FileRef,
} from "@/lib/report.functions";
import { ElementViewer } from "@/components/ElementViewer";

const reportQuery = (token?: string) =>
  queryOptions({
    queryKey: ["report", token ?? "default"],
    queryFn: () => getReport({ data: token ? { token } : undefined }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(reportQuery(deps.token)),
  head: () => ({
    meta: [
      { title: "Inspection Report — Аукционный лист" },
      {
        name: "description",
        content:
          "Подробный отчёт о техническом состоянии автомобиля в формате инспекционного листа.",
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

const SECTION_LABELS: Record<keyof CarReport["inspectionStep"] | string, string> = {
  bodyElements: "Кузов",
  bodyReinforcementElements: "Усиление кузова",
  glassElements: "Стёкла",
  interiorElements: "Салон",
  underHoodElements: "Под капотом",
  wheelsAndBrakesElements: "Колёса и тормоза",
  lightningElements: "Освещение",
  computerDiagnosticsElements: "Компьютерная диагностика",
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
      month: "long",
      day: "numeric",
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
  return {
    icon: "✕",
    label: "Серьёзные повреждения",
    bg: "var(--grade-bad)",
    fg: "white",
  };
}

const SECTION_HUE: Record<string, string> = {
  bodyElements: "oklch(0.7 0.16 240)",
  bodyReinforcementElements: "oklch(0.65 0.18 285)",
  glassElements: "oklch(0.75 0.13 210)",
  interiorElements: "oklch(0.72 0.14 60)",
  underHoodElements: "oklch(0.65 0.2 30)",
  wheelsAndBrakesElements: "oklch(0.55 0.04 250)",
  lightningElements: "oklch(0.82 0.16 95)",
  computerDiagnosticsElements: "oklch(0.7 0.16 145)",
};
function sectionColor(key: string) {
  return SECTION_HUE[key] ?? "oklch(0.7 0.02 250)";
}


/* ===== Card ===== */
function ElementCard({
  el,
  active,
  onClick,
  cardRef,
}: {
  el: EnrichedElement;
  active: boolean;
  onClick: () => void;
  cardRef?: (node: HTMLButtonElement | null) => void;
}) {
  const meta = statusMeta(el._status);
  const damageCount =
    el.seriousDamageTags.length + el.noSeriousDamageTags.length;
  const hasMedia = el.file?.url != null;
  const paint =
    el.paintworkThicknessFrom != null && el.paintworkThicknessTo != null
      ? `${el.paintworkThicknessFrom}–${el.paintworkThicknessTo}`
      : null;

  const tags = [
    ...el.seriousDamageTags.map((t) => ({ id: t.id, name: t.name, severe: true })),
    ...el.noSeriousDamageTags.map((t) => ({ id: t.id, name: t.name, severe: false })),
  ];

  const tint =
    el._status === "major"
      ? "color-mix(in oklab, var(--grade-bad) 14%, var(--card))"
      : el._status === "minor"
        ? "color-mix(in oklab, var(--grade-warn) 18%, var(--card))"
        : "color-mix(in oklab, var(--grade-good) 10%, var(--card))";
  const borderTint =
    el._status === "major"
      ? "color-mix(in oklab, var(--grade-bad) 40%, var(--border))"
      : el._status === "minor"
        ? "color-mix(in oklab, var(--grade-warn) 45%, var(--border))"
        : "color-mix(in oklab, var(--grade-good) 30%, var(--border))";

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      className="panel text-left p-3 md:p-4 transition-all hover:-translate-y-px hover:shadow-sm w-full mb-3 break-inside-avoid inline-block align-top"
      style={{
        background: tint,
        borderColor: active ? "var(--accent)" : borderTint,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            {el._category}
          </div>
          <div className="text-sm font-semibold ink leading-tight">
            {el._displayName}
          </div>
        </div>
        <span
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold shrink-0"
          style={{ background: meta.bg, color: meta.fg }}
          aria-label={meta.label}
        >
          {meta.icon}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {paint && (
          <span className="mono text-[12px]">{paint} мкм</span>
        )}
        {hasMedia && (
          <span className="inline-flex items-center gap-1" title="Есть медиа">
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="2" y="3" width="10" height="8" rx="1" />
              <circle cx="5" cy="6" r="1" />
              <path d="M10 9L8 7L5 10" />
            </svg>
          </span>
        )}
        {damageCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="7" cy="7" r="5" />
              <path d="M7 4v3M7 9.5v.5" />
            </svg>
            {damageCount}
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span
              key={t.id}
              className="inline-block px-1.5 py-0.5 rounded text-[11px] leading-tight border"
              style={{
                borderColor: t.severe
                  ? "var(--grade-bad)"
                  : "var(--grade-warn)",
                color: t.severe ? "var(--grade-bad)" : "var(--grade-warn)",
                background: "transparent",
              }}
            >
              {t.name}
            </span>
          ))}
        </div>
      )}
      {el.note && (
        <p className="mt-2 pt-2 border-t border-dashed border-border text-xs leading-snug text-muted-foreground whitespace-pre-line">
          {el.note}
        </p>
      )}
    </button>
  );
}

function Photo({ file }: { file: FileRef | null | undefined }) {
  if (!file?.url || file.type !== "image") return null;
  return (
    <img
      src={file.url}
      alt={file.filename}
      loading="lazy"
      className="w-full rounded-md border border-border object-cover"
      style={{ maxHeight: 360 }}
    />
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean | null }) {
  const color =
    ok == null ? "var(--grade-skip)" : ok ? "var(--grade-good)" : "var(--grade-bad)";
  const sym = ok == null ? "—" : ok ? "✓" : "✕";
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-dashed border-border last:border-0">
      <span className="text-sm">{label}</span>
      <span className="mono text-base font-bold" style={{ color }}>
        {sym}
      </span>
    </div>
  );
}

/* ===== Page ===== */
const FILTERS: Array<{ key: "all" | Status; label: string }> = [
  { key: "all", label: "Все" },
  { key: "ok", label: "Норма" },
  { key: "minor", label: "Незначит." },
  { key: "major", label: "Серьёзные" },
];

function AuctionSheetPage() {
  const { token } = Route.useSearch();
  const { data: report } = useSuspenseQuery(reportQuery(token));
  const carName = report.reportName.replace(/^.*·\s*/, "");

  const [filter, setFilter] = useState<"all" | Status>("all");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const setCardRef = (id: number) => (node: HTMLButtonElement | null) => {
    if (node) cardRefs.current.set(id, node);
    else cardRefs.current.delete(id);
  };

  const handleSheetClose = () => {
    const el = activeIdx != null ? allElements[activeIdx] : null;
    setActiveIdx(null);
    if (el) {
      requestAnimationFrame(() => {
        const node = cardRefs.current.get(el.id);
        if (node) {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
          node.focus({ preventScroll: true });
        }
      });
    }
  };

  const { inspectionSections, bodyElements, allElements, stepFiles } = useMemo(() => {
    const sections: Array<{ key: string; label: string; elements: EnrichedElement[] }> = [];
    const body: EnrichedElement[] = [];
    for (const key of SECTION_KEYS) {
      const arr = report.inspectionStep[key] as InspectionElement[] | undefined;
      if (!arr || arr.length === 0) continue;
      const enriched: EnrichedElement[] = arr.map((el) => ({
        ...el,
        _status: elementStatus(el),
        _category: SECTION_LABELS[key] ?? key,
        _displayName:
          ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " "),
        _sectionKey: key,
      }));

      body.push(...enriched);
      sections.push({ key, label: SECTION_LABELS[key] ?? key, elements: enriched });
    }

    // Per-step file groups (kept inside each step's own panel)
    const fileSources: Array<{ key: string; files: (FileRef | null | undefined)[] }> = [
      { key: "car", files: [report.carStep.listingFile, ...(report.carStep.files ?? [])] },
      { key: "characteristics", files: report.characteristicsStep?.files ?? [] },
      { key: "documents", files: report.documentReconciliationStep.files ?? [] },
      { key: "legal", files: report.legalReviewStep?.files ?? [] },
      { key: "inspection", files: report.inspectionStep.files ?? [] },
      { key: "testDrive", files: report.testDriveStep.files ?? [] },
      { key: "result", files: report.resultStep.files ?? [] },
    ];

    const all: EnrichedElement[] = [...body];
    const filesMap: Record<string, Array<{ file: FileRef; idx: number }>> = {};
    for (const src of fileSources) {
      const items: Array<{ file: FileRef; idx: number }> = [];
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
          _category: src.key,
          _displayName: f.filename || src.key,
          _sectionKey: src.key,

        };
        all.push(pseudo);
        items.push({ file: f, idx });
      }
      filesMap[src.key] = items;
    }

    return {
      inspectionSections: sections,
      bodyElements: body,
      allElements: all,
      stepFiles: filesMap,
    };
  }, [report]);

  const visibleElements = useMemo(() => {
    if (filter === "all") return bodyElements;
    return bodyElements.filter((e) => e._status === filter);
  }, [bodyElements, filter]);


  const counts = useMemo(() => {
    const c = { all: bodyElements.length, ok: 0, minor: 0, major: 0 };
    for (const e of bodyElements) c[e._status]++;
    return c;
  }, [bodyElements]);



  return (
    <main className="min-h-screen py-6 px-3 md:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <header className="panel p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Inspection Report · {report.reportNumber}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold ink leading-tight">
              {carName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>
                VIN: <span className="mono ink">{report.vin}</span>
                {report.carStep.unreadableVin && (
                  <span
                    className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] border align-middle"
                    style={{ borderColor: "var(--grade-bad)", color: "var(--grade-bad)" }}
                  >
                    нечитаемый
                  </span>
                )}
              </span>
              <span>
                Пробег: {fmtMileage(report.carStep.mileage)}
                {report.carStep.visuallyMileageNotMatchCondition && (
                  <span
                    className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] border align-middle"
                    style={{ borderColor: "var(--grade-warn)", color: "var(--grade-warn)" }}
                  >
                    не соответствует состоянию
                  </span>
                )}
              </span>
              <span>{report.carStep.cityInspection ?? "—"}</span>
              <span>{fmtDate(report.carStep.dateInspection ?? report.reportDate)}</span>
              {report.carStep.uriListing && (
                <a
                  href={report.carStep.uriListing}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground"
                >
                  Объявление ↗
                </a>
              )}
            </div>
          </div>
          {report.carStep.gosNumber && (
            <div className="flex flex-col items-center justify-center px-3 py-1.5 border-2 border-foreground bg-white rounded-sm">
              <span className="mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Гос. номер
              </span>
              <span className="mono text-base font-bold ink tracking-wider">
                {report.carStep.gosNumber}
              </span>
            </div>
          )}
        </header>


        {/* Body / paint summary */}
        <div className="grid sm:grid-cols-3 gap-2">
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
          <Stat
            label="Владельцев"
            value={report.carStep.ownersCount?.toString() ?? "—"}
          />
        </div>

        {/* Characteristics */}
        {(() => {
          const c = report.characteristicsStep;
          const rows: Array<[string, string | null | undefined]> = c
            ? [
                ["Двигатель", c.engineType],
                ["Объём", c.engineVolume],
                ["КПП", c.transmission],
                ["Привод", c.driveType],
                ["Цвет", c.color],
                ["Комплектация", c.equipment],
              ]
            : [];
          const filled = rows.filter(([, v]) => v != null && v !== "");
          const files = stepFiles.characteristics ?? [];
          if (filled.length === 0 && files.length === 0) return null;
          return (
            <div className="panel p-5 md:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Характеристики
              </h3>
              {filled.length > 0 && (
                <dl className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  {filled.map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-1.5">
                      <dt className="text-muted-foreground text-xs">{k}</dt>
                      <dd className="ink font-medium text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {files.length > 0 && (
                <div className={filled.length > 0 ? "mt-4" : ""}>
                  <FilesGrid items={files} onOpen={setActiveIdx} />
                </div>
              )}
            </div>
          );
        })()}


        {/* Inspection elements */}
        <section className="panel p-5 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-bold ink">
              Осмотр элементов кузова
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                const count = counts[f.key];
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                    style={{
                      background: isActive ? "var(--accent)" : "var(--card)",
                      color: isActive
                        ? "var(--accent-foreground)"
                        : "var(--foreground)",
                      borderColor: isActive ? "var(--accent)" : "var(--border)",
                    }}
                  >
                    {f.label}
                    <span className="ml-1.5 mono opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {visibleElements.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">
              Нет элементов в этой категории
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
              {visibleElements.map((el) => {
                const idx = allElements.indexOf(el);
                return (
                  <ElementCard
                    key={el.id}
                    el={el}
                    active={activeIdx === idx}
                    onClick={() => setActiveIdx(idx)}
                    cardRef={setCardRef(el.id)}
                  />
                );
              })}
            </div>
          )}


          {stepFiles.inspection && stepFiles.inspection.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Общие файлы осмотра
              </div>
              <FilesGrid items={stepFiles.inspection} onOpen={setActiveIdx} />
            </div>
          )}
        </section>

        {/* Car step files */}
        {stepFiles.car && stepFiles.car.length > 0 && (
          <div className="panel p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Объявление и фото авто
            </h3>
            <FilesGrid items={stepFiles.car} onOpen={setActiveIdx} />
          </div>
        )}

        {/* Document reconciliation */}
        <div className="panel p-5 md:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Сверка ПТС / СТС
          </h3>
          <div className="grid md:grid-cols-2 gap-x-8">
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
          {stepFiles.documents && stepFiles.documents.length > 0 && (
            <div className="mt-4">
              <FilesGrid items={stepFiles.documents} onOpen={setActiveIdx} />
            </div>
          )}
        </div>

        {/* Legal review (files-only step) */}
        {stepFiles.legal && stepFiles.legal.length > 0 && (
          <div className="panel p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Юридическая проверка
            </h3>
            <FilesGrid items={stepFiles.legal} onOpen={setActiveIdx} />
          </div>
        )}


        {/* Test drive */}
        {report.testDriveStep.testDriveIsIncluded && (() => {
          const td = report.testDriveStep;
          const rows: Array<{ label: string; ok: boolean | null; tags: typeof td.testDriveEngineTags }> = [
            { label: "Двигатель", ok: td.testDriveEngineIsWorkingProperly, tags: td.testDriveEngineTags },
            { label: "Коробка передач", ok: td.testDriveTransmissionIsWorkingProperly, tags: td.testDriveTransmissionTags },
            { label: "Рулевое управление", ok: td.testDriveSteeringWheelIsWorkingProperly, tags: td.testDriveSteeringWheelTags },
            { label: "Подвеска в движении", ok: td.testDriveSuspensionInDriveIsWorkingProperly, tags: td.testDriveSuspensionInDriveTags },
            { label: "Тормоза в движении", ok: td.testDriveBrakesInDriveIsWorkingProperly, tags: td.testDriveBrakesInDriveTags },
          ];
          return (
            <div className="panel p-5 md:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Тест-драйв
              </h3>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.label} className="py-2 border-b border-dashed border-border last:border-0">
                    <CheckRow label={r.label} ok={r.ok} />
                    {r.tags && r.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.tags.map((t) => (
                          <span
                            key={t.id}
                            className="inline-block px-1.5 py-0.5 rounded text-[11px] border"
                            style={{
                              borderColor:
                                t.type === "serious"
                                  ? "var(--grade-bad)"
                                  : "var(--grade-warn)",
                              color:
                                t.type === "serious"
                                  ? "var(--grade-bad)"
                                  : "var(--grade-warn)",
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
              {stepFiles.testDrive && stepFiles.testDrive.length > 0 && (
                <div className="mt-4">
                  <FilesGrid items={stepFiles.testDrive} onOpen={setActiveIdx} />
                </div>
              )}
            </div>
          );
        })()}


        {/* Summary inspection note */}
        {report.resultStep.summaryInspectionNote &&
          report.resultStep.summaryInspectionNote !==
            report.resultStep.resultSpecialistNote && (
            <div className="panel p-5 md:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Итог осмотра
              </h3>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {report.resultStep.summaryInspectionNote}
              </p>
            </div>
          )}

        {/* Specialist note */}
        {(report.resultStep.resultSpecialistNote ||
          (stepFiles.result && stepFiles.result.length > 0)) && (
          <div className="panel p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Заключение специалиста
            </h3>
            {report.resultStep.resultSpecialistNote && (
              <div
                className="border-l-4 pl-4 py-1"
                style={{ borderColor: "var(--grade-good)" }}
              >
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {report.resultStep.resultSpecialistNote}
                </p>
              </div>
            )}
            {stepFiles.result && stepFiles.result.length > 0 && (
              <div className={report.resultStep.resultSpecialistNote ? "mt-4" : ""}>
                <FilesGrid items={stepFiles.result} onOpen={setActiveIdx} />
              </div>
            )}
          </div>
        )}

        <footer className="text-center mono text-[11px] text-muted-foreground py-4">
          Сгенерировано на основе данных carreports.ru · {report.reportNumber}
        </footer>
      </div>



      <ElementViewer
        elements={allElements}
        index={activeIdx}
        onClose={handleSheetClose}
        onChange={(i) => setActiveIdx(i)}
        statusMeta={statusMeta}
      />
    </main>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="panel p-3 flex items-center justify-between">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="text-lg font-bold ink mono">{value}</span>
        {unit && <span className="mono text-[10px] text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
}

function FileTile({ file, onClick }: { file: FileRef; onClick: () => void }) {
  const t = (file.type || "").toLowerCase();
  const url = file.url;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const isPdf = t.includes("pdf") || ext === "pdf";
  const isHls = ext === "m3u8" || url.includes(".m3u8");
  const isVideo = t.includes("video") || isHls || ["mp4", "webm", "mov"].includes(ext);
  const isAudio = t.includes("audio") || ["mp3", "wav", "m4a", "ogg"].includes(ext);
  const isImage = !isPdf && !isVideo && !isAudio && (t.includes("image") || ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext));

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted/40 hover:border-accent transition-colors"
      title={file.filename}
    >
      {isImage ? (
        <img src={url} alt={file.filename} loading="lazy" className="w-full h-full object-cover" />
      ) : isVideo && !isHls ? (
        <>
          <video src={url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white"><path d="M2 1l7 4-7 4z" /></svg>
            </span>
          </span>
        </>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            {isPdf ? (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </>
            ) : isVideo ? (
              <>
                <rect x="3" y="6" width="14" height="12" rx="1.5" />
                <path d="M17 10l4-2v8l-4-2z" />
              </>
            ) : isAudio ? (
              <>
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </>
            ) : (
              <>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M4 14l4-4 4 4 4-4 4 4" />
              </>
            )}
          </svg>
          <span className="mono text-[9px] uppercase tracking-wider">
            {isPdf ? "PDF" : isVideo ? (isHls ? "HLS" : "Видео") : isAudio ? "Аудио" : ext || "файл"}
          </span>
        </span>
      )}
    </button>
  );
}

function FilesGrid({
  items,
  onOpen,
}: {
  items: Array<{ file: FileRef; idx: number }>;
  onOpen: (idx: number) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {items.map(({ file, idx }) => (
        <FileTile
          key={`${file.id}-${idx}`}
          file={file}
          onClick={() => onOpen(idx)}
        />
      ))}
    </div>
  );
}

