import { useMemo } from "react";
import type { InspectionElement } from "@/lib/report.api";
import { type Zone, fillFor, strokeFor } from "@/components/ZoneSchema";
import { getElementStatus } from "@/lib/report.utils";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";
import carSide from "@/assets/car-side.png.asset.json";

const IMG_W = 1536;
const IMG_H = 1024;

const LEFT_SIDE_ZONES: Zone[] = [
  {
    types: ["front_left_wheel", "wheel_front_left", "front_left_tire", "left_front_wheel"],
    label: "Переднее левое колесо",
    shape: { kind: "ellipse", cx: 360, cy: 680, rx: 130, ry: 135 },
  },
  {
    types: ["rear_left_wheel", "wheel_rear_left", "rear_left_tire", "left_rear_wheel"],
    label: "Заднее левое колесо",
    shape: { kind: "ellipse", cx: 1150, cy: 680, rx: 130, ry: 135 },
  },
];

const RIGHT_SIDE_ZONES: Zone[] = [
  {
    types: ["front_right_wheel", "wheel_front_right", "front_right_tire", "right_front_wheel"],
    label: "Переднее правое колесо",
    shape: { kind: "ellipse", cx: 360, cy: 680, rx: 130, ry: 135 },
  },
  {
    types: ["rear_right_wheel", "wheel_rear_right", "rear_right_tire", "right_rear_wheel"],
    label: "Заднее правое колесо",
    shape: { kind: "ellipse", cx: 1150, cy: 680, rx: 130, ry: 135 },
  },
];

const SPARE_LABEL = "Запасное колесо";
const SPARE_TYPES = ["spare_wheel", "spare_tire"];

const ALL_ZONES = [...LEFT_SIDE_ZONES, ...RIGHT_SIDE_ZONES];

function labelFor(el: InspectionElement): string {
  if (SPARE_TYPES.includes(el.elementType)) return SPARE_LABEL;
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
  mirrored = false,
}: {
  imageUrl: string;
  zones: Zone[];
  byType: Map<string, InspectionElement>;
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
  onElementClick?: (el: InspectionElement) => void;
  mirrored?: boolean;
}) {
  const panelLabel =
    hoverKey && zones.some((z) => z.types.includes(hoverKey))
      ? zones.find((z) => z.types.includes(hoverKey))?.label ?? null
      : null;
  return (
    <div className="flex-1 min-w-0 relative">
      <div style={mirrored ? { transform: "scaleX(-1)" } : undefined}>
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
      </div>
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

export function WheelsSchema({
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
            imageUrl={carSide.url}
            zones={LEFT_SIDE_ZONES}
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
          />
          <ImagePanel
            imageUrl={carSide.url}
            zones={RIGHT_SIDE_ZONES}
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
            mirrored
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
      emptyText="Нет данных по колёсам и тормозам"
    />
  );
}
