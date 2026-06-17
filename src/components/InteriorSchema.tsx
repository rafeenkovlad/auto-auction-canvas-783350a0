import type { InspectionElement } from "@/lib/report.api";
import { SchemaShell, type SchemaCanvasApi } from "@/components/SchemaShell";
import { getElementStatus, statusFill, statusStroke } from "@/lib/report.utils";

const LABELS: Record<string, string> = {
  driver_seat: "Водительское сиденье",
  passenger_seat: "Переднее пассажирское сиденье",
  rear_seat: "Заднее сиденье",
  rear_left_seat: "Заднее левое сиденье",
  rear_right_seat: "Заднее правое сиденье",
  steering_wheel: "Руль",
  dashboard: "Приборная панель",
  ceiling: "Потолок",
  floor: "Пол",
  carpet: "Ковролин",
  trunk_interior: "Багажный отсек",
  door_card_front_left: "Обивка передней левой двери",
  door_card_front_right: "Обивка передней правой двери",
  door_card_rear_left: "Обивка задней левой двери",
  door_card_rear_right: "Обивка задней правой двери",
  gear_shift: "Селектор КПП",
  center_console: "Центральная консоль",
};

function labelFor(el: InspectionElement) {
  return LABELS[el.elementType] ?? el.elementType.replace(/_/g, " ");
}

export function InteriorSchema({
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
        <div className="grid grid-cols-2 gap-2 p-2">
          {elements.map((el) => {
            const s = getElementStatus(el);
            const isHover = hoverKey === el.elementType;
            return (
              <button
                key={el.id}
                type="button"
                onMouseEnter={() => setHoverKey(el.elementType)}
                onMouseLeave={() => setHoverKey(null)}
                onClick={() => onElementClick?.(el)}
                className="text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all"
                style={{
                  background: statusFill(s),
                  borderColor: isHover ? "var(--accent)" : statusStroke(s),
                  borderWidth: isHover ? 2 : 1,
                }}
              >
                {labelFor(el)}
              </button>
            );
          })}
        </div>
      )}
      zoneKeyForElement={(el) => el.elementType}
      zoneLabelForElement={labelFor}
      zoneLabelForKey={(k) => {
        const el = elements.find((e) => e.elementType === k);
        return el ? labelFor(el) : k;
      }}
      onElementClick={onElementClick}
      emptyText="Нет данных по салону"
    />
  );
}
