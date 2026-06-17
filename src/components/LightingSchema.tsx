import { useMemo, useState } from "react";
import type { InspectionElement } from "@/lib/report.api";
import { type Zone, statusOf, fillFor, strokeFor } from "@/components/ZoneSchema";
import carFront from "@/assets/car-front.png.asset.json";
import carRear from "@/assets/car-rear.png.asset.json";

// Hotspots are positioned over the photo using its native pixel dimensions.
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

function ImagePanel({
  title,
  imageUrl,
  zones,
  byType,
  hovered,
  setHovered,
  onElementClick,
}: {
  title: string;
  imageUrl: string;
  zones: Zone[];
  byType: Map<string, InspectionElement>;
  hovered: string | null;
  setHovered: (k: string | null) => void;
  onElementClick?: (el: InspectionElement) => void;
}) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${IMG_W} ${IMG_H}`}
          className="w-full h-auto block"
          preserveAspectRatio="xMidYMid meet"
          aria-label={title}
        >
          <image href={imageUrl} x={0} y={0} width={IMG_W} height={IMG_H} />
          {zones.map((z, i) => {
            const el = z.types.map((t) => byType.get(t)).find(Boolean);
            const key = `${title}-${i}`;
            const s = el ? statusOf(el) : "none";
            const isHover = hovered === key;
            // Invisible by default; show overlay only on hover, or when there's damage.
            const showOverlay = isHover || (el && s !== "ok" && s !== "none");
            const fill = showOverlay ? fillFor(s) : "transparent";
            const stroke = showOverlay ? strokeFor(s, isHover) : "transparent";
            const sw = isHover ? 4 : 2.5;
            const handlers = el
              ? {
                  onMouseEnter: () => setHovered(key),
                  onMouseLeave: () => setHovered(null),
                  onClick: () => onElementClick?.(el),
                  style: { cursor: "pointer" },
                }
              : { style: { pointerEvents: "none" as const } };
            if (z.shape.kind !== "rect") return null;
            return (
              <rect
                key={key}
                x={z.shape.x}
                y={z.shape.y}
                width={z.shape.w}
                height={z.shape.h}
                rx={z.shape.rx ?? 8}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
                {...handlers}
              />
            );
          })}
        </svg>
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
  const [hovered, setHovered] = useState<string | null>(null);

  const byType = useMemo(() => {
    const m = new Map<string, InspectionElement>();
    for (const el of elements) m.set(el.elementType, el);
    return m;
  }, [elements]);

  if (!elements || elements.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground py-16">
        Нет данных по освещению
      </div>
    );
  }

  const matchedTypes = new Set<string>();
  for (const z of ALL_ZONES) {
    for (const t of z.types) if (byType.has(t)) { matchedTypes.add(t); break; }
  }
  const others = elements.filter((e) => !matchedTypes.has(e.elementType));
  const damaged = elements.filter((e) => statusOf(e) !== "ok");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
        <ImagePanel
          title="Перед"
          imageUrl={carFront.url}
          zones={FRONT_ZONES}
          byType={byType}
          hovered={hovered}
          setHovered={setHovered}
          onElementClick={onElementClick}
        />
        <ImagePanel
          title="Зад"
          imageUrl={carRear.url}
          zones={REAR_ZONES}
          byType={byType}
          hovered={hovered}
          setHovered={setHovered}
          onElementClick={onElementClick}
        />
      </div>

      {damaged.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Замечания
          </div>
          <ul className="flex flex-col gap-1">
            {damaged.map((el) => {
              const s = statusOf(el);
              return (
                <li
                  key={el.id}
                  className="flex items-center gap-2 text-xs cursor-pointer hover:text-accent"
                  onClick={() => onElementClick?.(el)}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: strokeFor(s, false) }}
                  />
                  <span className="truncate">{el.elementType.replace(/_/g, " ")}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

    </div>
  );
}
