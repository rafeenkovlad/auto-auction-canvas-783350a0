import type { InspectionElement } from "@/lib/report.api";
import { ZoneCanvas, type Zone } from "@/components/ZoneSchema";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";

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

function labelFor(el: InspectionElement): string {
  for (const z of ZONES) if (z.types.includes(el.elementType)) return z.label;
  return el.elementType.replace(/_/g, " ");
}

export function WheelsSchema({
  elements,
  onElementClick,
}: {
  elements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
}) {
  return (
    <SchemaShell
      elements={elements}
      canvas={({ hoverKey, setHoverKey }: SchemaCanvasApi) => (
        <ZoneCanvas
          viewBox="0 0 440 500"
          baseSvg={BASE}
          zones={ZONES}
          elements={elements}
          hoverKey={hoverKey}
          setHoverKey={setHoverKey}
          onElementClick={onElementClick}
          maxWidth={420}
        />
      )}
      zoneKeyForElement={(el) => el.elementType}
      zoneLabelForElement={labelFor}
      zoneLabelForKey={(k) => {
        const el = elements.find((e) => e.elementType === k);
        return el ? labelFor(el) : k;
      }}
      onElementClick={onElementClick}
      emptyText="Нет данных по колёсам и тормозам"
    />
  );
}
