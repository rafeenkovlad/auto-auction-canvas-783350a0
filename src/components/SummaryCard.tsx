import { useMemo } from "react";
import type { CarReport } from "@/lib/report.api";
import type { EnrichedElement } from "@/lib/report.utils";

type Verdict = "good" | "warn" | "bad";

interface SummaryCardProps {
  report: CarReport;
  allElements: EnrichedElement[];
}

interface Fact {
  text: string;
  kind: "good" | "warn" | "bad";
}

function buildFacts(report: CarReport, els: EnrichedElement[]) {
  const positives: Fact[] = [];
  const concerns: Fact[] = [];

  const docs = report.documentReconciliationStep;
  if (docs.vinOnBodyMatchWithPtsOrSts === true)
    positives.push({ text: "VIN на кузове совпадает с ПТС/СТС", kind: "good" });
  else if (docs.vinOnBodyMatchWithPtsOrSts === false)
    concerns.push({ text: "VIN на кузове не совпадает с ПТС/СТС", kind: "bad" });

  if (docs.ownerFullNameMatchWithPtsOrSts === true)
    positives.push({ text: "Владелец совпадает с документами", kind: "good" });
  else if (docs.ownerFullNameMatchWithPtsOrSts === false)
    concerns.push({ text: "ФИО владельца не совпадает с ПТС/СТС", kind: "bad" });

  if (docs.engineModelMatchWithPtsOrSts === true)
    positives.push({ text: "Модель двигателя совпадает с ПТС/СТС", kind: "good" });
  else if (docs.engineModelMatchWithPtsOrSts === false)
    concerns.push({ text: "Модель двигателя не совпадает с ПТС/СТС", kind: "bad" });

  // Body / frame inspection
  const real = els.filter((e) => e.id >= 0);
  const serious = real.filter((e) => e._status === "serious");
  const minor = real.filter((e) => e._status === "minor");

  const frameSerious = serious.filter(
    (e) => e._sectionKey === "bodyReinforcementElements",
  );
  if (real.length > 0 && frameSerious.length === 0)
    positives.push({ text: "Геометрия кузова в норме", kind: "good" });
  if (frameSerious.length > 0)
    concerns.push({
      text: `Силовые элементы: ${frameSerious.map((e) => e._displayName).slice(0, 3).join(", ")}`,
      kind: "bad",
    });

  const diag = report.inspectionStep.computerDiagnosticsElements ?? [];
  const diagBad = diag.some(
    (e) => e.seriousDamageTags.length > 0 || e.noSeriousDamageTags.length > 0 || !e.noDamage,
  );
  if (diag.length > 0 && !diagBad)
    positives.push({ text: "Компьютерная диагностика без ошибок", kind: "good" });
  else if (diagBad)
    concerns.push({ text: "Есть ошибки компьютерной диагностики", kind: "warn" });

  // Test drive
  const td = report.testDriveStep;
  if (td.testDriveIsIncluded) {
    const tdProblems: string[] = [];
    if (!td.testDriveEngineIsWorkingProperly) tdProblems.push("двигатель");
    if (!td.testDriveTransmissionIsWorkingProperly) tdProblems.push("КПП");
    if (!td.testDriveSteeringWheelIsWorkingProperly) tdProblems.push("рулевое");
    if (!td.testDriveSuspensionInDriveIsWorkingProperly) tdProblems.push("подвеска");
    if (!td.testDriveBrakesInDriveIsWorkingProperly) tdProblems.push("тормоза");
    if (tdProblems.length === 0)
      positives.push({ text: "Тест-драйв пройден без замечаний", kind: "good" });
    else
      concerns.push({ text: `Замечания на тест-драйве: ${tdProblems.join(", ")}`, kind: "warn" });
  }

  // Top serious/minor body items
  const seenTags = new Set<string>();
  for (const e of serious) {
    if (e._sectionKey === "bodyReinforcementElements") continue;
    const tag = e.seriousDamageTags[0]?.name;
    const key = `${e._displayName}|${tag ?? ""}`;
    if (seenTags.has(key)) continue;
    seenTags.add(key);
    concerns.push({
      text: tag ? `${e._displayName}: ${tag.toLowerCase()}` : `${e._displayName}: серьёзное повреждение`,
      kind: "bad",
    });
    if (concerns.length >= 6) break;
  }
  if (concerns.length < 6) {
    for (const e of minor) {
      const tag = e.noSeriousDamageTags[0]?.name;
      const key = `${e._displayName}|${tag ?? ""}`;
      if (seenTags.has(key)) continue;
      seenTags.add(key);
      concerns.push({
        text: tag ? `${e._displayName}: ${tag.toLowerCase()}` : `${e._displayName}: замечание`,
        kind: "warn",
      });
      if (concerns.length >= 6) break;
    }
  }

  return { positives: positives.slice(0, 6), concerns: concerns.slice(0, 6), serious, minor };
}

