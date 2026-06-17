import type { InspectionElement } from "@/lib/report.functions";
import { ZoneSchema, type Zone } from "@/components/ZoneSchema";

// Top-down car silhouette (front pointing up).
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
    {/* roof / windshield hint */}
    <path
      d="M150 130 Q220 100 290 130 L280 220 L160 220 Z"
      fill="oklch(0.93 0.01 250)"
      stroke="oklch(0.8 0.008 250)"
      strokeWidth="1"
    />
    <path
      d="M160 300 L280 300 L290 400 Q220 425 150 400 Z"
      fill="oklch(0.93 0.01 250)"
      stroke="oklch(0.8 0.008 250)"
      strokeWidth="1"
    />
  </g>
);

const ZONES: Zone[] = [
  {
    types: ["front_left_wheel", "wheel_front_left", "front_left_tire", "left_front_wheel"],
    label: "Переднее левое колесо",
    shape: { kind: "rect", x: 78, y: 130, w: 44, h: 90, rx: 10 },
  },
  {
    types: ["front_right_wheel", "wheel_front_right", "front_right_tire", "right_front_wheel"],
    label: "Переднее правое колесо",
    shape: { kind: "rect", x: 318, y: 130, w: 44, h: 90, rx: 10 },
  },
  {
    types: ["rear_left_wheel", "wheel_rear_left", "rear_left_tire", "left_rear_wheel"],
    label: "Заднее левое колесо",
    shape: { kind: "rect", x: 78, y: 310, w: 44, h: 90, rx: 10 },
  },
  {
    types: ["rear_right_wheel", "wheel_rear_right", "rear_right_tire", "right_rear_wheel"],
    label: "Заднее правое колесо",
    shape: { kind: "rect", x: 318, y: 310, w: 44, h: 90, rx: 10 },
  },
  {
    types: ["spare_wheel", "spare_tire"],
    label: "Запасное колесо",
    shape: { kind: "ellipse", cx: 220, cy: 460, rx: 28, ry: 14 },
  },
];

export function WheelsSchema({
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
      emptyText="Нет данных по колёсам и тормозам"
    />
  );
}
