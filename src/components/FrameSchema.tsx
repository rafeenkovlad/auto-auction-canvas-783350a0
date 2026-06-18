import { useState, useMemo } from "react";
import type { InspectionElement } from "@/lib/report.api";
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

// Car side view, 1024x1024 viewBox
const ZONE_POLYS: Record<ZoneKey, string> = {
  front_pillar: "360,460 395,460 515,300 490,300",
  center_pillar: "570,465 605,465 605,305 570,305",
  rear_pillar: "680,300 705,300 845,470 820,470",
  sill: "360,695 700,695 700,735 360,735",
  side_beam: "",
};

const SIDE_BEAM_POLYS = [
  "395,580 570,580 570,610 395,610",
  "605,580 680,580 680,610 605,610",
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
      <svg
        viewBox="0 0 1024 1024"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{
          // Side mirroring for right side
          transform: side === "right" ? "scaleX(-1)" : undefined,
        }}
      >
        {/* === Car silhouette (non-interactive) === */}
        <g
          fill="none"
          stroke="oklch(0.55 0.01 250 / 0.55)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        >
          {/* Body outline */}
          <path d="M 150,560 Q 145,520 175,505 L 280,475 Q 310,470 340,465 L 360,460 L 490,300 Q 510,288 580,288 Q 660,288 680,300 L 820,470 L 870,478 Q 905,485 915,510 L 925,560 Q 928,600 920,640 L 905,695 L 880,710 L 700,710 L 360,710 L 180,710 L 150,695 Q 138,640 145,600 Z" 
                fill="oklch(0.96 0.005 250 / 0.5)" />
          {/* Belt line */}
          <line x1="360" y1="465" x2="820" y2="470" />
          {/* Door split at B-pillar (below belt) */}
          <line x1="587" y1="465" x2="587" y2="695" />
          {/* Door bottom (front door inner edge to A pillar base) */}
          <line x1="395" y1="465" x2="395" y2="695" strokeDasharray="4 6" opacity="0.5" />
          <line x1="680" y1="465" x2="680" y2="695" strokeDasharray="4 6" opacity="0.5" />
          {/* Door handles */}
          <rect x="450" y="540" width="55" height="10" rx="3" fill="oklch(0.7 0.01 250 / 0.4)" stroke="none" />
          <rect x="635" y="540" width="55" height="10" rx="3" fill="oklch(0.7 0.01 250 / 0.4)" stroke="none" />
          {/* Side mirror */}
          <path d="M 405,455 L 380,440 L 360,445 L 365,460 Z" fill="oklch(0.88 0.005 250 / 0.8)" />
          {/* Headlight */}
          <path d="M 165,510 Q 195,500 235,508 L 230,540 Q 195,545 165,540 Z" fill="oklch(0.92 0.02 95 / 0.5)" />
          {/* Taillight */}
          <path d="M 880,505 Q 905,505 915,520 L 918,545 Q 900,548 875,545 Z" fill="oklch(0.65 0.18 25 / 0.4)" stroke="none" />
        </g>

        {/* Wheels */}
        <g pointerEvents="none">
          <circle cx="270" cy="715" r="98" fill="oklch(0.25 0.005 250)" />
          <circle cx="270" cy="715" r="60" fill="oklch(0.85 0.005 250)" stroke="oklch(0.55 0.01 250)" strokeWidth={2} />
          <circle cx="270" cy="715" r="14" fill="oklch(0.45 0.01 250)" />
          <circle cx="790" cy="715" r="98" fill="oklch(0.25 0.005 250)" />
          <circle cx="790" cy="715" r="60" fill="oklch(0.85 0.005 250)" stroke="oklch(0.55 0.01 250)" strokeWidth={2} />
          <circle cx="790" cy="715" r="14" fill="oklch(0.45 0.01 250)" />
        </g>

        {/* === Interactive structural zones === */}
        {zones.map((zone) => {
          const elId = elementIdFor(zone, side);
          const el = byType.get(elId);
          const s = statusForZone(zone);
          const isHover = hoverKey === elId;
          const polys = zone === "side_beam" ? SIDE_BEAM_POLYS : [ZONE_POLYS[zone]];
          const baseFill = s === "none" ? "oklch(0.72 0.02 250 / 0.35)" : statusFill(s);
          const fill = isHover ? "oklch(0.72 0.02 250 / 0.55)" : baseFill;
          const stroke = isHover
            ? "var(--accent)"
            : s === "none"
              ? "oklch(0.5 0.01 250 / 0.8)"
              : statusStroke(s);
          const sw = isHover ? 3 : 1.75;
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

        {/* Pillar labels */}
        <g
          fill="oklch(0.45 0.01 250)"
          fontSize="22"
          fontWeight={600}
          textAnchor="middle"
          pointerEvents="none"
          style={{ transform: side === "right" ? "scaleX(-1)" : undefined, transformOrigin: "center" }}
        >
          <text x="442" y="395">A</text>
          <text x="587" y="395">B</text>
          <text x="763" y="395">D</text>
        </g>
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
