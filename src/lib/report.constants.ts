import type { ReactNode } from "react";

export const SECTION_LABELS: Record<string, string> = {
  bodyElements: "Кузов и ЛКП",
  bodyReinforcementElements: "Усиление кузова",
  glassElements: "Стёкла",
  interiorElements: "Салон",
  underHoodElements: "Под капотом",
  wheelsAndBrakesElements: "Колёса и тормоза",
  lightningElements: "Освещение",
  computerDiagnosticsElements: "Диагностика",
};

export const SECTION_KEYS = [
  "bodyElements",
  "bodyReinforcementElements",
  "glassElements",
  "interiorElements",
  "underHoodElements",
  "wheelsAndBrakesElements",
  "lightningElements",
  "computerDiagnosticsElements",
] as const;

import { createElement } from "react";

const svg = (children: ReactNode) =>
  createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      className: "w-5 h-5",
    },
    children,
  );

export const SECTION_ICONS: Record<string, ReactNode> = {
  bodyElements: svg([
    createElement("path", {
      key: "p",
      d: "M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
    }),
    createElement("circle", { key: "c1", cx: "7.5", cy: "16", r: "1.5" }),
    createElement("circle", { key: "c2", cx: "16.5", cy: "16", r: "1.5" }),
  ]),
  bodyReinforcementElements: svg(
    createElement("path", { d: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" }),
  ),
  glassElements: svg([
    createElement("rect", { key: "r", x: "3", y: "5", width: "18", height: "14", rx: "2" }),
    createElement("path", { key: "p", d: "M3 9h18" }),
  ]),
  interiorElements: svg([
    createElement("path", { key: "p1", d: "M6 21V10a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v11" }),
    createElement("path", { key: "p2", d: "M6 14h12" }),
  ]),
  underHoodElements: svg([
    createElement("rect", { key: "r", x: "4", y: "9", width: "16", height: "9", rx: "1" }),
    createElement("path", { key: "p1", d: "M8 9V6h8v3" }),
    createElement("path", { key: "p2", d: "M2 14h2M20 14h2" }),
  ]),
  wheelsAndBrakesElements: svg([
    createElement("circle", { key: "c1", cx: "12", cy: "12", r: "9" }),
    createElement("circle", { key: "c2", cx: "12", cy: "12", r: "3" }),
    createElement("path", { key: "p", d: "M12 3v6M12 15v6M3 12h6M15 12h6" }),
  ]),
  lightningElements: svg(
    createElement("path", { d: "M13 2L4 14h7l-1 8 9-12h-7z" }),
  ),
  computerDiagnosticsElements: svg([
    createElement("rect", { key: "r", x: "3", y: "4", width: "18", height: "12", rx: "2" }),
    createElement("path", { key: "p", d: "M8 20h8M12 16v4" }),
  ]),
};

export const ELEMENT_LABEL: Record<string, string> = {
  general_condition: "Общее состояние",

  // Кузов
  hood: "Капот",
  roof: "Крыша",
  trunk: "Крышка багажника",
  trunk_lid: "Крышка багажника",
  trunk_compartment: "Багажный отсек",
  front_bumper: "Передний бампер",
  rear_bumper: "Задний бампер",
  front_left_fender: "Переднее левое крыло",
  front_right_fender: "Переднее правое крыло",
  rear_left_fender: "Заднее левое крыло",
  rear_right_fender: "Заднее правое крыло",
  front_left_door: "Передняя левая дверь",
  front_right_door: "Передняя правая дверь",
  rear_left_door: "Задняя левая дверь",
  rear_right_door: "Задняя правая дверь",
  left_threshold: "Левый порог",
  right_threshold: "Правый порог",
  left_sill: "Левый порог",
  right_sill: "Правый порог",
  sill: "Порог",

  // Усиление кузова / силовые
  front_left_pillar: "Передняя левая стойка",
  front_right_pillar: "Передняя правая стойка",
  center_left_pillar: "Центральная левая стойка",
  center_right_pillar: "Центральная правая стойка",
  rear_left_pillar: "Задняя левая стойка",
  rear_right_pillar: "Задняя правая стойка",
  front_pillar: "Передняя стойка",
  center_pillar: "Центральная стойка",
  rear_pillar: "Задняя стойка",
  left_side_beam: "Левый лонжерон",
  right_side_beam: "Правый лонжерон",
  side_beam: "Лонжерон",

  // Стёкла
  windshield: "Лобовое стекло",
  front_windshield: "Лобовое стекло",
  rear_windshield: "Заднее стекло",
  rear_window: "Заднее стекло",
  back_window: "Заднее стекло",
  front_left_window: "Переднее левое стекло",
  front_right_window: "Переднее правое стекло",
  rear_left_window: "Заднее левое стекло",
  rear_right_window: "Заднее правое стекло",
  left_front_window: "Переднее левое стекло",
  right_front_window: "Переднее правое стекло",
  left_rear_window: "Заднее левое стекло",
  right_rear_window: "Заднее правое стекло",
  front_left_glass: "Переднее левое стекло",
  front_right_glass: "Переднее правое стекло",
  rear_left_glass: "Заднее левое стекло",
  rear_right_glass: "Заднее правое стекло",

  // Салон
  ceiling: "Потолок",
  dashboard: "Панель приборов",
  instrument_cluster: "Приборная панель",
  central_monitor: "Центральный монитор",
  center_console: "Центральная консоль",
  climate_control_unit: "Блок климат-контроля",
  gear_selector_area: "Селектор КПП",
  steering_wheel: "Рулевое колесо",
  buttons_left_of_steering_wheel: "Кнопки слева от руля",
  front_seats: "Передние сиденья",
  rear_seats: "Задние сиденья",
  srs_airbag: "SRS / Подушки безопасности",

  // Колёса и тормоза
  front_left_wheel: "Переднее левое колесо",
  front_right_wheel: "Переднее правое колесо",
  rear_left_wheel: "Заднее левое колесо",
  rear_right_wheel: "Заднее правое колесо",
  left_front_wheel: "Переднее левое колесо",
  right_front_wheel: "Переднее правое колесо",
  left_rear_wheel: "Заднее левое колесо",
  right_rear_wheel: "Заднее правое колесо",
  wheel_front_left: "Переднее левое колесо",
  wheel_front_right: "Переднее правое колесо",
  wheel_rear_left: "Заднее левое колесо",
  wheel_rear_right: "Заднее правое колесо",
  front_left_tire: "Передняя левая шина",
  front_right_tire: "Передняя правая шина",
  rear_left_tire: "Задняя левая шина",
  rear_right_tire: "Задняя правая шина",
  spare_tire: "Запасное колесо",
  spare_wheel: "Запасное колесо",

  // Освещение
  left_headlight: "Левая фара",
  right_headlight: "Правая фара",
  headlight_left: "Левая фара",
  headlight_right: "Правая фара",
  front_left_headlight: "Левая фара",
  front_right_headlight: "Правая фара",
  left_fog_light: "Левая противотуманная фара",
  right_fog_light: "Правая противотуманная фара",
  fog_light_left: "Левая противотуманная фара",
  fog_light_right: "Правая противотуманная фара",
  front_left_fog_light: "Левая противотуманная фара",
  front_right_fog_light: "Правая противотуманная фара",
  left_taillight: "Левый задний фонарь",
  right_taillight: "Правый задний фонарь",
  taillight_left: "Левый задний фонарь",
  taillight_right: "Правый задний фонарь",
  rear_left_taillight: "Левый задний фонарь",
  rear_right_taillight: "Правый задний фонарь",
  left_rear_light: "Левый задний фонарь",
  right_rear_light: "Правый задний фонарь",
};

export const STEP_LABELS: Record<string, string> = {
  car: "Авто",
  characteristics: "Характеристики",
  documents: "ПТС/СТС",
  legal: "Юр. проверка",
  inspection: "Осмотр",
  testDrive: "Тест-драйв",
  result: "Заключение",
};
