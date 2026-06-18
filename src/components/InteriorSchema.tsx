import { useMemo } from "react";
import type { InspectionElement } from "@/lib/report.api";
import { type Zone, fillFor } from "@/components/ZoneSchema";
import { getElementStatus } from "@/lib/report.utils";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";
import interiorFront from "@/assets/interior-front.png";
import interiorRear from "@/assets/interior-rear.png";

// Per-image natural dimensions
const FRONT_W = 1365;
const FRONT_H = 768;
const REAR_W = 1264;
const REAR_H = 843;

const FRONT_ZONES: Zone[] = [
  {
    types: ["ceiling"],
    label: "Потолок",
    shape: { kind: "polygon", points: "150,0 1215,0 1215,180 950,210 415,210 150,180" },
  },
  {
    types: ["dashboard"],
    label: "Приборная панель (торпедо)",
    shape: {
      kind: "polygon",
      points: "150,210 1220,210 1220,330 1080,360 285,360 150,330",
    },
  },
  {
    types: ["instrument_cluster"],
    label: "Панель приборов",
    shape: { kind: "rect", x: 310, y: 240, w: 240, h: 110, rx: 12 },
  },
  {
    types: ["steering_wheel"],
    label: "Рулевое колесо",
    shape: { kind: "ellipse", cx: 415, cy: 365, rx: 145, ry: 120 },
  },
  {
    types: ["buttons_left_of_steering_wheel"],
    label: "Кнопки слева от руля",
    shape: { kind: "rect", x: 230, y: 340, w: 75, h: 70, rx: 8 },
  },
  {
    types: ["central_monitor"],
    label: "Центральный монитор",
    shape: { kind: "rect", x: 580, y: 275, w: 250, h: 135, rx: 10 },
  },
  {
    types: ["climate_control_unit"],
    label: "Блок климат-контроля",
    shape: { kind: "rect", x: 600, y: 415, w: 175, h: 110, rx: 10 },
  },
  {
    types: ["gear_selector_area"],
    label: "Область селектора передач",
    shape: { kind: "rect", x: 615, y: 540, w: 160, h: 140, rx: 12 },
  },
  {
    types: ["center_console"],
    label: "Центральная консоль",
    shape: { kind: "polygon", points: "555,525 825,525 825,768 555,768" },
  },
  {
    types: ["front_seats"],
    label: "Передние сиденья",
    shape: { kind: "rect", x: 140, y: 565, w: 1090, h: 203, rx: 16 },
  },
];

const REAR_ZONES: Zone[] = [
  {
    types: ["ceiling"],
    label: "Потолок",
    shape: { kind: "rect", x: 100, y: 25, w: 1070, h: 150, rx: 20 },
  },
  {
    types: ["rear_seats"],
    label: "Задние сиденья",
    shape: { kind: "rect", x: 230, y: 240, w: 380, h: 430, rx: 18 },
  },
  {
    types: ["trunk_compartment"],
    label: "Багажное отделение",
    shape: { kind: "polygon", points: "615,275 1075,300 1075,580 720,580 615,470" },
  },
];

const ALL_ZONES = [...FRONT_ZONES, ...REAR_ZONES];

function labelFor(el: InspectionElement): string {
  for (const z of ALL_ZONES) if (z.types.includes(el.elementType)) return z.label;
  return el.elementType.replace(/_/g, " ");
}

function ImagePanel({
  imageUrl,
  ariaLabel,
  zones,
  width,
  height,
  byType,
  hoverKey,
  setHoverKey,
  onElementClick,
}: {
  imageUrl: string;
  ariaLabel: string;
  zones: Zone[];
  width: number;
  height: number;
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
    <div className="flex-1 min-w-0 relative w-full max-w-[360px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[580px] mx-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel}
      >
        <image href={imageUrl} x={0} y={0} width={width} height={height} />
        {zones.map((z) => {
          const el = z.types.map((t) => byType.get(t)).find(Boolean);
          const key = z.types[0];
          const s = el ? getElementStatus(el) : "none";
          const hasDamage = el && s !== "ok";
          const fill = hasDamage ? fillFor(s) : "transparent";
          const handlers = {
            onMouseEnter: () => setHoverKey(key),
            onMouseLeave: () => setHoverKey(null),
            onClick: el ? () => onElementClick?.(el) : undefined,
            style: { cursor: el ? "pointer" : "default", transition: "all 140ms ease" },
          };
          const common = {
            fill,
            stroke: "transparent",
            strokeWidth: 0,
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

export function InteriorSchema({
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
        <div className="flex flex-col gap-3 items-stretch">
          <ImagePanel
            imageUrl={interiorRear}
            ariaLabel="Салон — задний ряд"
            zones={REAR_ZONES}
            width={REAR_W}
            height={REAR_H}
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
          />
          <ImagePanel
            imageUrl={interiorFront}
            ariaLabel="Салон — передний ряд и торпедо"
            zones={FRONT_ZONES}
            width={FRONT_W}
            height={FRONT_H}
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
      emptyText="Нет данных по салону"
    />
  );
}
