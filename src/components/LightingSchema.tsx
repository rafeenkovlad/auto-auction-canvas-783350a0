import type { InspectionElement } from "@/lib/report.api";
import { ZoneSchema, type Zone } from "@/components/ZoneSchema";

// Top-down car silhouette with light positions.
const BASE = (
  <g>
    <rect
      x="120"
      y="40"
      width="200"
      height="440"
      rx="60"
      fill="oklch(0.97 0.005 250)"
      stroke="oklch(0.78 0.008 250)"
      strokeWidth="1.5"
    />
    {/* front grille */}
    <rect
      x="170"
      y="62"
      width="100"
      height="14"
      rx="3"
      fill="oklch(0.88 0.005 250)"
    />
    {/* rear */}
    <rect
      x="170"
      y="448"
      width="100"
      height="14"
      rx="3"
      fill="oklch(0.88 0.005 250)"
    />
  </g>
);

const ZONES: Zone[] = [
  {
    types: ["left_headlight", "front_left_headlight", "headlight_left"],
    label: "Левая фара",
    shape: { kind: "ellipse", cx: 156, cy: 70, rx: 22, ry: 12 },
  },
  {
    types: ["right_headlight", "front_right_headlight", "headlight_right"],
    label: "Правая фара",
    shape: { kind: "ellipse", cx: 284, cy: 70, rx: 22, ry: 12 },
  },
  {
    types: ["left_fog_light", "front_left_fog_light", "fog_light_left"],
    label: "Левая ПТФ",
    shape: { kind: "ellipse", cx: 160, cy: 100, rx: 12, ry: 7 },
  },
  {
    types: ["right_fog_light", "front_right_fog_light", "fog_light_right"],
    label: "Правая ПТФ",
    shape: { kind: "ellipse", cx: 280, cy: 100, rx: 12, ry: 7 },
  },
  {
    types: ["left_taillight", "rear_left_taillight", "taillight_left", "left_rear_light"],
    label: "Левый задний фонарь",
    shape: { kind: "ellipse", cx: 156, cy: 455, rx: 22, ry: 12 },
  },
  {
    types: ["right_taillight", "rear_right_taillight", "taillight_right", "right_rear_light"],
    label: "Правый задний фонарь",
    shape: { kind: "ellipse", cx: 284, cy: 455, rx: 22, ry: 12 },
  },
];

export function LightingSchema({
  elements,
  onElementClick,
}: {
  elements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
}) {
  return (
    <ZoneSchema
      viewBox="0 0 440 500"
      baseSvg={BASE}
      zones={ZONES}
      elements={elements}
      onElementClick={onElementClick}
      emptyText="Нет данных по освещению"
    />
  );
}
