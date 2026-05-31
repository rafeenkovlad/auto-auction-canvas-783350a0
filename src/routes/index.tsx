import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getReport,
  type CarReport,
  type InspectionElement,
  type FileRef,
} from "@/lib/report.functions";
import { BodyMap } from "@/components/CarDiagram";

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

const SECTIONS: Array<{ key: keyof CarReport["inspectionStep"]; label: string }> = [
  { key: "bodyElements", label: "Кузов" },
  { key: "bodyReinforcementElements", label: "Силовые элементы" },
  { key: "glassElements", label: "Остекление" },
  { key: "interiorElements", label: "Салон" },
  { key: "underHoodElements", label: "Подкапотное" },
  { key: "wheelsAndBrakesElements", label: "Колёса и тормоза" },
  { key: "lightningElements", label: "Световые приборы" },
  { key: "computerDiagnosticsElements", label: "Компьютерная диагностика" },
];

const ELEMENT_LABEL: Record<string, string> = {
  general_condition: "Общее состояние",
  hood: "Капот",
  roof: "Крыша",
  trunk: "Крышка багажника",
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
};

type Status = "ok" | "minor" | "serious" | "skipped";
function elementStatus(el: InspectionElement): "ok" | "minor" | "serious" {
  if (el.seriousDamageTags.length > 0) return "serious";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}
function elementScore(el: InspectionElement): number {
  const s = elementStatus(el);
  if (s === "serious") return 1.5;
  if (s === "minor") return 2.5;
  return 4.5;
}
function sectionStatus(els: InspectionElement[]): Status {
  if (els.length === 0) return "skipped";
  let s: "ok" | "minor" | "serious" = "ok";
  for (const e of els) {
    const st = elementStatus(e);
    if (st === "serious") return "serious";
    if (st === "minor") s = "minor";
  }
  return s;
}
function sectionScore(els: InspectionElement[]): number {
  if (els.length === 0) return 0;
  const sum = els.reduce((a, e) => a + elementScore(e), 0);
  return Math.round((sum / els.length) * 10) / 10;
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
function overallReportScore(r: CarReport): number {
  const scores: number[] = [];
  for (const { key } of SECTIONS) {
    const arr = r.inspectionStep[key] as InspectionElement[];
    if (arr.length) scores.push(sectionScore(arr));
  }
  if (!scores.length) return 0;
  const s = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(s * 10) / 10;
}
function chipClass(s: Status) {
  return s === "ok"
    ? "grade-chip grade-good"
    : s === "minor"
      ? "grade-chip grade-warn"
      : s === "serious"
        ? "grade-chip grade-bad"
        : "grade-chip grade-skip";
}
function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

/* ===== Detail element card (compact) ===== */
function ElementCard({ el }: { el: InspectionElement }) {
  const st = elementStatus(el);
  const label = ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " ");
  return (
    <div className="panel overflow-hidden flex flex-col">
      <Photo file={el.file} />
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight">{label}</h4>
          <span className={chipClass(st)}>{elementScore(el).toFixed(1)}</span>
        </div>
        {el.paintworkThicknessFrom != null && el.paintworkThicknessTo != null && (
          <div className="mono text-[10px] text-muted-foreground">
            ЛКП {el.paintworkThicknessFrom}–{el.paintworkThicknessTo} мкм
          </div>
        )}
        {(el.seriousDamageTags.length > 0 || el.noSeriousDamageTags.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {el.seriousDamageTags.map((t) => (
              <span
                key={t.id}
                className="text-[10px] px-1.5 py-0.5 rounded mono"
                style={{
                  background: "color-mix(in oklab, var(--grade-bad) 15%, transparent)",
                  color: "var(--grade-bad)",
                }}
              >
                {t.name}
              </span>
            ))}
            {el.noSeriousDamageTags.map((t) => (
              <span
                key={t.id}
                className="text-[10px] px-1.5 py-0.5 rounded mono"
                style={{
                  background: "color-mix(in oklab, var(--grade-warn) 22%, transparent)",
                  color: "oklch(0.4 0.12 70)",
                }}
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
        {el.note && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-3">
            {el.note}
          </p>
        )}
      </div>
    </div>
  );
}

function Photo({ file }: { file: FileRef | null | undefined }) {
  if (!file?.url || file.type !== "image") {
    return (
      <div
        className="bg-muted flex items-center justify-center text-muted-foreground mono text-[10px] uppercase tracking-wider"
        style={{ aspectRatio: "4/3" }}
      >
        Нет фото
      </div>
    );
  }
  return (
    <img
      src={file.url}
      alt={file.filename}
      loading="lazy"
      className="w-full object-cover"
      style={{ aspectRatio: "4/3" }}
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
function AuctionSheetPage() {
  const { token } = Route.useSearch();
  const { data: report } = useSuspenseQuery(reportQuery(token));
  const carName = report.reportName.replace(/^.*·\s*/, "");
  const overall = overallReportScore(report);

  return (
    <main className="min-h-screen py-6 px-3 md:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header panel */}
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
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Overall
              </span>
              <span
                className={`grade-chip ${
                  overall >= 4
                    ? "grade-good"
                    : overall >= 2.5
                      ? "grade-warn"
                      : "grade-bad"
                }`}
                style={{ minWidth: 44, height: 28, fontSize: 13 }}
              >
                {overall.toFixed(1)}
              </span>
            </div>
          </div>
        </header>

        {/* Section status grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {SECTIONS.map(({ key, label }) => {
            const arr = report.inspectionStep[key] as InspectionElement[];
            const st = sectionStatus(arr);
            const sc = sectionScore(arr);
            return (
              <div
                key={key}
                className="panel px-3 py-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                    {label}
                  </div>
                  <div className="text-xs mono ink">{arr.length} эл.</div>
                </div>
                {st === "skipped" ? (
                  <span className="grade-chip grade-skip">—</span>
                ) : (
                  <span className={chipClass(st)}>{sc.toFixed(1)}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Body map (Exterior Grading) */}
        <BodyMap
          elements={report.inspectionStep.bodyElements}
          overallScore={sectionScore(report.inspectionStep.bodyElements)}
        />

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

        {/* Detailed inspection per section */}
        {SECTIONS.map(({ key, label }) => {
          const els = report.inspectionStep[key] as InspectionElement[];
          if (els.length === 0) return null;
          const st = sectionStatus(els);
          const sc = sectionScore(els);
          return (
            <div key={key} className="panel p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {els.length}{" "}
                    {plural(els.length, ["элемент", "элемента", "элементов"])}{" "}
                    осмотрено
                  </p>
                </div>
                <span className={chipClass(st)} style={{ minWidth: 40, height: 24 }}>
                  {sc.toFixed(1)}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {els.map((e) => (
                  <ElementCard key={e.id} el={e} />
                ))}
              </div>
            </div>
          );
        })}

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
    </main>
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
