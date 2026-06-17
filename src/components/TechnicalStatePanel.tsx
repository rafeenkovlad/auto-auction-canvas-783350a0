import type { CarReport } from "@/lib/report.api";
import { SectionCard } from "@/components/SectionCard";
import { Stat } from "@/components/ReportPrimitives";
import type { EnrichedElement } from "@/lib/report.utils";

interface TechnicalStatePanelProps {
  sections: Array<{ key: string; elements: EnrichedElement[] }>;
  inspection: CarReport["inspectionStep"];
}

export function TechnicalStatePanel({
  sections,
  inspection,
}: TechnicalStatePanelProps) {
  const showThickness =
    inspection.bodyPaintworkThicknessFrom != null ||
    inspection.bodyReinforcementPaintworkThicknessFrom != null;

  return (
    <div className="panel p-5 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Техническое состояние
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {sections
          .filter((s) => s.elements.length > 0)
          .map((s) => (
            <SectionCard key={s.key} sectionKey={s.key} elements={s.elements} />
          ))}
      </div>
      {showThickness && (
        <div className="grid sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
          <Stat
            label="ЛКП кузова"
            value={`${inspection.bodyPaintworkThicknessFrom ?? "—"}–${inspection.bodyPaintworkThicknessTo ?? "—"}`}
            unit="мкм"
          />
          <Stat
            label="ЛКП силовых"
            value={`${inspection.bodyReinforcementPaintworkThicknessFrom ?? "—"}–${inspection.bodyReinforcementPaintworkThicknessTo ?? "—"}`}
            unit="мкм"
          />
        </div>
      )}
    </div>
  );
}
