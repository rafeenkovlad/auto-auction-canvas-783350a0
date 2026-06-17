import { useMemo, useState } from "react";
import type { InspectionElement } from "@/lib/report.api";

export type Status = "ok" | "minor" | "serious" | "none";

export function statusOf(el: InspectionElement): Status {
  if (el.seriousDamageTags.length > 0) return "serious";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}
export function fillFor(s: Status) {
  if (s === "serious") return "color-mix(in oklab, var(--grade-bad) 45%, transparent)";
  if (s === "minor") return "color-mix(in oklab, var(--grade-warn) 45%, transparent)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 30%, transparent)";
  return "color-mix(in oklab, var(--muted) 25%, transparent)";
}
export function strokeFor(s: Status, hovered: boolean) {
  if (hovered) return "var(--accent)";
  if (s === "serious") return "var(--grade-bad)";
  if (s === "minor") return "var(--grade-warn)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 70%, oklch(0.45 0.01 250))";
  return "oklch(0.62 0.008 250 / 0.55)";
}

export interface Zone {
  /** Possible elementType strings that match this zone (first match wins). */
  types: string[];
  /** Russian label */
  label: string;
  /** SVG shape — either rect or ellipse */
  shape:
    | { kind: "rect"; x: number; y: number; w: number; h: number; rx?: number }
    | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
    | { kind: "polygon"; points: string };
}

export function ZoneSchema({
  title,
  viewBox,
  baseSvg,
  zones,
  elements,
  onElementClick,
  emptyText,
}: {
  title?: string;
  viewBox: string;
  /** Outline SVG drawn under hotspots (car silhouette etc.) */
  baseSvg: React.ReactNode;
  zones: Zone[];
  elements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
  emptyText?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

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

  const matchedTypes = new Set<string>();
  for (const z of zones) {
    for (const t of z.types) if (byType.has(t)) { matchedTypes.add(t); break; }
  }
  const others = elements.filter((e) => !matchedTypes.has(e.elementType));
  const damaged = elements.filter((e) => statusOf(e) !== "ok");

  if (!elements || elements.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground py-16">
        {emptyText ?? "Нет данных"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      )}

      <div className="relative w-full mx-auto" style={{ maxWidth: 640 }}>
        <svg viewBox={viewBox} className="w-full h-auto block">
          {baseSvg}
          {zones.map((z, i) => {
            const el = elForZone(z);
            const s: Status = el ? statusOf(el) : "none";
            const isHover = hovered === i;
            const fill = fillFor(s);
            const stroke = strokeFor(s, isHover);
            const sw = isHover ? 2.5 : 1.5;
            const handlers = el
              ? {
                  onMouseEnter: () => setHovered(i),
                  onMouseLeave: () => setHovered(null),
                  onClick: () => onElementClick?.(el),
                  style: { cursor: "pointer" },
                }
              : {};
            const common = { fill, stroke, strokeWidth: sw, strokeLinejoin: "round" as const };
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

      {others.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Прочие элементы
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {others.map((el) => {
              const s = statusOf(el);
              return (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => onElementClick?.(el)}
                  className="text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:border-accent"
                  style={{ background: fillFor(s), borderColor: strokeFor(s, false) }}
                >
                  {el.elementType.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
