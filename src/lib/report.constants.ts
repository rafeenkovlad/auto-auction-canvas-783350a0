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
  hood: "Капот",
  roof: "Крыша",
  trunk: "Крышка багажника",
  trunk_lid: "Крышка багажника",
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
  srs_airbag: "SRS / Подушки безопасности",
  windshield: "Лобовое стекло",
  rear_window: "Заднее стекло",
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