export function SummaryCard({ report, allElements }: SummaryCardProps) {
  const { positives, concerns, serious, minor } = useMemo(
    () => buildFacts(report, allElements),
    [report, allElements],
  );

  const docs = report.documentReconciliationStep;
  const docsBad =
    docs.vinOnBodyMatchWithPtsOrSts === false ||
    docs.ownerFullNameMatchWithPtsOrSts === false ||
    docs.engineModelMatchWithPtsOrSts === false;

  const verdict: Verdict =
    serious.length > 0 || docsBad ? "bad" : minor.length > 2 ? "warn" : "good";

  const verdictMeta = {
    good: {
      label: "Покупка рекомендуется",
      sub: "Серьёзных замечаний не выявлено",
      color: "var(--grade-good)",
      icon: "✓",
    },
    warn: {
      label: "Покупка возможна с оговорками",
      sub: "Есть незначительные замечания",
      color: "var(--grade-warn)",
      icon: "!",
    },
    bad: {
      label: "Покупка не рекомендуется",
      sub: "Выявлены серьёзные замечания",
      color: "var(--grade-bad)",
      icon: "✕",
    },
  }[verdict];

  const scrollToDetails = () => {
    document
      .getElementById("report-details")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="panel p-5 md:p-6">
      <div className="flex items-start gap-4 md:gap-5">
        <span
          className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold"
          style={{ background: verdictMeta.color }}
          aria-hidden
        >
          {verdictMeta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: verdictMeta.color }}
          >
            Заключение
          </div>
          <h2 className="text-xl md:text-2xl font-bold ink leading-tight">
            {verdictMeta.label}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{verdictMeta.sub}</p>
        </div>
      </div>

      {(positives.length > 0 || concerns.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-5">
          {positives.length > 0 && (
            <ul className="space-y-1.5">
              {positives.map((f, i) => (
                <li key={`p-${i}`} className="flex items-start gap-2 text-sm">
                  <span
                    className="mt-0.5 inline-flex w-4 h-4 rounded-full items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: "var(--grade-good)" }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="ink">{f.text}</span>
                </li>
              ))}
            </ul>
          )}
          {concerns.length > 0 && (
            <ul className="space-y-1.5">
              {concerns.map((f, i) => (
                <li key={`c-${i}`} className="flex items-start gap-2 text-sm">
                  <span
                    className="mt-0.5 inline-flex w-4 h-4 rounded-full items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: f.kind === "bad" ? "var(--grade-bad)" : "var(--grade-warn)",
                      color: f.kind === "bad" ? "white" : "oklch(0.25 0.05 70)",
                    }}
                    aria-hidden
                  >
                    {f.kind === "bad" ? "✕" : "!"}
                  </span>
                  <span className="ink">{f.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={scrollToDetails}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md border border-border bg-card hover:bg-muted transition-colors"
      >
        Смотреть детали
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
