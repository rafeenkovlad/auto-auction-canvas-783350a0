import { useState } from "react";
import type { InspectionElement } from "@/lib/report.functions";
import { CarBodySchema } from "@/components/CarBodySchema";
import { FrameSchema } from "@/components/FrameSchema";
import { WheelsSchema } from "@/components/WheelsSchema";
import { GlassSchema } from "@/components/GlassSchema";
import { LightingSchema } from "@/components/LightingSchema";

type TabKey = "body" | "interior" | "frame" | "wheels" | "glass" | "lighting";

const TABS: { key: TabKey; label: string }[] = [
  { key: "body", label: "Кузов" },
  { key: "interior", label: "Салон" },
  { key: "frame", label: "Силовые" },
  { key: "wheels", label: "Колёса" },
  { key: "glass", label: "Стёкла" },
  { key: "lighting", label: "Освещение" },
];

function statusOf(el: InspectionElement) {
  if (el.seriousDamageTags.length > 0) return "serious" as const;
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor" as const;
  return "ok" as const;
}
function fillFor(s: "ok" | "minor" | "serious") {
  if (s === "serious") return "color-mix(in oklab, var(--grade-bad) 38%, white)";
  if (s === "minor") return "color-mix(in oklab, var(--grade-warn) 42%, white)";
  return "color-mix(in oklab, var(--grade-good) 18%, white)";
}
function strokeFor(s: "ok" | "minor" | "serious") {
  if (s === "serious") return "var(--grade-bad)";
  if (s === "minor") return "var(--grade-warn)";
  return "color-mix(in oklab, var(--grade-good) 70%, oklch(0.45 0.01 250))";
}

function PlaceholderBoard({
  elements,
  emptyText,
  onElementClick,
}: {
  elements: InspectionElement[];
  emptyText: string;
  onElementClick?: (el: InspectionElement) => void;
}) {
  if (!elements || elements.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground py-16">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {elements.map((el) => {
        const s = statusOf(el);
        return (
          <button
            key={el.id}
            type="button"
            onClick={() => onElementClick?.(el)}
            className="text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors hover:border-accent"
            style={{ background: fillFor(s), borderColor: strokeFor(s) }}
          >
            {el.elementType.replace(/_/g, " ")}
          </button>
        );
      })}
    </div>
  );
}

export function SchemaTabs({
  bodyElements,
  interiorElements,
  frameElements,
  wheelsElements,
  glassElements,
  lightingElements,
  onElementClick,
}: {
  bodyElements: InspectionElement[];
  interiorElements: InspectionElement[];
  frameElements: InspectionElement[];
  wheelsElements: InspectionElement[];
  glassElements: InspectionElement[];
  lightingElements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
}) {
  const [tab, setTab] = useState<TabKey>("body");

  return (
    <div className="panel p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Схема осмотра
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                style={{
                  background: active ? "var(--accent)" : "var(--card)",
                  color: active ? "var(--accent-foreground)" : "var(--foreground)",
                  borderColor: active ? "var(--accent)" : "var(--border)",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "body" && (
        <CarBodySchema elements={bodyElements} onElementClick={onElementClick} embedded />
      )}
      {tab === "interior" && (
        <PlaceholderBoard
          elements={interiorElements}
          emptyText="Нет данных по салону"
          onElementClick={onElementClick}
        />
      )}
      {tab === "frame" && (
        <FrameSchema elements={frameElements} onElementClick={onElementClick} />
      )}
      {tab === "wheels" && (
        <WheelsSchema elements={wheelsElements} onElementClick={onElementClick} />
      )}
      {tab === "glass" && (
        <GlassSchema elements={glassElements} onElementClick={onElementClick} />
      )}
      {tab === "lighting" && (
        <LightingSchema elements={lightingElements} onElementClick={onElementClick} />
      )}
    </div>
  );
}
