import { useMemo } from "react";
import type { InspectionElement } from "@/lib/report.api";
import frameImg from "@/assets/frame-schema.png";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";
import { getElementStatus, statusFill, type Status } from "@/lib/report.utils";

type Side = "left" | "right";
type ZoneKey = "front_pillar" | "center_pillar" | "rear_pillar" | "sill" | "side_beam";

const ZONE_LABEL: Record<ZoneKey, string> = {
  front_pillar: "Передняя стойка (A)",
  center_pillar: "Центральная стойка (B)",
  rear_pillar: "Задняя стойка (D)",
  sill: "Порог",
  side_beam: "Боковая балка",
};

const ZONE_POLYS: Record<ZoneKey, string> = {
  front_pillar: "415,395 430,395 355,455 322,512 312,570 322,628 288,628 285,560 290,510 325,455",
  center_pillar: "565,388 580,388 568,441 558,494 552,546 525,602 505,602 506,546 519,494 535,441",
  rear_pillar: "700,388 800,388 880,440 770,500 720,560 670,618 645,618 690,560 715,500 690,440",
  sill: "285,592 705,592 705,645 285,645",
  side_beam: "300,655 700,655 700,685 300,685",
};

const ZONES: ZoneKey[] = ["front_pillar", "center_pillar", "rear_pillar", "sill", "side_beam"];

function elementIdFor(zone: ZoneKey, side: Side): string {
  if (zone === "sill") return side === "left" ? "left_sill" : "right_sill";
  if (zone === "side_beam") return side === "left" ? "left_side_beam" : "right_side_beam";
  if (zone === "front_pillar") return side === "left" ? "front_left_pillar" : "front_right_pillar";
  if (zone === "center_pillar")
    return side === "left" ? "center_left_pillar" : "center_right_pillar";
  return side === "left" ? "rear_left_pillar" : "rear_right_pillar";
}

function zoneSideFromElType(t: string): { zone: ZoneKey; side: Side } | null {
  if (t === "left_sill") return { zone: "sill", side: "left" };
  if (t === "right_sill") return { zone: "sill", side: "right" };
  if (t === "left_side_beam") return { zone: "side_beam", side: "left" };
  if (t === "right_side_beam") return { zone: "side_beam", side: "right" };
  const m = t.match(/^(front|center|rear)_(left|right)_pillar$/);
  if (m) return { zone: `${m[1]}_pillar` as ZoneKey, side: m[2] as Side };
  return null;
}

function labelForElement(el: InspectionElement): string {
  const zs = zoneSideFromElType(el.elementType);
  if (!zs) return el.elementType.replace(/_/g, " ");
  const sidePrefix = zs.side === "left" ? "Левая" : "Правая";
  if (zs.zone === "sill") return `${zs.side === "left" ? "Левый" : "Правый"} порог`;
  if (zs.zone === "side_beam") return `${sidePrefix} боковая балка`;
  const pillarName =
    zs.zone === "front_pillar" ? "передняя" : zs.zone === "center_pillar" ? "центральная" : "задняя";
  return `${sidePrefix} ${pillarName} стойка`;
}

function FramePanel({
  side,
  byType,
  hoverKey,
  setHoverKey,
  onElementClick,
  mirrored,
  ariaLabel,
}: {
  side: Side;
  byType: Map<string, InspectionElement>;
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
  onElementClick?: (el: InspectionElement) => void;
  mirrored?: boolean;
  ariaLabel: string;
}) {
  const hoverZS = hoverKey ? zoneSideFromElType(hoverKey) : null;
  const showLabel = hoverZS?.side === side;
  const hoverEl = hoverKey ? byType.get(hoverKey) : null;
  const hoverLabel = showLabel
    ? hoverEl
      ? labelForElement(hoverEl)
      : hoverZS
        ? labelForElement({ elementType: hoverKey! } as InspectionElement)
        : null
    : null;

  return (
    <div className="relative w-full mx-auto" style={{ aspectRatio: "1 / 1", maxWidth: 640 }}>
      <div
        className="absolute inset-0"
        style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      >
        <img
          src={frameImg}
          alt={ariaLabel}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          loading="lazy"
          width={1024}
          height={1024}
        />
        <svg
          viewBox="0 0 1024 1024"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {ZONES.map((zone) => {
            const elId = elementIdFor(zone, side);
            const el = byType.get(elId);
            const s = el ? getElementStatus(el) : "none";
            const hasDamage = el && s !== "ok" && s !== "none";
            const fill = hasDamage ? statusFill(s as Status) : "transparent";
            return (
              <polygon
                key={zone}
                points={ZONE_POLYS[zone]}
                fill={fill}
                stroke="transparent"
                strokeWidth={0}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setHoverKey(elId)}
                onMouseLeave={() => setHoverKey(null)}
                onClick={() => el && onElementClick?.(el)}
                style={{ cursor: el ? "pointer" : "default", transition: "all 140ms ease", pointerEvents: "all" }}
              />
            );
          })}
        </svg>
      </div>
      {hoverLabel && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm whitespace-nowrap"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {hoverLabel}
        </div>
      )}
    </div>
  );
}

export function FrameSchema({
  elements,
  onElementClick,
}: {
  elements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
}) {
  const byType = useMemo(() => {
    const m = new Map<string, InspectionElement>();
    for (const el of elements) m.set(el.elementType, el);
    return m;
  }, [elements]);

  return (
    <SchemaShell
      elements={elements}
      alwaysRenderCanvas
      hideHoverLabel
      canvas={({ hoverKey, setHoverKey }: SchemaCanvasApi) => (
        <div className="flex flex-col gap-3 items-stretch">
          <FramePanel
            side="left"
            ariaLabel="Схема силовых элементов — левая сторона"
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
          />
          <FramePanel
            side="right"
            ariaLabel="Схема силовых элементов — правая сторона"
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
            mirrored
          />
        </div>
      )}
      zoneKeyForElement={(el) => el.elementType}
      zoneLabelForElement={labelForElement}
      zoneLabelForKey={(k) => {
        const e = byType.get(k);
        return e ? labelForElement(e) : (ZONE_LABEL as Record<string, string>)[k] ?? k;
      }}
      onElementClick={onElementClick}
      emptyText="Нет данных по силовым элементам"
    />
  );
}
