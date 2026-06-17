import type { InspectionElement } from "@/lib/report.functions";
import { ZoneSchema, type Zone } from "@/components/ZoneSchema";

// Top-down car silhouette with windows highlighted.
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
    {/* Mid spine */}
    <line x1="220" y1="240" x2="220" y2="280" stroke="oklch(0.85 0.005 250)" strokeWidth="1" />
  </g>
);

const ZONES: Zone[] = [
  {
    types: ["windshield", "front_windshield"],
    label: "Лобовое стекло",
    shape: {
      kind: "polygon",
      points: "150,130 290,130 280,210 160,210",
    },
  },
  {
    types: ["rear_window", "rear_windshield", "back_window"],
    label: "Заднее стекло",
    shape: {
      kind: "polygon",
      points: "160,310 280,310 290,395 150,395",
    },
  },
  {
    types: ["front_left_window", "front_left_glass", "left_front_window"],
    label: "Переднее левое стекло",
    shape: { kind: "rect", x: 124, y: 220, w: 30, h: 70, rx: 6 },
  },
  {
    types: ["front_right_window", "front_right_glass", "right_front_window"],
    label: "Переднее правое стекло",
    shape: { kind: "rect", x: 286, y: 220, w: 30, h: 70, rx: 6 },
  },
  {
    types: ["rear_left_window", "rear_left_glass", "left_rear_window"],
    label: "Заднее левое стекло",
    shape: { kind: "rect", x: 124, y: 295, w: 30, h: 70, rx: 6 },
  },
  {
    types: ["rear_right_window", "rear_right_glass", "right_rear_window"],
    label: "Заднее правое стекло",
    shape: { kind: "rect", x: 286, y: 295, w: 30, h: 70, rx: 6 },
  },
];

export function GlassSchema({
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
      emptyText="Нет данных по стёклам"
    />
  );
}
