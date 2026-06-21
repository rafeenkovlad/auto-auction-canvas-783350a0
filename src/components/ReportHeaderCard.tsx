import { useMemo } from "react";
import type { CarReport } from "@/lib/report.api";
import type { EnrichedElement } from "@/lib/report.utils";
import { fmtDate, fmtMileage } from "@/lib/report.utils";
import { Calendar, MapPin, Gauge, Hash, FileText, ShieldCheck, Check, AlertTriangle, AlertOctagon } from "lucide-react";

interface Props {
  report: CarReport;
  carName: string;
  heroImage: string | null;
  heroSrcSet: string | null;
  characteristics: Array<[string, string | number]>;
  allElements: EnrichedElement[];
}

function computeScore(elements: EnrichedElement[]): number {
  if (elements.length === 0) return 10;
  const inspected = elements.filter((e) => e._sectionKey && e._sectionKey !== "car" && e._sectionKey !== "documents" && e._sectionKey !== "legal" && e._sectionKey !== "testDrive" && e._sectionKey !== "result" && e._sectionKey !== "characteristics" && e._sectionKey !== "inspection");
  let serious = 0, minor = 0;
  for (const e of inspected) {
    if (e._status === "serious") serious++;
    else if (e._status === "minor") minor++;
  }
  const raw = 10 - serious * 1.0 - minor * 0.15;
  return Math.max(1, Math.min(10, Math.round(raw * 10) / 10));
}

function scoreColor(s: number): string {
  if (s >= 8.5) return "var(--grade-good)";
  if (s >= 6.5) return "var(--grade-warn)";
  return "var(--grade-bad)";
}

function scoreLabel(s: number): string {
  if (s >= 9) return "Отличное состояние";
  if (s >= 8) return "Хорошее состояние";
  if (s >= 6.5) return "Удовлетворительное";
  return "Требуется внимание";
}

type Finding = { label: string; status: "ok" | "minor" | "serious" };

function buildFindings(report: CarReport, elements: EnrichedElement[]): Finding[] {
  const has = (key: string, st: "serious" | "minor") =>
    elements.some((e) => e._sectionKey === key && e._status === st);
  const out: Finding[] = [];

  // VIN
  const docs = report.documentReconciliationStep;
  const vinOk = !report.carStep.unreadableVin && docs.vinOnBodyMatchWithPtsOrSts !== false;
  out.push({ label: "VIN и документы проверены", status: vinOk ? "ok" : "serious" });

  // Body structure
  const frameSerious = has("bodyReinforcementElements", "serious");
  const frameMinor = has("bodyReinforcementElements", "minor");
  out.push({
    label: "Геометрия кузова в норме",
    status: frameSerious ? "serious" : frameMinor ? "minor" : "ok",
  });

  // Body damage
  const bodySerious = has("bodyElements", "serious");
  const bodyMinor = has("bodyElements", "minor");
  out.push({
    label: bodySerious ? "Обнаружены повреждения кузова" : bodyMinor ? "Есть незначительные замечания по кузову" : "Кузов без структурных повреждений",
    status: bodySerious ? "serious" : bodyMinor ? "minor" : "ok",
  });

  // Diagnostics
  const diagSerious = has("computerDiagnosticsElements", "serious");
  const diagMinor = has("computerDiagnosticsElements", "minor");
  out.push({
    label: diagSerious ? "Ошибки в диагностике" : "Ошибок по диагностике нет",
    status: diagSerious ? "serious" : diagMinor ? "minor" : "ok",
  });

  // Test drive
  const td = report.testDriveStep;
  const tdProblem =
    td.testDriveIsIncluded &&
    [
      td.testDriveEngineIsWorkingProperly,
      td.testDriveTransmissionIsWorkingProperly,
      td.testDriveSteeringWheelIsWorkingProperly,
      td.testDriveSuspensionInDriveIsWorkingProperly,
      td.testDriveBrakesInDriveIsWorkingProperly,
    ].some((v) => v === false);
  out.push({
    label: tdProblem ? "Есть замечания на тест-драйве" : "Тест-драйв пройден",
    status: tdProblem ? "minor" : "ok",
  });

  return out;
}

function findingIcon(s: Finding["status"]) {
  if (s === "ok") return { Icon: Check, color: "var(--grade-good)" };
  if (s === "minor") return { Icon: AlertTriangle, color: "var(--grade-warn)" };
  return { Icon: AlertOctagon, color: "var(--grade-bad)" };
}

