import { sectionSummary, statusMeta, type EnrichedElement } from "@/lib/report.utils";
import { SECTION_ICONS, SECTION_LABELS } from "@/lib/report.constants";

export function SectionCard({
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
        : status === "serious"
          ? "Замечания"
          : "Нет данных";
  const meta = status ? statusMeta(status) : null;

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
                style={{ background: t.severe ? "var(--grade-bad)" : "var(--grade-warn)" }}
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
