import type { CarReport } from "@/lib/report.functions";
import { CheckRow } from "@/components/ReportPrimitives";

export function TestDriveCard({ report }: { report: CarReport }) {
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
