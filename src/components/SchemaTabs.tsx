import { useMemo, useState } from "react";
import { getElementStatus, type Status } from "@/lib/report.utils";
import { Car, Armchair, Shield, Disc3, AppWindow, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InspectionElement } from "@/lib/report.api";
import { CarBodySchema } from "@/components/CarBodySchema";
import { FrameSchema } from "@/components/FrameSchema";
import { WheelsSchema } from "@/components/WheelsSchema";
import { GlassSchema } from "@/components/GlassSchema";
import { LightingSchema } from "@/components/LightingSchema";
import { InteriorSchema } from "@/components/InteriorSchema";


type TabKey = "body" | "interior" | "frame" | "wheels" | "glass" | "lighting";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "body", label: "Кузов", icon: Car },
  { key: "interior", label: "Салон", icon: Armchair },
  { key: "frame", label: "Силовые", icon: Shield },
  { key: "wheels", label: "Колёса", icon: Disc3 },
  { key: "glass", label: "Стёкла", icon: AppWindow },
  { key: "lighting", label: "Освещение", icon: Lightbulb },
];



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

  const elementsByTab = useMemo<Record<TabKey, InspectionElement[]>>(
    () => ({
      body: bodyElements,
      interior: interiorElements,
      frame: frameElements,
      wheels: wheelsElements,
      glass: glassElements,
      lighting: lightingElements,
    }),
    [bodyElements, interiorElements, frameElements, wheelsElements, glassElements, lightingElements],
  );

  const statusByTab = useMemo(() => {
    const res = {} as Record<TabKey, Status | "empty">;
    (Object.keys(elementsByTab) as TabKey[]).forEach((k) => {
      const els = elementsByTab[k];
      if (!els || els.length === 0) {
        res[k] = "empty";
        return;
      }
      let s: Status = "ok";
      for (const el of els) {
        const cur = getElementStatus(el);
        if (cur === "serious") { s = "serious"; break; }
        if (cur === "minor") s = "minor";
      }
      res[k] = s;
    });
    return res;
  }, [elementsByTab]);


  return (
    <div className="panel p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Схема осмотра
        </h3>
      </div>


      <div
        className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-xl"
        style={{ background: "color-mix(in oklab, var(--muted) 60%, transparent)" }}
        role="tablist"
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          const ws = statusByTab[t.key];
          const dotColor =
            ws === "serious"
              ? "var(--grade-bad)"
              : ws === "minor"
                ? "var(--grade-warn)"
                : ws === "ok"
                  ? "var(--grade-good)"
                  : "transparent";
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className="relative flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: active ? "var(--card)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: active
                  ? "0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border)"
                  : undefined,
              }}
            >
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: dotColor }}
                aria-hidden
              />
              <Icon size={16} strokeWidth={1.75} aria-hidden />
              <span>{t.label}</span>
            </button>
          );
        })}
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
