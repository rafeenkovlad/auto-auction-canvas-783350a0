import { useState, useMemo } from "react";
import type { InspectionElement } from "@/lib/report.api";
import frameImg from "@/assets/frame-schema.png";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";
import { getElementStatus, statusFill, statusStroke, type Status } from "@/lib/report.utils";

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
  front_pillar: "295,560 305,395 345,345 380,340 365,400 360,560",
  center_pillar: "510,575 510,400 520,335 560,335 565,400 565,575",
  rear_pillar: "720,575 725,400 740,335 790,340 785,420 775,575",
  sill: "285,580 790,580 790,628 285,628",
  side_beam: "325,510 510,510 510,540 325,540 M 565,510 720,510 720,540 565,540",
};

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

export function FrameSchema({
  elements,
  onElementClick,
}: {
  elements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
}) {
  const [side, setSide] = useState<Side>("left");

  const byType = useMemo(() => {
    const m = new Map<string, InspectionElement>();
    for (const el of elements) m.set(el.elementType, el);
    return m;
  }, [elements]);

  const zones: ZoneKey[] = ["front_pillar", "center_pillar", "rear_pillar", "sill", "side_beam"];

  function getEl(zone: ZoneKey): InspectionElement | undefined {
    return byType.get(elementIdFor(zone, side));
  }
  function statusForZone(zone: ZoneKey): Status | "none" {
    const el = getEl(zone);
    return el ? getElementStatus(el) : "none";
  }

  const sideHeader = (
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
  );

  const renderCanvas = ({ hoverKey, setHoverKey }: SchemaCanvasApi) => (
    <div
      className="relative w-full mx-auto"
      style={{ aspectRatio: "1 / 1", maxWidth: 640 }}
    >
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
          const elId = elementIdFor(zone, side);
          const el = byType.get(elId);
          const s = statusForZone(zone);
          const isHover = hoverKey === elId;
          const polys = zone === "side_beam" ? SIDE_BEAM_POLYS : [ZONE_POLYS[zone]];
          const fill = s === "none" ? "transparent" : statusFill(s);
          const stroke = isHover
            ? "var(--accent)"
            : s === "none"
              ? "oklch(0.62 0.008 250 / 0.6)"
              : statusStroke(s);
          const sw = isHover ? 3 : 2;
          return (
            <g
              key={zone}
              onMouseEnter={() => el && setHoverKey(elId)}
              onMouseLeave={() => setHoverKey(null)}
              onClick={() => el && onElementClick?.(el)}
              style={{ cursor: el ? "pointer" : "default", transition: "all 140ms ease" }}
            >
              {polys.map((p, i) => (
                <polygon
                  key={i}
                  points={p}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );

  return (
    <SchemaShell
      elements={elements}
      header={sideHeader}
      canvas={renderCanvas}
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