export function ReportHeaderCard({
  report,
  carName,
  heroImage,
  heroSrcSet,
  characteristics,
  allElements,
}: Props) {
  const score = useMemo(() => computeScore(allElements), [allElements]);
  const findings = useMemo(() => buildFindings(report, allElements), [report, allElements]);
  const sColor = scoreColor(score);
  const sLabel = scoreLabel(score);

  // Pick first 4 short chips from characteristics for header
  const chips = useMemo(() => {
    const wanted = ["Рестайлинг", "Двигатель", "КПП", "Привод", "Объём"];
    const map = new Map(characteristics.map(([k, v]) => [k, v]));
    const result: Array<{ label: string; value: string }> = [];
    for (const k of wanted) {
      const v = map.get(k);
      if (v != null) result.push({ label: k, value: String(v) });
      if (result.length >= 4) break;
    }
    return result;
  }, [characteristics]);

  const allRecommended = findings.every((f) => f.status === "ok");
  const someSerious = findings.some((f) => f.status === "serious");

  const inspectionDate = fmtDate(report.carStep.dateInspection ?? report.reportDate);
  const city = report.carStep.cityInspection ?? "—";
  const mileage = fmtMileage(report.carStep.mileage);
  const vinShort = report.vin || "—";

  // Score arc
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const progress = (score / 10) * circ;

  return (
    <section className="panel p-4 sm:p-5 md:p-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
      {/* === Column 1: Car === */}
      <div className="min-w-0 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-xl md:text-2xl font-bold ink leading-tight">
            {carName}
          </h1>
          <span
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: someSerious
                ? "color-mix(in oklab, var(--grade-bad) 18%, white)"
                : allRecommended
                  ? "color-mix(in oklab, var(--grade-good) 22%, white)"
                  : "color-mix(in oklab, var(--grade-warn) 24%, white)",
              color: someSerious
                ? "var(--grade-bad)"
                : allRecommended
                  ? "oklch(0.35 0.1 145)"
                  : "oklch(0.35 0.08 70)",
            }}
          >
            {someSerious
              ? "Покупка с осторожностью"
              : allRecommended
                ? "Покупка рекомендуется"
                : "Покупка возможна"}
          </span>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border border-border bg-muted/40 text-muted-foreground"
                title={c.label}
              >
                <span className="ink font-medium">{c.value}</span>
              </span>
            ))}
          </div>
        )}

        {heroImage ? (
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={heroImage}
              srcSet={heroSrcSet ?? undefined}
              sizes="(min-width: 1024px) 520px, 100vw"
              alt={carName}
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
            Изображение не предоставлено
          </div>
        )}

        {report.carStep.uriListing && (
          <a
            href={report.carStep.uriListing}
            target="_blank"
            rel="noreferrer"
            className="self-start inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Перейти к объявлению</span>
            <span aria-hidden>↗</span>
          </a>
        )}
      </div>

      {/* === Column 2: SCORE + findings === */}
      <div className="min-w-0 flex flex-col items-center gap-3 lg:border-l lg:border-border lg:pl-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          VIN DIEZEL Score
        </div>
        <div className="relative w-[140px] h-[140px]">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="10"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={sColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circ - progress}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="mono text-3xl font-black ink leading-none tabular-nums">
              {score.toFixed(1)}
            </div>
            <div className="mono text-[10px] text-muted-foreground mt-1">
              из 10
            </div>
          </div>
        </div>
        <div className="text-sm font-semibold ink text-center">{sLabel}</div>

        <ul className="w-full flex flex-col gap-1.5 mt-1">
          {findings.map((f) => {
            const { Icon, color } = findingIcon(f.status);
            return (
              <li key={f.label} className="flex items-start gap-2 text-xs">
                <Icon size={14} strokeWidth={2.5} style={{ color }} className="mt-0.5 shrink-0" />
                <span className={f.status === "ok" ? "text-foreground" : "ink font-medium"}>
                  {f.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* === Column 3: Meta === */}
      <div className="min-w-0 flex flex-col gap-2.5 lg:border-l lg:border-border lg:pl-5">
        <MetaRow icon={<Calendar size={14} />} label="Дата осмотра" value={inspectionDate} />
        <MetaRow icon={<MapPin size={14} />} label="Город" value={city} truncate />
        <MetaRow icon={<Gauge size={14} />} label="Пробег" value={mileage} mono />
        <MetaRow icon={<Hash size={14} />} label="VIN" value={vinShort} mono truncate />
        <MetaRow icon={<FileText size={14} />} label="Номер отчёта" value={report.reportNumber} mono />

        <div
          className="mt-2 rounded-lg p-3 flex items-center gap-2.5 border"
          style={{
            background: "color-mix(in oklab, var(--accent) 8%, var(--card))",
            borderColor: "color-mix(in oklab, var(--accent) 35%, var(--border))",
          }}
        >
          <ShieldCheck size={20} style={{ color: "var(--accent)" }} className="shrink-0" />
          <div className="leading-tight">
            <div className="text-sm font-bold ink">Проверен VIN DIEZEL</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Независимая экспертиза
            </div>
          </div>
        </div>
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
