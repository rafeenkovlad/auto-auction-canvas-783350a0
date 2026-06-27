import { useMemo, type ReactNode } from "react";
import type { InspectionElement } from "@/lib/report.api";
import { getElementStatus, statusFill, statusStroke, type Status } from "@/lib/report.utils";

export type ZoneShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "polygon"; points: string };

export interface Zone {
  /** Possible elementType strings that match this zone (first match wins). */
  types: string[];
  /** Russian label */
  label: string;
  shape: ZoneShape;
}

/** Re-exports for legacy callers; prefer importing from report.utils directly. */
export { getElementStatus as statusOf };
export function fillFor(s: Status | "none") {
  return s === "none" ? "transparent" : statusFill(s);
}
export function strokeFor(s: Status | "none", hovered: boolean) {
  if (hovered) return "var(--accent)";
  return s === "none" ? "oklch(0.62 0.008 250 / 0.6)" : statusStroke(s);
}

/** Stateless SVG canvas drawing the silhouette + zone hotspots. */
export function ZoneCanvas({
  viewBox,
  baseSvg,
  zones,
  elements,
  hoverKey,
  setHoverKey,
  onElementClick,
  maxWidth = 640,
}: {
  viewBox: string;
  baseSvg: ReactNode;
  zones: Zone[];
  elements: InspectionElement[];
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
  onElementClick?: (el: InspectionElement) => void;
  maxWidth?: number;
}) {
  const byType = useMemo(() => {
    const m = new Map<string, InspectionElement>();
    for (const el of elements) m.set(el.elementType, el);
    return m;
  }, [elements]);

  function elForZone(z: Zone): InspectionElement | undefined {
    for (const t of z.types) {
      const e = byType.get(t);
      if (e) return e;
    }
    return undefined;
  }

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth }}>
      <svg viewBox={viewBox} className="w-full h-auto block">
        {baseSvg}
        {zones.map((z, i) => {
          const el = elForZone(z);
          const s: Status | "none" = el ? getElementStatus(el) : "none";
          const key = el?.elementType ?? `__zone_${i}`;
          const isHover = hoverKey === key;
          const fill = fillFor(s);
          const stroke = strokeFor(s, isHover);
          const sw = isHover ? 2.5 : 1.5;
          const handlers = el
            ? {
                onMouseEnter: () => setHoverKey(key),
                onMouseLeave: () => setHoverKey(null),
                onClick: () => onElementClick?.(el),
                style: { cursor: "pointer", transition: "all 140ms ease" },
              }
            : {};
          const common = {
            fill,
            stroke,
            strokeWidth: sw,
            strokeLinejoin: "round" as const,
            vectorEffect: "non-scaling-stroke" as const,
          };
          return (
            <g key={i} {...handlers}>
              {z.shape.kind === "rect" && (
                <rect
                  x={z.shape.x}
                  y={z.shape.y}
                  width={z.shape.w}
                  height={z.shape.h}
                  rx={z.shape.rx ?? 4}
                  {...common}
                />
              )}
              {z.shape.kind === "ellipse" && (
                <ellipse
                  cx={z.shape.cx}
                  cy={z.shape.cy}
                  rx={z.shape.rx}
                  ry={z.shape.ry}
                  {...common}
                />
              )}
              {z.shape.kind === "polygon" && (
                <polygon points={z.shape.points} {...common} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
