import type { CarReport, InspectionElement } from "@/lib/report.api";
import { getElementStatus, type Status } from "@/lib/report.utils";
import { SECTION_KEYS, SECTION_LABELS, ELEMENT_LABEL } from "@/lib/report.constants";

export type Verdict = "buy" | "caution" | "avoid";

export interface KeyCheck {
  label: string;
  ok: boolean;
  /** Severity when not ok */
  severity?: "minor" | "serious";
}

export interface TopIssue {
  label: string;
  detail: string;
  severity: "minor" | "serious";
  sectionKey: string;
}

export interface ReportScore {
  score: number; // 0..10
  verdict: Verdict;
  verdictLabel: string;
  okChecks: KeyCheck[];
  issues: TopIssue[];
  serious: number;
  minor: number;
  total: number;
}

const STATUS_WEIGHT: Record<Status, number> = { ok: 1, minor: 0.65, serious: 0 };

function countStatuses(elements: InspectionElement[]) {
  let ok = 0, minor = 0, serious = 0;
  for (const el of elements) {
    const s = getElementStatus(el);
    if (s === "serious") serious++;
    else if (s === "minor") minor++;
    else ok++;
  }
  return { ok, minor, serious, total: elements.length };
}

function sectionStatus(elements: InspectionElement[]): Status | null {
  if (elements.length === 0) return null;
  let s: Status = "ok";
  for (const el of elements) {
    const cur = getElementStatus(el);
    if (cur === "serious") return "serious";
    if (cur === "minor") s = "minor";
  }
  return s;
}

export function computeReportScore(report: CarReport): ReportScore {
  const ins = report.inspectionStep;
  const allElements: InspectionElement[] = SECTION_KEYS.flatMap(
    (k) => (ins[k] as InspectionElement[] | undefined) ?? [],
  );

  const totals = countStatuses(allElements);
  const weighted = allElements.reduce(
    (acc, el) => acc + STATUS_WEIGHT[getElementStatus(el)],
    0,
  );
  const inspectionScore = totals.total > 0 ? weighted / totals.total : 1;

  // Documents penalty
  const docs = report.documentReconciliationStep;
  const docChecks = [
    docs.vinOnBodyMatchWithPtsOrSts,
    docs.ownerFullNameMatchWithPtsOrSts,
    docs.engineModelMatchWithPtsOrSts,
  ];
  const docOk = docChecks.filter((v) => v === true).length;
  const docKnown = docChecks.filter((v) => v !== null && v !== undefined).length;
  const docScore = docKnown > 0 ? docOk / docKnown : 1;

  // Test drive penalty
  const td = report.testDriveStep;
  let tdScore = 1;
  if (td.testDriveIsIncluded) {
    const flags = [
      td.testDriveEngineIsWorkingProperly,
      td.testDriveTransmissionIsWorkingProperly,
      td.testDriveSteeringWheelIsWorkingProperly,
      td.testDriveSuspensionInDriveIsWorkingProperly,
      td.testDriveBrakesInDriveIsWorkingProperly,
    ];
    const okFlags = flags.filter(Boolean).length;
    tdScore = okFlags / flags.length;
  }

  // Weighted total: inspection 70%, docs 20%, test drive 10%
  const composite =
    inspectionScore * 0.7 + docScore * 0.2 + tdScore * 0.1;
  const score = Math.round(composite * 100) / 10; // 0..10 with 1 decimal

  let verdict: Verdict = "buy";
  let verdictLabel = "Покупка рекомендуется";
  if (score < 6.5 || totals.serious > 0) {
    verdict = "avoid";
    verdictLabel = "Покупка не рекомендуется";
  } else if (score < 8.3 || totals.minor > 4) {
    verdict = "caution";
    verdictLabel = "Покупать с оговорками";
  }

  // Key OK checks
  const frameElements = ins.bodyReinforcementElements ?? [];
  const diagElements = ins.computerDiagnosticsElements ?? [];
  const frameStatus = sectionStatus(frameElements);
  const diagStatus = sectionStatus(diagElements);
  const bodyStatus = sectionStatus(ins.bodyElements ?? []);

  const okChecks: KeyCheck[] = [];
  if (docs.vinOnBodyMatchWithPtsOrSts === true)
    okChecks.push({ label: "VIN на кузове совпадает с ПТС/СТС", ok: true });
  else if (docs.vinOnBodyMatchWithPtsOrSts === false)
    okChecks.push({ label: "VIN на кузове не совпадает с ПТС/СТС", ok: false, severity: "serious" });

  if (docs.ownerFullNameMatchWithPtsOrSts === true)
    okChecks.push({ label: "ФИО владельца совпадает", ok: true });

  if (frameStatus === "ok")
    okChecks.push({ label: "Геометрия кузова в норме", ok: true });
  else if (frameStatus === "serious")
    okChecks.push({ label: "Нарушения геометрии кузова", ok: false, severity: "serious" });
  else if (frameStatus === "minor")
    okChecks.push({ label: "Замечания по силовым элементам", ok: false, severity: "minor" });

  if (diagStatus === "ok" && diagElements.length > 0)
    okChecks.push({ label: "Компьютерных ошибок не выявлено", ok: true });
  else if (diagStatus === "serious")
    okChecks.push({ label: "Серьёзные компьютерные ошибки", ok: false, severity: "serious" });

  if (bodyStatus === "ok" && (ins.bodyElements?.length ?? 0) > 0)
    okChecks.push({ label: "Кузов без значимых дефектов", ok: true });

  // Top issues — collect damaged elements, sort serious first
  const issues: TopIssue[] = [];
  for (const key of SECTION_KEYS) {
    const arr = (ins[key] as InspectionElement[] | undefined) ?? [];
    for (const el of arr) {
      const s = getElementStatus(el);
      if (s === "ok") continue;
      const tag =
        el.seriousDamageTags[0]?.name ??
        el.noSeriousDamageTags[0]?.name ??
        "повреждение";
      issues.push({
        label: ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " "),
        detail: tag,
        severity: s,
        sectionKey: key,
      });
    }
  }
  issues.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "serious" ? -1 : 1,
  );

  return {
    score: Math.min(10, Math.max(0, score)),
    verdict,
    verdictLabel,
    okChecks: okChecks.slice(0, 5),
    issues: issues.slice(0, 5),
    serious: totals.serious,
    minor: totals.minor,
    total: totals.total,
  };
}

export function sectionLabel(key: string): string {
  return SECTION_LABELS[key] ?? key;
}
