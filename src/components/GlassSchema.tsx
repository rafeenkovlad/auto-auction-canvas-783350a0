import { useMemo } from "react";
import type { InspectionElement } from "@/lib/report.api";
import { type Zone, fillFor, strokeFor } from "@/components/ZoneSchema";
import { getElementStatus } from "@/lib/report.utils";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";
import carFront from "@/assets/car-front.png";
import carRear from "@/assets/car-rear.png";
import carSide from "@/assets/car-side.png";

const IMG_W = 1536;
const IMG_H = 1024;

const FRONT_ZONES: Zone[] = [
  {
    types: ["windshield", "front_windshield"],
    label: "Лобовое стекло",
    shape: {
      kind: "polygon",
      points: "470,275 1066,275 1110,395 426,395",
    },
  },
];

const REAR_ZONES: Zone[] = [
  {
    types: ["rear_window", "rear_windshield", "back_window"],
    label: "Заднее стекло",
    shape: {
      kind: "polygon",
      points: "445,205 1091,205 1140,355 396,355",
    },
  },
];

// Боковая сторона: автомобиль смотрит влево (перёд слева на изображении)
const LEFT_SIDE_ZONES: Zone[] = [
  {
    types: ["front_left_window", "front_left_glass", "left_front_window"],
    label: "Переднее левое стекло",
    shape: {
      kind: "polygon",
      points: "560,395 820,378 820,500 560,500",
    },
  },
  {
    types: ["rear_left_window", "rear_left_glass", "left_rear_window"],
    label: "Заднее левое стекло",
    shape: {
      kind: "polygon",
      points: "835,378 1120,392 1120,500 835,500",
    },
  },
];

// Правая сторона использует ТО ЖЕ изображение, но визуально зеркалится (scaleX(-1)).
// Координаты контуров одинаковые — зеркалятся вместе с картинкой.
const RIGHT_SIDE_ZONES: Zone[] = [
  {
    types: ["front_right_window", "front_right_glass", "right_front_window"],
    label: "Переднее правое стекло",
    shape: {
      kind: "polygon",
      points: "560,395 820,378 820,500 560,500",
    },
  },
  {
    types: ["rear_right_window", "rear_right_glass", "right_rear_window"],
    label: "Заднее правое стекло",
    shape: {
      kind: "polygon",
      points: "835,378 1120,392 1120,500 835,500",
    },
  },
];

const ALL_ZONES = [
  ...FRONT_ZONES,
  ...REAR_ZONES,
  ...LEFT_SIDE_ZONES,
  ...RIGHT_SIDE_ZONES,
];

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
    <div className="flex-1 min-w-0 relative w-full max-w-[260px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[480px] mx-auto">
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

export function GlassSchema({
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
        <div className="grid grid-cols-2 gap-0">
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
          <ImagePanel
            imageUrl={carSide}
            zones={LEFT_SIDE_ZONES}
            byType={byType}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
            onElementClick={onElementClick}
          />
          <ImagePanel
            imageUrl={carSide}
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
      emptyText="Нет данных по стёклам"
    />
  );
}
