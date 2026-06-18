import { useMemo } from "react";
import type { InspectionElement } from "@/lib/report.api";
import { type Zone, fillFor } from "@/components/ZoneSchema";
import { getElementStatus } from "@/lib/report.utils";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";
import interiorFront from "@/assets/interior-front.png";
import interiorRear from "@/assets/interior-rear.png";

const IMG_W = 1536;
const IMG_H = 1024;

const FRONT_ZONES: Zone[] = [
  {
    types: ["dashboard"],
    label: "Приборная панель (торпедо)",
    shape: { kind: "polygon", points: "180,240 1356,240 1356,360 1180,400 360,400 180,360" },
  },
  {
    types: ["instrument_cluster"],
    label: "Панель приборов",
    shape: { kind: "rect", x: 430, y: 320, w: 270, h: 110, rx: 14 },
  },
  {
    types: ["steering_wheel"],
    label: "Рулевое колесо",
    shape: { kind: "ellipse", cx: 568, cy: 530, rx: 175, ry: 145 },
  },
  {
    types: ["buttons_left_of_steering_wheel"],
    label: "Кнопки слева от руля",
    shape: { kind: "rect", x: 320, y: 470, w: 165, h: 60, rx: 10 },
  },
  {
    types: ["central_monitor"],
    label: "Центральный монитор",
    shape: { kind: "rect", x: 855, y: 410, w: 320, h: 150, rx: 10 },
  },
  {
    types: ["climate_control_unit"],
    label: "Блок климат-контроля",
    shape: { kind: "rect", x: 890, y: 565, w: 250, h: 105, rx: 10 },
  },
  {
    types: ["gear_selector_area"],
    label: "Область селектора передач",
    shape: { kind: "rect", x: 860, y: 690, w: 130, h: 140, rx: 14 },
  },
  {
    types: ["center_console"],
    label: "Центральная консоль",
    shape: { kind: "polygon", points: "820,675 1110,675 1110,1000 820,1000" },
  },
  {
    types: ["front_seats"],
    label: "Передние сиденья",
    shape: { kind: "polygon", points: "320,825 820,825 820,1020 320,1020 320,1020 320,825 M1110,825 L1310,825 L1310,1020 L1110,1020 Z" },
  },
];

// Front seats как два отдельных прямоугольника проще представить одной зоной через polygon с двумя кусками невозможно — используем rect с шириной перекрывающей зазор, исключая консоль
// Переопределяем front_seats: один широкий rect (визуально читается как пара сидений с консолью между ними поверх)
FRONT_ZONES[FRONT_ZONES.length - 1] = {
  types: ["front_seats"],
  label: "Передние сиденья",
  shape: { kind: "rect", x: 320, y: 825, w: 990, h: 200, rx: 18 },
};

const REAR_ZONES: Zone[] = [
  {
    types: ["ceiling"],
    label: "Потолок",
    shape: { kind: "rect", x: 580, y: 130, w: 740, h: 130, rx: 20 },
  },
  {
    types: ["trunk_compartment"],
    label: "Багажное отделение",
    shape: { kind: "rect", x: 620, y: 440, w: 670, h: 180, rx: 14 },
  },
  {
    types: ["rear_seats"],
    label: "Задние сиденья",
    shape: { kind: "rect", x: 590, y: 620, w: 720, h: 380, rx: 18 },
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
  byType,
  hoverKey,
  setHoverKey,
  onElementClick,
}: {
  imageUrl: string;
  ariaLabel: string;
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
    <div className="flex-1 min-w-0 relative w-full max-w-[360px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[580px] mx-auto">
      <svg
        viewBox={`0 0 ${IMG_W} ${IMG_H}`}
        className="w-full h-auto block"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel}
      >
        <image href={imageUrl} x={0} y={0} width={IMG_W} height={IMG_H} />
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
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
          />
          <ImagePanel
            imageUrl={interiorFront}
            ariaLabel="Салон — передний ряд и торпедо"
            zones={FRONT_ZONES}
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
