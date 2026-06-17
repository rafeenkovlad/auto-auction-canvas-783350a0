import { useState, useMemo } from "react";
import type { InspectionElement } from "@/lib/report.functions";
import frameImg from "@/assets/frame-schema.png";

type Status = "ok" | "minor" | "serious" | "none";
type Side = "left" | "right";

function statusOf(el: InspectionElement): Status {
  if (el.seriousDamageTags.length > 0) return "serious";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}
function fillFor(s: Status) {
  if (s === "serious") return "color-mix(in oklab, var(--grade-bad) 45%, transparent)";
  if (s === "minor") return "color-mix(in oklab, var(--grade-warn) 45%, transparent)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 30%, transparent)";
  return "transparent";
}
function strokeFor(s: Status, hovered: boolean) {
  if (hovered) return "var(--accent)";
  if (s === "serious") return "var(--grade-bad)";
  if (s === "minor") return "var(--grade-warn)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 70%, oklch(0.45 0.01 250))";
  return "oklch(0.62 0.008 250 / 0.6)";
}

const ZONE_LABEL: Record<string, string> = {
  front_pillar: "Передняя стойка (A)",
  center_pillar: "Центральная стойка (B)",
  rear_pillar: "Задняя стойка (D)",
  sill: "Порог",
  side_beam: "Боковая балка",
};

type ZoneKey = "front_pillar" | "center_pillar" | "rear_pillar" | "sill" | "side_beam";

// Polygon coordinates in 1024x1024 viewBox, traced from generated image.
const ZONE_POLYS: Record<ZoneKey, string> = {
  front_pillar:
    "295,560 305,395 345,345 380,340 365,400 360,560",
  center_pillar:
    "510,575 510,400 520,335 560,335 565,400 565,575",
  rear_pillar:
    "720,575 725,400 740,335 790,340 785,420 775,575",
  sill: "285,580 790,580 790,628 285,628",
  side_beam:
    "325,510 510,510 510,540 325,540 M 565,510 720,510 720,540 565,540",
};

// Side beam needs two separate polygons (front + rear door). Render as two <polygon>.
const SIDE_BEAM_POLYS = [
  "325,510 510,510 510,540 325,540",
  "565,510 720,510 720,540 565,540",
];

const SIDES: { key: Side; label: string }[] = [
  { key: "left", label: "Левая сторона" },
  { key: "right", label: "Правая сторона" },
];

function elementIdFor(zone: ZoneKey, side: Side): string {
  if (zone === "sill") return side === "left" ? "left_sill" : "right_sill";
  if (zone === "side_beam") return side === "left" ? "left_side_beam" : "right_side_beam";
  if (zone === "front_pillar") return side === "left" ? "front_left_pillar" : "front_right_pillar";
  if (zone === "center_pillar") return side === "left" ? "center_left_pillar" : "center_right_pillar";
  return side === "left" ? "rear_left_pillar" : "rear_right_pillar";
}

export function FrameSchema({
  elements,
  onElementClick,
}: {
  elements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
}) {
  const [side, setSide] = useState<Side>("left");
  const [hovered, setHovered] = useState<ZoneKey | null>(null);

  const byType = useMemo(() => {
    const m = new Map<string, InspectionElement>();
    for (const el of elements) m.set(el.elementType, el);
    return m;
  }, [elements]);

  const damaged = useMemo(
    () => elements.filter((el) => statusOf(el) !== "ok"),
    [elements],
  );

  const zones: ZoneKey[] = ["front_pillar", "center_pillar", "rear_pillar", "sill", "side_beam"];

  function getEl(zone: ZoneKey): InspectionElement | undefined {
    return byType.get(elementIdFor(zone, side));
  }
  function statusForZone(zone: ZoneKey): Status {
    const el = getEl(zone);
    return el ? statusOf(el) : "none";
  }

  function handleClick(zone: ZoneKey) {
    const el = getEl(zone);
    if (el) onElementClick?.(el);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5 justify-end">
        {SIDES.map((s) => {
          const active = side === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSide(s.key)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
              style={{
                background: active ? "var(--accent)" : "var(--card)",
                color: active ? "var(--accent-foreground)" : "var(--foreground)",
                borderColor: active ? "var(--accent)" : "var(--border)",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="relative w-full" style={{ aspectRatio: "1 / 1", maxWidth: 720, margin: "0 auto" }}>
        <img
          src={frameImg}
          alt="Схема силовых элементов"
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
          {zones.map((zone) => {
            const s = statusForZone(zone);
            const isHover = hovered === zone;
            const polys = zone === "side_beam" ? SIDE_BEAM_POLYS : [ZONE_POLYS[zone]];
            const fill = fillFor(s);
            const stroke = strokeFor(s, isHover);
            const sw = isHover ? 3 : 2;
            return (
              <g
                key={zone}
                onMouseEnter={() => setHovered(zone)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleClick(zone)}
                style={{ cursor: getEl(zone) ? "pointer" : "default" }}
              >
                {polys.map((p, i) => (
                  <polygon
                    key={i}
                    points={p}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            );
          })}
        </svg>
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

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {Object.entries(ZONE_LABEL).map(([k, v]) => (
          <span key={k}>{v}</span>
        ))}
      </div>
    </div>
  );
}
