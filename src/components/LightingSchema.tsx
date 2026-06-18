import { useMemo } from "react";
import type { InspectionElement } from "@/lib/report.api";
import { type Zone, fillFor, strokeFor } from "@/components/ZoneSchema";
import { getElementStatus } from "@/lib/report.utils";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";
import carFront from "@/assets/car-front.png";
import carRear from "@/assets/car-rear.png";

const IMG_W = 1536;
const IMG_H = 1024;

const FRONT_ZONES: Zone[] = [
  {
    types: ["left_headlight", "front_left_headlight", "headlight_left"],
    label: "Левая фара",
    shape: { kind: "polygon", points: "260,478 590,488 575,558 280,545" },
  },
  {
    types: ["right_headlight", "front_right_headlight", "headlight_right"],
    label: "Правая фара",
    shape: { kind: "polygon", points: "1276,478 946,488 961,558 1256,545" },
  },
  {
    types: ["left_fog_light", "front_left_fog_light", "fog_light_left"],
    label: "Левая ПТФ",
    shape: { kind: "rect", x: 220, y: 640, w: 195, h: 115, rx: 30 },
  },
  {
    types: ["right_fog_light", "front_right_fog_light", "fog_light_right"],
    label: "Правая ПТФ",
    shape: { kind: "rect", x: 1121, y: 640, w: 195, h: 115, rx: 30 },
  },
];

const REAR_ZONES: Zone[] = [
  {
    types: ["left_taillight", "rear_left_taillight", "taillight_left", "left_rear_light"],
    label: "Левый задний фонарь",
    shape: { kind: "polygon", points: "235,377 610,387 595,440 370,475 235,470" },
  },
  {
    types: ["right_taillight", "rear_right_taillight", "taillight_right", "right_rear_light"],
    label: "Правый задний фонарь",
    shape: { kind: "polygon", points: "1301,377 926,387 941,440 1166,475 1301,470" },
  },
];

const ALL_ZONES = [...FRONT_ZONES, ...REAR_ZONES];

function labelFor(el: InspectionElement): string {
  for (const z of ALL_ZONES) if (z.types.includes(el.elementType)) return z.label;
  return el.elementType.replace(/_/g, " ");
}

function ImagePanel({
  imageUrl,
  zones,
  byType,
  hoverKey,
  setHoverKey,
  onElementClick,
}: {
  imageUrl: string;
  zones: Zone[];
  byType: Map<string, InspectionElement>;
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
  onElementClick?: (el: InspectionElement) => void;
}) {
  const panelLabel =
    hoverKey && zones.some((z) => z.types.includes(hoverKey))
      ? zones.find((z) => z.types.includes(hoverKey))?.label ?? null
      : null;
  return (
    <div className="flex-1 min-w-0 relative">
      <svg
        viewBox={`0 0 ${IMG_W} ${IMG_H}`}
        className="w-full h-auto block"
        preserveAspectRatio="xMidYMid meet"
      >
        <image href={imageUrl} x={0} y={0} width={IMG_W} height={IMG_H} />
        {zones.map((z) => {
          const el = z.types.map((t) => byType.get(t)).find(Boolean);
          const key = z.types[0];
          const s = el ? getElementStatus(el) : "none";
          const isHover = hoverKey === key;
          const hasDamage = el && s !== "ok";
          const fill = hasDamage ? fillFor(s) : "transparent";
          const stroke = "transparent";
          const sw = 0;
          const handlers = {
            onMouseEnter: () => setHoverKey(key),
            onMouseLeave: () => setHoverKey(null),
            onClick: el ? () => onElementClick?.(el) : undefined,
            style: { cursor: el ? "pointer" : "default", transition: "all 140ms ease" },
          };

          const common = {
            fill,
            stroke,
            strokeWidth: sw,
            strokeLinejoin: "round" as const,
            vectorEffect: "non-scaling-stroke" as const,
            ...handlers,
          };
          if (z.shape.kind === "rect") {
            return (
              <rect
                key={key}
                x={z.shape.x}
                y={z.shape.y}
                width={z.shape.w}
                height={z.shape.h}
                rx={z.shape.rx ?? 8}
                {...common}
              />
            );
          }
          if (z.shape.kind === "polygon") {
            return <polygon key={key} points={z.shape.points} {...common} />;
          }
          if (z.shape.kind === "ellipse") {
            return (
              <ellipse
                key={key}
                cx={z.shape.cx}
                cy={z.shape.cy}
                rx={z.shape.rx}
                ry={z.shape.ry}
                {...common}
              />
            );
          }
          return null;
        })}
      </svg>
      <div className="mt-1.5 h-5 flex items-center justify-center">
        {panelLabel && (
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-medium shadow-sm"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {panelLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function LightingSchema({
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
      hideHoverLabel
      alwaysRenderCanvas
      canvas={({ hoverKey, setHoverKey }: SchemaCanvasApi) => (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          <ImagePanel
            imageUrl={carFront}
            zones={FRONT_ZONES}
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
          />
          <ImagePanel
            imageUrl={carRear}
            zones={REAR_ZONES}
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
          />
        </div>
      )}
      zoneKeyForElement={(el) => el.elementType}
      zoneLabelForElement={labelFor}
      zoneLabelForKey={(k) => {
        const z = ALL_ZONES.find((zn) => zn.types.includes(k));
        return z?.label ?? k;
      }}
      onElementClick={onElementClick}
      emptyText="Нет данных по освещению"
    />
  );
}
