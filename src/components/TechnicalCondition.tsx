import { useMemo } from "react";
import type { CarReport, InspectionElement } from "@/lib/report.api";
import type { EnrichedElement, Status } from "@/lib/report.utils";
import { getElementStatus } from "@/lib/report.utils";
import { SECTION_ICONS, SECTION_LABELS, ELEMENT_LABEL } from "@/lib/report.constants";
import {
  Check,
  AlertTriangle,
  AlertOctagon,
  Gauge,
} from "lucide-react";

interface Props {
  report: CarReport;
  allElements: EnrichedElement[];
  onElementClick?: (el: InspectionElement) => void;
}

type Finding = { label: string; status: Status };

const EXTRA_SECTION_KEYS = [
  "underHoodElements",
  "computerDiagnosticsElements",
] as const;

function buildFindings(report: CarReport, elements: EnrichedElement[]): Finding[] {
  const has = (key: string, st: Status) =>
    elements.some((e) => e._sectionKey === key && e._status === st);
  const out: Finding[] = [];

  const docs = report.documentReconciliationStep;
  const vinOk = !report.carStep.unreadableVin && docs.vinOnBodyMatchWithPtsOrSts !== false;
  out.push({ label: "VIN и документы проверены", status: vinOk ? "ok" : "serious" });

  const frameSerious = has("bodyReinforcementElements", "serious");
  const frameMinor = has("bodyReinforcementElements", "minor");
  out.push({
    label: "Геометрия кузова в норме",
    status: frameSerious ? "serious" : frameMinor ? "minor" : "ok",
  });

  const bodySerious = has("bodyElements", "serious");
  const bodyMinor = has("bodyElements", "minor");
  out.push({
    label: bodySerious
      ? "Обнаружены повреждения кузова"
      : bodyMinor
        ? "Есть незначительные замечания по кузову"
        : "Кузов без структурных повреждений",
    status: bodySerious ? "serious" : bodyMinor ? "minor" : "ok",
  });

  const diagSerious = has("computerDiagnosticsElements", "serious");
  const diagMinor = has("computerDiagnosticsElements", "minor");
  out.push({
    label: diagSerious ? "Ошибки в диагностике" : "Ошибок по диагностике нет",
    status: diagSerious ? "serious" : diagMinor ? "minor" : "ok",
  });

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

function findingIcon(s: Status) {
  if (s === "ok") return { Icon: Check, color: "var(--grade-good)" };
  if (s === "minor") return { Icon: AlertTriangle, color: "var(--grade-warn)" };
  return { Icon: AlertOctagon, color: "var(--grade-bad)" };
}

function summarizeSection(elements: InspectionElement[]): {
  status: Status | "empty";
  badge: string;
  note: string;
  problems: Array<{ label: string; severe: boolean }>;
} {
  if (!elements || elements.length === 0) {
    return { status: "empty", badge: "Нет данных", note: "Раздел не заполнен", problems: [] };
  }
  let st: Status = "ok";
  const problems: Array<{ label: string; severe: boolean }> = [];
  for (const el of elements) {
    const s = getElementStatus(el);
    if (s === "serious") st = "serious";
    else if (s === "minor" && st === "ok") st = "minor";
    if (s !== "ok") {
      const tag = el.seriousDamageTags[0] ?? el.noSeriousDamageTags[0];
      const name =
        tag?.name ??
        ELEMENT_LABEL[el.elementType] ??
        el.elementType.replace(/_/g, " ");
      problems.push({ label: name, severe: s === "serious" });
    }
  }
  const badge =
    st === "serious" ? "Повреждения" : st === "minor" ? "Внимание" : "Хорошо";
  const note =
    st === "ok"
      ? "Замечаний не выявлено. Все элементы в норме."
      : `Выявлено замечаний: ${problems.length}`;
  return { status: st, badge, note, problems };
}

function fmtPaintRange(from: number | null, to: number | null): string | null {
  if (from == null && to == null) return null;
  if (from != null && to != null && from !== to) return `${from}–${to}`;
  return `${from ?? to}`;
}

export function TechnicalCondition({ report, allElements, onElementClick }: Props) {
  const findings = useMemo(
    () => buildFindings(report, allElements),
    [report, allElements],
  );

  const cards = useMemo(() => {
    return EXTRA_SECTION_KEYS.map((key) => {
      const els = (report.inspectionStep[key] as InspectionElement[] | undefined) ?? [];
      const summary = summarizeSection(els);
      return {
        key,
        label: SECTION_LABELS[key] ?? key,
        icon: SECTION_ICONS[key],
        elements: els,
        ...summary,
      };
    });
  }, [report]);

  const bodyPaint = fmtPaintRange(
    report.inspectionStep.bodyPaintworkThicknessFrom,
    report.inspectionStep.bodyPaintworkThicknessTo,
  );
  const framePaint = fmtPaintRange(
    report.inspectionStep.bodyReinforcementPaintworkThicknessFrom,
    report.inspectionStep.bodyReinforcementPaintworkThicknessTo,
  );

  return (
    <section className="panel p-5 md:p-6 flex flex-col gap-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Техническое состояние
      </h3>

      {/* Что важно знать */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Что важно знать
        </div>
        <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2">
          {findings.map((f) => {
            const { Icon, color } = findingIcon(f.status);
            return (
              <li key={f.label} className="flex items-start gap-2 text-sm">
                <Icon size={16} strokeWidth={2.5} style={{ color }} className="mt-0.5 shrink-0" />
                <span className={f.status === "ok" ? "text-foreground" : "ink font-medium"}>
                  {f.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Дополнительные разделы осмотра */}
      {cards.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {cards.map((c) => (
            <SectionCard
              key={c.key}
              label={c.label}
              icon={c.icon}
              status={c.status}
              badge={c.badge}
              note={c.note}
              problems={c.problems}
              onClick={
                c.elements[0] && onElementClick
                  ? () => onElementClick(c.elements[0])
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Общее ЛКП */}
      {(bodyPaint || framePaint) && (
        <div className="grid sm:grid-cols-2 gap-3 border-t border-border pt-4">
          {bodyPaint && <PaintRow label="ЛКП кузова" value={bodyPaint} />}
          {framePaint && <PaintRow label="ЛКП силовых" value={framePaint} />}
        </div>
      )}
    </section>
  );
}

function statusBadgeColors(status: Status | "empty") {
  if (status === "serious")
    return {
      bg: "color-mix(in oklch, var(--grade-bad) 14%, transparent)",
      color: "var(--grade-bad)",
      border: "color-mix(in oklch, var(--grade-bad) 35%, transparent)",
    };
  if (status === "minor")
    return {
      bg: "color-mix(in oklch, var(--grade-warn) 16%, transparent)",
      color: "var(--grade-warn)",
      border: "color-mix(in oklch, var(--grade-warn) 40%, transparent)",
    };
  if (status === "ok")
    return {
      bg: "color-mix(in oklch, var(--grade-good) 16%, transparent)",
      color: "var(--grade-good)",
      border: "color-mix(in oklch, var(--grade-good) 38%, transparent)",
    };
  return {
    bg: "var(--muted)",
    color: "var(--muted-foreground)",
    border: "var(--border)",
  };
}

function SectionCard({
  label,
  icon,
  status,
  badge,
  note,
  problems,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  status: Status | "empty";
  badge: string;
  note: string;
  problems: Array<{ label: string; severe: boolean }>;
  onClick?: () => void;
}) {
  const c = statusBadgeColors(status);
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className="text-left rounded-xl border border-border bg-card p-4 flex flex-col gap-2.5 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center gap-3">
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground bg-muted/60 shrink-0"
          aria-hidden
        >
          {icon}
        </span>
        <span className="font-semibold ink text-sm flex-1 truncate">{label}</span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border shrink-0"
          style={{ background: c.bg, color: c.color, borderColor: c.border }}
        >
          {badge}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{note}</p>
      {problems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {problems.slice(0, 4).map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border"
              style={{
                background: p.severe
                  ? "color-mix(in oklch, var(--grade-bad) 10%, transparent)"
                  : "color-mix(in oklch, var(--grade-warn) 12%, transparent)",
                borderColor: p.severe
                  ? "color-mix(in oklch, var(--grade-bad) 35%, transparent)"
                  : "color-mix(in oklch, var(--grade-warn) 38%, transparent)",
                color: "var(--foreground)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: p.severe ? "var(--grade-bad)" : "var(--grade-warn)",
                }}
              />
              {p.label}
            </span>
          ))}
          {problems.length > 4 && (
            <span className="text-[11px] text-muted-foreground px-1">
              +{problems.length - 4}
            </span>
          )}
        </div>
      )}
    </Wrapper>
  );
}

function PaintRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        <Gauge size={14} />
        {label}
      </span>
      <span className="mono text-sm font-semibold ink">
        {value} <span className="text-[11px] text-muted-foreground font-normal">мкм</span>
      </span>
    </div>
  );
}
