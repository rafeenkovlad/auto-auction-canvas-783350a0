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

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      className="panel text-left p-3 md:p-4 transition-all hover:-translate-y-px hover:shadow-sm"
      style={{
        borderColor: active ? "var(--accent)" : undefined,
        background: active ? "var(--row-bg)" : undefined,
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
        {hasMedia && (
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
        )}
      </div>
      {el.note && (
        <p className="mt-2 pt-2 border-t border-dashed border-border text-xs leading-snug text-muted-foreground whitespace-pre-line line-clamp-3">
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

  const allElements = useMemo<EnrichedElement[]>(() => {
    const out: EnrichedElement[] = [];
    for (const key of SECTION_KEYS) {
      const arr = report.inspectionStep[key] as InspectionElement[] | undefined;
      if (!arr) continue;
      for (const el of arr) {
        out.push({
          ...el,
          _status: elementStatus(el),
          _category: SECTION_LABELS[key] ?? key,
          _displayName:
            ELEMENT_LABEL[el.elementType] ??
            el.elementType.replace(/_/g, " "),
        });
      }
    }
    return out;
  }, [report]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? allElements
        : allElements.filter((e) => e._status === filter),
    [allElements, filter],
  );

  const counts = useMemo(() => {
    const c = { all: allElements.length, ok: 0, minor: 0, major: 0 };
    for (const e of allElements) c[e._status]++;
    return c;
  }, [allElements]);


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
              </span>
              <span>Пробег: {fmtMileage(report.carStep.mileage)}</span>
              <span>{report.carStep.cityInspection ?? "—"}</span>
              <span>{fmtDate(report.carStep.dateInspection ?? report.reportDate)}</span>
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

          {visible.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">
              Нет элементов в этой категории
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map((el) => {
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
        </section>

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
            <CheckRow
              label="Количество владельцев указано"
              ok={
                report.documentReconciliationStep.ownersCount != null ? true : null
              }
            />
          </div>
        </div>

        {/* Test drive */}
        {report.testDriveStep.testDriveIsIncluded && (
          <div className="panel p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Тест-драйв
            </h3>
            <div className="grid md:grid-cols-2 gap-x-8">
              <CheckRow
                label="Двигатель"
                ok={report.testDriveStep.testDriveEngineIsWorkingProperly}
              />
              <CheckRow
                label="Коробка передач"
                ok={report.testDriveStep.testDriveTransmissionIsWorkingProperly}
              />
              <CheckRow
                label="Рулевое управление"
                ok={report.testDriveStep.testDriveSteeringWheelIsWorkingProperly}
              />
              <CheckRow
                label="Подвеска в движении"
                ok={
                  report.testDriveStep.testDriveSuspensionInDriveIsWorkingProperly
                }
              />
              <CheckRow
                label="Тормоза в движении"
                ok={report.testDriveStep.testDriveBrakesInDriveIsWorkingProperly}
              />
            </div>
            {report.testDriveStep.testDriveNote && (
              <p className="mt-3 text-sm text-muted-foreground italic">
                {report.testDriveStep.testDriveNote}
              </p>
            )}
          </div>
        )}

        {/* Specialist note */}
        {report.resultStep.resultSpecialistNote && (
          <div className="panel p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Заключение специалиста
            </h3>
            <div
              className="border-l-4 pl-4 py-1"
              style={{ borderColor: "var(--grade-good)" }}
            >
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {report.resultStep.resultSpecialistNote}
              </p>
            </div>
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
