import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getReport, type CarReport, type InspectionElement, type FileRef } from "@/lib/report.functions";
import { CarDiagram } from "@/components/CarDiagram";

const reportQuery = (token?: string) =>
  queryOptions({
    queryKey: ["report", token ?? "default"],
    queryFn: () => getReport({ data: token ? { token } : undefined }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : undefined }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(reportQuery(deps.token)),
  head: () => ({
    meta: [
      { title: "Аукционный лист — отчёт об осмотре автомобиля" },
      { name: "description", content: "Подробный отчёт о техническом состоянии автомобиля в формате аукционного листа." },
    ],
  }),
  component: AuctionSheetPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="sheet p-8 max-w-lg text-center">
        <h1 className="text-2xl font-bold ink mb-2">Не удалось загрузить отчёт</h1>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

// ---------- labels ----------
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

const SECTIONS: Array<{ key: keyof CarReport["inspectionStep"]; label: string }> = [
  { key: "bodyElements", label: "Кузов" },
  { key: "bodyReinforcementElements", label: "Силовые элементы" },
  { key: "glassElements", label: "Остекление" },
  { key: "interiorElements", label: "Салон" },
  { key: "underHoodElements", label: "Подкапотное пространство" },
  { key: "wheelsAndBrakesElements", label: "Колёса и тормоза" },
  { key: "lightningElements", label: "Световые приборы" },
  { key: "computerDiagnosticsElements", label: "Компьютерная диагностика" },
];

// ---------- helpers ----------
function elementStatus(el: InspectionElement): "ok" | "minor" | "serious" {
  if (el.seriousDamageTags.length > 0) return "serious";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}
function sectionStatus(els: InspectionElement[]): "ok" | "minor" | "serious" | "skipped" {
  if (els.length === 0) return "skipped";
  let s: "ok" | "minor" | "serious" = "ok";
  for (const e of els) {
    const st = elementStatus(e);
    if (st === "serious") return "serious";
    if (st === "minor") s = "minor";
  }
  return s;
}
function fmtMileage(km: number | null | undefined) {
  if (km == null) return "—";
  return km.toLocaleString("ru-RU") + " км";
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d;
  }
}

// ---------- score ----------
function calcGrade(report: CarReport): { letter: string; score: number; tone: "good" | "warn" | "bad" } {
  const ins = report.inspectionStep;
  let serious = 0;
  let minor = 0;
  let total = 0;
  for (const { key } of SECTIONS) {
    const arr = ins[key] as InspectionElement[];
    for (const e of arr) {
      total++;
      const st = elementStatus(e);
      if (st === "serious") serious++;
      else if (st === "minor") minor++;
    }
  }
  // 5.0 max, subtract 1.0 per serious, 0.2 per minor
  let score = 5 - serious * 1 - minor * 0.2;
  if (total === 0) score = 0;
  score = Math.max(1, Math.min(5, score));
  const letter = score >= 4.5 ? "A" : score >= 4 ? "4" : score >= 3.5 ? "3.5" : score >= 3 ? "3" : score >= 2 ? "2" : "R";
  const tone = serious > 0 ? "bad" : minor > 0 ? "warn" : "good";
  return { letter, score: Math.round(score * 10) / 10, tone };
}

// ---------- subcomponents ----------
function StatusPill({ status }: { status: "ok" | "minor" | "serious" | "skipped" }) {
  const map = {
    ok: { label: "Без замечаний", color: "var(--grade-good)" },
    minor: { label: "Незначительные", color: "var(--grade-warn)" },
    serious: { label: "Серьёзные", color: "var(--grade-bad)" },
    skipped: { label: "Не осмотрено", color: "var(--muted-foreground)" },
  } as const;
  const { label, color } = map[status];
  return (
    <span
      className="mono inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-0.5 border"
      style={{ borderColor: color, color }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Photo({ file, ratio = "4/3" }: { file: FileRef | null | undefined; ratio?: string }) {
  if (!file?.url || file.type !== "image") {
    return (
      <div
        className="bg-muted flex items-center justify-center text-muted-foreground mono text-[10px] uppercase tracking-wider"
        style={{ aspectRatio: ratio }}
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
      className="w-full h-full object-cover"
      style={{ aspectRatio: ratio }}
    />
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean | null }) {
  const color = ok == null ? "var(--muted-foreground)" : ok ? "var(--grade-good)" : "var(--grade-bad)";
  const sym = ok == null ? "—" : ok ? "✓" : "✕";
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-dashed border-border last:border-0">
      <span className="text-sm">{label}</span>
      <span className="mono text-base font-bold" style={{ color }}>{sym}</span>
    </div>
  );
}

function ElementCard({ el }: { el: InspectionElement }) {
  const status = elementStatus(el);
  const label = ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " ");
  return (
    <div className="border border-border bg-card/60 overflow-hidden flex flex-col">
      <div className="relative">
        <Photo file={el.file} />
        <div className="absolute top-2 left-2">
          <StatusPill status={status} />
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="font-semibold text-sm ink">{label}</h4>
          {el.paintworkThicknessFrom != null && el.paintworkThicknessTo != null && (
            <span className="mono text-[10px] text-muted-foreground">
              ЛКП {el.paintworkThicknessFrom}–{el.paintworkThicknessTo} мкм
            </span>
          )}
        </div>
        {(el.seriousDamageTags.length > 0 || el.noSeriousDamageTags.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {el.seriousDamageTags.map((t) => (
              <span key={t.id} className="text-[10px] px-1.5 py-0.5 mono uppercase tracking-wider"
                style={{ background: "color-mix(in oklab, var(--grade-bad) 15%, transparent)", color: "var(--grade-bad)" }}>
                {t.name}
              </span>
            ))}
            {el.noSeriousDamageTags.map((t) => (
              <span key={t.id} className="text-[10px] px-1.5 py-0.5 mono uppercase tracking-wider"
                style={{ background: "color-mix(in oklab, var(--grade-warn) 18%, transparent)", color: "oklch(0.4 0.12 70)" }}>
                {t.name}
              </span>
            ))}
          </div>
        )}
        {el.note && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-4">{el.note}</p>
        )}
      </div>
    </div>
  );
}

// ---------- main ----------
function AuctionSheetPage() {
  const { token } = Route.useSearch();
  const { data: report } = useSuspenseQuery(reportQuery(token));
  const grade = calcGrade(report);
  const carName = report.reportName.replace(/^.*·\s*/, "");

  return (
    <main className="min-h-screen py-8 px-4 md:px-8">
      <article className="sheet mx-auto max-w-6xl relative">
        {/* Header */}
        <header className="border-b-2 border-ink p-6 md:p-10" style={{ borderColor: "var(--ink)" }}>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                Аукционный лист · Отчёт об осмотре
              </div>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight ink" style={{ fontFamily: "'Playfair Display', serif" }}>
                {carName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 mono text-xs text-muted-foreground">
                <span>№ {report.reportNumber}</span>
                <span>Осмотр: {fmtDate(report.carStep.dateInspection ?? report.reportDate)}</span>
                <span>{report.carStep.cityInspection ?? "—"}</span>
              </div>
            </div>

            <div className="flex items-stretch gap-3">
              <div
                className="flex flex-col items-center justify-center px-5 py-3 border-2"
                style={{
                  borderColor: `var(--grade-${grade.tone === "good" ? "good" : grade.tone === "warn" ? "warn" : "bad"})`,
                  color: `var(--grade-${grade.tone === "good" ? "good" : grade.tone === "warn" ? "warn" : "bad"})`,
                }}
              >
                <span className="mono text-[10px] uppercase tracking-widest">Оценка</span>
                <span className="text-5xl font-black leading-none mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {grade.letter}
                </span>
                <span className="mono text-xs mt-1">{grade.score.toFixed(1)} / 5</span>
              </div>
              {report.carStep.gosNumber && (
                <div className="flex flex-col items-center justify-center px-4 py-2 border-2 border-ink bg-paper"
                  style={{ borderColor: "var(--ink)" }}>
                  <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Гос. номер</span>
                  <span className="mono text-lg md:text-xl font-bold ink tracking-wider">{report.carStep.gosNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Key facts grid */}
          <dl className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mono text-sm">
            <Fact label="VIN" value={report.vin} mono />
            <Fact label="Пробег" value={fmtMileage(report.carStep.mileage)} />
            <Fact label="Владельцев" value={report.carStep.ownersCount?.toString() ?? "—"} />
            <Fact label="Дата отчёта" value={fmtDate(report.reportDate)} />
          </dl>
        </header>

        {/* Body diagram */}
        <section className="p-6 md:p-10 border-b border-border">
          <SectionTitle index="01" title="Карта кузова" subtitle="Визуальный осмотр элементов" />
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-8 items-start mt-6">
            <CarDiagram elements={report.inspectionStep.bodyElements} />
            <div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Stat
                  label="Толщина ЛКП"
                  value={`${report.inspectionStep.bodyPaintworkThicknessFrom ?? "—"}–${report.inspectionStep.bodyPaintworkThicknessTo ?? "—"}`}
                  unit="мкм"
                />
                <Stat
                  label="Силовые"
                  value={`${report.inspectionStep.bodyReinforcementPaintworkThicknessFrom ?? "—"}–${report.inspectionStep.bodyReinforcementPaintworkThicknessTo ?? "—"}`}
                  unit="мкм"
                />
                <Stat
                  label="Элементов"
                  value={report.inspectionStep.bodyElements.length.toString()}
                  unit="осмотрено"
                />
              </div>
              <Legend />
            </div>
          </div>
        </section>

        {/* Sections overview */}
        <section className="p-6 md:p-10 border-b border-border">
          <SectionTitle index="02" title="Сводка по узлам" subtitle="Оценка каждого блока осмотра" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {SECTIONS.map(({ key, label }) => {
              const els = report.inspectionStep[key] as InspectionElement[];
              const st = sectionStatus(els);
              return (
                <div key={key} className="border border-border p-4 flex flex-col gap-2 bg-card/40">
                  <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {String(SECTIONS.findIndex((s) => s.key === key) + 1).padStart(2, "0")}
                  </span>
                  <span className="font-semibold ink leading-snug">{label}</span>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <StatusPill status={st} />
                    <span className="mono text-xs text-muted-foreground">{els.length} эл.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Document reconciliation */}
        <section className="p-6 md:p-10 border-b border-border">
          <SectionTitle index="03" title="Сверка документов" subtitle="ПТС / СТС" />
          <div className="mt-4 grid md:grid-cols-2 gap-x-10">
            <CheckRow label="ФИО владельца совпадает с ПТС/СТС" ok={report.documentReconciliationStep.ownerFullNameMatchWithPtsOrSts} />
            <CheckRow label="VIN на кузове совпадает с ПТС/СТС" ok={report.documentReconciliationStep.vinOnBodyMatchWithPtsOrSts} />
            <CheckRow label="Модель двигателя совпадает с ПТС/СТС" ok={report.documentReconciliationStep.engineModelMatchWithPtsOrSts} />
            <CheckRow label="Количество владельцев"
              ok={report.documentReconciliationStep.ownersCount != null ? true : null} />
          </div>
        </section>

        {/* Test drive */}
        {report.testDriveStep.testDriveIsIncluded && (
          <section className="p-6 md:p-10 border-b border-border">
            <SectionTitle index="04" title="Тест-драйв" subtitle="Поведение узлов под нагрузкой" />
            <div className="mt-4 grid md:grid-cols-2 gap-x-10">
              <CheckRow label="Двигатель" ok={report.testDriveStep.testDriveEngineIsWorkingProperly} />
              <CheckRow label="Коробка передач" ok={report.testDriveStep.testDriveTransmissionIsWorkingProperly} />
              <CheckRow label="Рулевое управление" ok={report.testDriveStep.testDriveSteeringWheelIsWorkingProperly} />
              <CheckRow label="Подвеска в движении" ok={report.testDriveStep.testDriveSuspensionInDriveIsWorkingProperly} />
              <CheckRow label="Тормоза в движении" ok={report.testDriveStep.testDriveBrakesInDriveIsWorkingProperly} />
            </div>
            {report.testDriveStep.testDriveNote && (
              <p className="mt-4 text-sm text-muted-foreground italic">{report.testDriveStep.testDriveNote}</p>
            )}
          </section>
        )}

        {/* Detailed sections */}
        {SECTIONS.map(({ key, label }, idx) => {
          const els = report.inspectionStep[key] as InspectionElement[];
          if (els.length === 0) return null;
          return (
            <section key={key} className="p-6 md:p-10 border-b border-border">
              <SectionTitle
                index={String(idx + 5).padStart(2, "0")}
                title={label}
                subtitle={`${els.length} ${plural(els.length, ["элемент", "элемента", "элементов"])} осмотрено`}
                right={<StatusPill status={sectionStatus(els)} />}
              />
              <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {els.map((e) => <ElementCard key={e.id} el={e} />)}
              </div>
            </section>
          );
        })}

        {/* Specialist note */}
        {report.resultStep.resultSpecialistNote && (
          <section className="p-6 md:p-10 relative">
            <SectionTitle index="99" title="Заключение специалиста" />
            <div className="mt-4 relative border-l-4 pl-5 py-2"
              style={{ borderColor: "var(--accent)" }}>
              <p className="whitespace-pre-line text-sm leading-relaxed ink">
                {report.resultStep.resultSpecialistNote}
              </p>
            </div>
            <div className="absolute right-8 bottom-8 stamp text-xs md:text-sm px-4 py-2 select-none hidden md:block">
              осмотрено · {report.reportNumber}
            </div>
          </section>
        )}

        <footer className="px-6 md:px-10 py-4 border-t border-border flex items-center justify-between mono text-[11px] text-muted-foreground">
          <span>Аукционный лист сгенерирован на основе данных carreports.ru</span>
          <span>{report.reportNumber}</span>
        </footer>
      </article>
    </main>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={`mt-1 ink ${mono ? "mono text-sm md:text-base font-medium break-all" : "text-sm md:text-base font-semibold"}`}>
        {value}
      </dd>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="border border-border p-3 bg-card/40">
      <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-bold ink mono">{value}</span>
        {unit && <span className="mono text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function SectionTitle({
  index, title, subtitle, right,
}: { index: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div className="flex items-end gap-4">
        <span className="mono text-xs text-muted-foreground tracking-widest">{index}</span>
        <div>
          <h2 className="text-xl md:text-2xl font-bold ink leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h2>
          {subtitle && <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 mono text-[11px] uppercase tracking-wider">
      <LegendItem color="var(--grade-good)" label="Без замечаний" />
      <LegendItem color="var(--grade-warn)" label="Незначительные" />
      <LegendItem color="var(--grade-bad)" label="Серьёзные" />
      <LegendItem color="var(--muted-foreground)" label="Не осмотрено" />
    </div>
  );
}
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-3 h-3 inline-block border" style={{ background: color, borderColor: color }} />
      {label}
    </span>
  );
}

function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
