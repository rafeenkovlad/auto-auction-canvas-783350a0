import { useMemo, useState } from "react";
import { getElementStatus, type Status } from "@/lib/report.utils";
import { Car, Armchair, Shield, Disc3, AppWindow, Lightbulb, History, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InspectionElement } from "@/lib/report.api";
import { CarBodySchema } from "@/components/CarBodySchema";
import { FrameSchema } from "@/components/FrameSchema";
import { WheelsSchema } from "@/components/WheelsSchema";
import { GlassSchema } from "@/components/GlassSchema";
import { LightingSchema } from "@/components/LightingSchema";
import { InteriorSchema } from "@/components/InteriorSchema";


type TabKey = "body" | "interior" | "frame" | "wheels" | "glass" | "lighting";

type ReportHistoryEntry = {
  id: string;
  date: string;
  time: string;
  reportNumber: string;
  inspector?: string;
  mileage?: string;
  status: Status;
};

const MOCK_REPORT_HISTORY: ReportHistoryEntry[] = [
  { id: "cur", date: "12.04.2024", time: "10:37", reportNumber: "REP-A872416", inspector: "А. Петров", mileage: "84 320 км", status: "minor" },
  { id: "r2", date: "08.02.2024", time: "09:20", reportNumber: "REP-A754118", inspector: "И. Соколов", mileage: "79 110 км", status: "serious" },
  { id: "r3", date: "15.11.2023", time: "14:02", reportNumber: "REP-A612084", inspector: "А. Петров", mileage: "71 540 км", status: "minor" },
  { id: "r4", date: "03.07.2023", time: "11:48", reportNumber: "REP-A488733", inspector: "М. Иванов", mileage: "63 220 км", status: "ok" },
];

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
  const [extended, setExtended] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>(MOCK_REPORT_HISTORY[0].id);
  const selectedReport = MOCK_REPORT_HISTORY.find((r) => r.id === selectedReportId) ?? MOCK_REPORT_HISTORY[0];
  const isArchived = selectedReportId !== MOCK_REPORT_HISTORY[0].id;

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
    <div className="panel px-5 md:px-6 py-3 md:py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Схема осмотра
        </h3>
        <button
          type="button"
          onClick={() => setExtended((v) => !v)}
          aria-pressed={extended}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md border transition-colors"
          style={{
            background: extended ? "var(--card)" : "transparent",
            borderColor: "var(--border)",
            color: extended ? "var(--foreground)" : "var(--muted-foreground)",
          }}
        >
          <History size={13} strokeWidth={2} />
          Расширенный режим
        </button>
      </div>

      {extended && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              История отчётов
            </div>
            {isArchived && (
              <button
                type="button"
                onClick={() => setSelectedReportId(MOCK_REPORT_HISTORY[0].id)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                К текущему
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {MOCK_REPORT_HISTORY.map((r, i) => {
              const active = r.id === selectedReportId;
              const isCurrent = i === 0;
              const dot =
                r.status === "serious"
                  ? "var(--grade-bad)"
                  : r.status === "minor"
                    ? "var(--grade-warn)"
                    : "var(--grade-good)";
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReportId(r.id)}
                  className="flex-shrink-0 text-left rounded-lg border px-3 py-2 min-w-[150px] transition-all"
                  style={{
                    background: active ? "var(--card)" : "transparent",
                    borderColor: active ? "var(--foreground)" : "var(--border)",
                    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : undefined,
                  }}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mono">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                    <span>{r.date}</span>
                    <span>·</span>
                    <span>{r.time}</span>
                    {isCurrent && (
                      <span className="ml-auto text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-foreground/10 text-foreground">
                        текущий
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold ink mt-1 mono">{r.reportNumber}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {r.mileage} · {r.inspector}
                  </div>
                  {active && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                      <Check size={10} strokeWidth={2.5} /> Выбран
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {isArchived && (
            <div
              className="text-[11px] px-2.5 py-1.5 rounded-md"
              style={{
                background: "color-mix(in oklab, var(--grade-warn) 14%, transparent)",
                color: "var(--foreground)",
              }}
            >
              Просмотр архивного отчёта от {selectedReport.date}. Данные могут отличаться от текущего состояния автомобиля.
            </div>
          )}
        </div>
      )}

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
              className="relative flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 sm:py-3 lg:flex-row lg:gap-2 lg:py-3.5 lg:text-sm rounded-lg text-[11px] font-medium transition-all"
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
              <Icon className="w-4 h-4 lg:w-[18px] lg:h-[18px]" strokeWidth={1.75} aria-hidden />
              <span>{t.label}</span>
            </button>

          );
        })}
      </div>






      {tab === "body" && (
        <CarBodySchema elements={bodyElements} onElementClick={onElementClick} embedded />
      )}
      {tab === "interior" && (
        <InteriorSchema elements={interiorElements} onElementClick={onElementClick} />
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
