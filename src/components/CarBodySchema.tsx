import { useState, useMemo } from "react";
import type { InspectionElement } from "@/lib/report.functions";
import carTopImg from "@/assets/car-top.png";


type Status = "ok" | "minor" | "serious" | "none";
type View = "top" | "front" | "rear" | "left" | "right";

const ZONE_LABEL: Record<string, string> = {
  hood: "Капот",
  roof: "Крыша",
  trunk: "Крышка багажника",
  fbumper: "Передний бампер",
  rbumper: "Задний бампер",
  flfender: "Переднее левое крыло",
  frfender: "Переднее правое крыло",
  rlfender: "Заднее левое крыло",
  rrfender: "Заднее правое крыло",
  fldoor: "Передняя левая дверь",
  frdoor: "Передняя правая дверь",
  rldoor: "Задняя левая дверь",
  rrdoor: "Задняя правая дверь",
  lthresh: "Левый порог",
  rthresh: "Правый порог",
  windshield: "Лобовое стекло",
  rear_window: "Заднее стекло",
  lfwin: "Переднее левое стекло",
  rfwin: "Переднее правое стекло",
  lrwin: "Заднее левое стекло",
  rrwin: "Заднее правое стекло",
};

const ELEMENT_ZONE: Record<string, string> = {
  hood: "hood",
  roof: "roof",
  trunk: "trunk",
  trunk_lid: "trunk",
  front_bumper: "fbumper",
  rear_bumper: "rbumper",
  front_left_fender: "flfender",
  front_right_fender: "frfender",
  rear_left_fender: "rlfender",
  rear_right_fender: "rrfender",
  front_left_door: "fldoor",
  front_right_door: "frdoor",
  rear_left_door: "rldoor",
  rear_right_door: "rrdoor",
  left_threshold: "lthresh",
  right_threshold: "rthresh",
  windshield: "windshield",
  rear_window: "rear_window",
};

function statusOf(el: InspectionElement): Status {
  if (el.seriousDamageTags.length > 0) return "serious";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}

function rank(s: Status) {
  return s === "serious" ? 3 : s === "minor" ? 2 : s === "ok" ? 1 : 0;
}

function fillFor(s: Status) {
  if (s === "serious") return "color-mix(in oklab, var(--grade-bad) 38%, white)";
  if (s === "minor") return "color-mix(in oklab, var(--grade-warn) 42%, white)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 18%, white)";
  return "white";
}
function strokeFor(s: Status, hovered: boolean) {
  if (hovered) return "var(--accent)";
  if (s === "serious") return "var(--grade-bad)";
  if (s === "minor") return "var(--grade-warn)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 70%, oklch(0.45 0.01 250))";
  return "oklch(0.62 0.008 250)";
}

const VIEWS: { key: View; label: string }[] = [
  { key: "top", label: "Сверху" },
  { key: "left", label: "Слева" },
  { key: "right", label: "Справа" },
  { key: "front", label: "Спереди" },
  { key: "rear", label: "Сзади" },
];

export function CarBodySchema({
  elements,
  onElementClick,
}: {
  elements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
}) {
  const [view, setView] = useState<View>("top");
  const [hover, setHover] = useState<string | null>(null);

  const { zoneMap, zoneElement } = useMemo(() => {
    const m = new Map<string, Status>();
    const eMap = new Map<string, InspectionElement>();
    for (const el of elements) {
      const z = ELEMENT_ZONE[el.elementType];
      if (!z) continue;
      const st = statusOf(el);
      const cur = m.get(z);
      if (!cur || rank(st) > rank(cur)) {
        m.set(z, st);
        eMap.set(z, el);
      }
    }
    return { zoneMap: m, zoneElement: eMap };
  }, [elements]);

  const statusOfZone = (id: string): Status => zoneMap.get(id) ?? "none";

  const handleZone = (id: string) => {
    const el = zoneElement.get(id);
    if (el && onElementClick) onElementClick(el);
  };

  const zoneProps = (id: string) => {
    const st = statusOfZone(id);
    const isHover = hover === id;
    const hasEl = zoneElement.has(id);
    return {
      fill: fillFor(st),
      stroke: strokeFor(st, isHover),
      strokeWidth: isHover ? 2 : 1.2,
      strokeLinejoin: "round" as const,
      style: { cursor: hasEl ? "pointer" : "default", transition: "all 140ms ease" },
      onMouseEnter: () => setHover(id),
      onMouseLeave: () => setHover(null),
      onClick: () => handleZone(id),
    };
  };

  const damaged = useMemo(
    () =>
      elements
        .filter((e) => {
          const z = ELEMENT_ZONE[e.elementType];
          return z && (statusOf(e) === "minor" || statusOf(e) === "serious");
        })
        .sort((a, b) => rank(statusOf(b)) - rank(statusOf(a))),
    [elements],
  );

  return (
    <div className="panel p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Схема кузова
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground mr-1">Вид:</span>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
              style={{
                background: view === v.key ? "var(--accent)" : "var(--card)",
                color: view === v.key ? "var(--accent-foreground)" : "var(--foreground)",
                borderColor: view === v.key ? "var(--accent)" : "var(--border)",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_minmax(180px,240px)] gap-4">
        <div
          className="relative rounded-lg p-3 body-schema-canvas"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.985 0.003 250) 0%, oklch(0.97 0.004 250) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          {view === "top" && <TopView zoneProps={zoneProps} />}
          {view === "front" && <FrontView zoneProps={zoneProps} />}
          {view === "rear" && <RearView zoneProps={zoneProps} />}
          {view === "left" && <SideView zoneProps={zoneProps} side="left" />}
          {view === "right" && <SideView zoneProps={zoneProps} side="right" />}
          {hover && (
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              {ZONE_LABEL[hover] ?? hover}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            {(
              [
                ["ok", "Без замечаний", "var(--grade-good)"],
                ["minor", "Внимание", "var(--grade-warn)"],
                ["serious", "Повреждения", "var(--grade-bad)"],
                ["none", "Не проверялось", "oklch(0.82 0.005 250)"],
              ] as const
            ).map(([k, label, color]) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {damaged.length > 0 && (
            <div className="border-t border-border pt-3 mt-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Замечания
              </div>
              <div className="flex flex-col gap-2 max-h-[280px] overflow-auto">
                {damaged.map((el) => {
                  const z = ELEMENT_ZONE[el.elementType];
                  const st = statusOf(el);
                  const tag = el.seriousDamageTags[0]?.name ?? el.noSeriousDamageTags[0]?.name;
                  return (
                    <button
                      key={el.id}
                      type="button"
                      onMouseEnter={() => setHover(z)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onElementClick?.(el)}
                      className="text-left text-xs hover:bg-muted/60 rounded p-1.5 -mx-1.5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background:
                              st === "serious" ? "var(--grade-bad)" : "var(--grade-warn)",
                          }}
                        />
                        <span className="font-medium ink truncate">
                          {ZONE_LABEL[z] ?? el.elementType.replace(/_/g, " ")}
                        </span>
                      </div>
                      {tag && (
                        <div className="text-[11px] text-muted-foreground ml-4 mt-0.5 truncate">
                          {tag}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground text-center">
        Наведите или нажмите на элемент, чтобы увидеть детали и связанные фото
      </p>
    </div>
  );
}

type ZoneProps = (id: string) => {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeLinejoin: "round";
  style: React.CSSProperties;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
};

/* ===================================================================
 * Audi A6 Allroad (C8) — эскизы кузова, отрисованы с нуля
 * по референсу 4-проекционного блюпринта (front / rear / side / top).
 * Пропорции универсала: длинный капот, протяжённая крыша с рейлингами,
 * почти вертикальная D-стойка, чёрный обвес арок и порогов.
 * Каждая зона — отдельный <path> с zoneProps(id) для интерактива.
 * =================================================================== */

const INK = "oklch(0.32 0.012 250)";
const OUTLINE = "oklch(0.42 0.012 250)";
const DIVIDER = "oklch(0.7 0.008 250)";
const GLASS = "oklch(0.88 0.018 235)";
const DARK = "oklch(0.22 0.012 250)";
const CLAD = "oklch(0.3 0.008 250)";
const LAMP = "oklch(0.96 0.03 95)";
const TAIL = "oklch(0.58 0.16 25)";
const CHROME = "oklch(0.82 0.008 250)";

const STROKE = 1.4;

/* ============================================================
 * TOP VIEW — фоновый рендер автомобиля (PNG) + прозрачные
 * кликабельные SVG-зоны для интерактива и подсветки повреждений.
 * Координаты зон выверены под исходник 1024 × 1536.
 * ============================================================ */
function TopView({ zoneProps }: { zoneProps: ZoneProps }) {
  // Контуры зон видны всегда — тонкая дымчато-серая линия поверх фотоподложки,
  // на наведении — акцентная сплошная. По референсу-блюпринту.
  const overlay = (id: string) => {
    const z = zoneProps(id);
    const isHover = z.stroke === "var(--accent)";
    return {
      ...z,
      fill: "transparent",
      fillOpacity: 0,
      stroke: isHover ? "var(--accent)" : "oklch(0.28 0.012 250 / 0.78)",
      strokeWidth: isHover ? 2.2 : 1.3,
      strokeDasharray: isHover ? undefined : ("4 3" as const),
      vectorEffect: "non-scaling-stroke" as const,
    };
  };

  // Центры зон в координатах исходника 1024×1536
  // Выверены по фотоподложке car-top.png (силуэт ~ x:215–810, y:150–1490)
  const CENTERS: Record<string, [number, number]> = {
    fbumper:     [512, 186],
    hood:        [512, 388],
    flfender:    [300, 400],
    frfender:    [724, 400],
    windshield:  [512, 632],
    lfwin:       [330, 682],
    rfwin:       [694, 682],
    lrwin:       [330, 893],
    rrwin:       [694, 893],
    fldoor:      [304, 700],
    frdoor:      [720, 700],
    rldoor:      [304, 892],
    rrdoor:      [720, 892],
    lthresh:     [256, 780],
    rthresh:     [768, 780],
    roof:        [512, 860],
    rear_window: [512, 1070],
    rlfender:    [300, 1120],
    rrfender:    [724, 1120],
    trunk:       [512, 1197],
    rbumper:     [512, 1278],
  };


  const markerColor = (id: string): string | null => {
    const z = zoneProps(id);
    if (z.fill === "white") return null;
    return z.fill;
  };

  return (
    <svg
      viewBox="0 0 1024 1536"
      className="w-full h-auto max-h-[620px] mx-auto block"
      role="img"
      aria-label="Автомобиль — вид сверху"
    >
      {/* Фотоподложка */}
      <image
        href={carTopImg}
        x="0" y="0" width="1024" height="1536"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Контуры зон — выверены по реальному силуэту авто на фотоподложке */}
      {/* Передний бампер — арка поперёк носа */}
      <path d="M315,150 C420,128 604,128 712,150 C720,178 716,202 706,222 C612,200 412,200 318,222 C306,202 304,178 315,150 Z" {...overlay("fbumper")} />
      {/* Переднее левое крыло (боковина + арка) */}
      <path d="M254,228 C320,222 348,224 350,232 L350,560 C320,580 290,592 268,588 C256,560 250,510 250,440 C248,360 250,290 254,228 Z" {...overlay("flfender")} />
      {/* Переднее правое крыло */}
      <path d="M770,228 C704,222 676,224 674,232 L674,560 C704,580 734,592 756,588 C768,560 774,510 774,440 C776,360 774,290 770,228 Z" {...overlay("frfender")} />
      {/* Капот */}
      <path d="M352,234 C420,224 604,224 672,234 C682,330 682,442 672,540 C604,548 420,548 352,540 C342,442 342,330 352,234 Z" {...overlay("hood")} />
      {/* Лобовое стекло */}
      <path d="M324,548 C420,560 604,560 700,548 C708,610 708,672 700,716 C604,708 420,708 324,716 C316,672 316,610 324,548 Z" {...overlay("windshield")} />
      {/* Крыша */}
      <path d="M352,724 L672,724 L672,996 L352,996 Z" {...overlay("roof")} />
      {/* Передняя левая дверь */}
      <path d="M260,592 L348,592 L348,808 L260,808 Z" {...overlay("fldoor")} />
      {/* Передняя правая дверь */}
      <path d="M676,592 L764,592 L764,808 L676,808 Z" {...overlay("frdoor")} />
      {/* Задняя левая дверь */}
      <path d="M260,812 L348,812 L348,972 L260,972 Z" {...overlay("rldoor")} />
      {/* Задняя правая дверь */}
      <path d="M676,812 L764,812 L764,972 L676,972 Z" {...overlay("rrdoor")} />
      {/* Боковые окна — тонкие полосы вдоль внутренней грани дверей */}
      <path d="M302,576 C322,568 344,566 358,572 L358,792 C342,798 320,798 302,790 C296,720 296,648 302,576 Z" {...overlay("lfwin")} />
      <path d="M722,576 C702,568 680,566 666,572 L666,792 C682,798 704,798 722,790 C728,720 728,648 722,576 Z" {...overlay("rfwin")} />
      <path d="M302,808 C322,802 344,802 358,808 L358,978 C344,986 322,986 302,980 C296,924 296,866 302,808 Z" {...overlay("lrwin")} />
      <path d="M662,812 L676,812 L676,994 L662,994 Z" {...overlay("rrwin")} />
      {/* Пороги */}
      <path d="M252,594 L260,594 L260,968 L252,968 Z" {...overlay("lthresh")} />
      <path d="M764,594 L772,594 L772,968 L764,968 Z" {...overlay("rthresh")} />
      {/* Заднее стекло */}
      <path d="M328,1000 C420,1010 604,1010 696,1000 C704,1062 704,1112 696,1140 C604,1130 420,1130 328,1140 C320,1112 320,1062 328,1000 Z" {...overlay("rear_window")} />
      {/* Заднее левое крыло */}
      <path d="M250,976 C290,972 320,980 350,994 L350,1258 C320,1268 286,1266 268,1258 C256,1230 250,1180 250,1110 C250,1060 250,1010 250,976 Z" {...overlay("rlfender")} />
      {/* Заднее правое крыло */}
      <path d="M774,976 C734,972 704,980 674,994 L674,1258 C704,1268 738,1266 756,1258 C768,1230 774,1180 774,1110 C774,1060 774,1010 774,976 Z" {...overlay("rrfender")} />
      {/* Крышка багажника */}
      <path d="M352,1146 C420,1138 604,1138 672,1146 C680,1190 680,1220 672,1248 C604,1240 420,1240 352,1248 C344,1220 344,1190 352,1146 Z" {...overlay("trunk")} />
      {/* Задний бампер */}
      <path d="M320,1254 C420,1244 604,1244 704,1254 C712,1276 710,1294 700,1300 C604,1304 420,1304 324,1300 C314,1294 312,1276 320,1254 Z" {...overlay("rbumper")} />




      {/* Маркеры заметок — небольшие кружки по центру каждой зоны со статусом */}
      {Object.entries(CENTERS).map(([id, [cx, cy]]) => {
        const color = markerColor(id);
        if (!color) return null;
        const z = zoneProps(id);
        return (
          <g key={id} style={{ cursor: "pointer" }} onClick={z.onClick}
             onMouseEnter={z.onMouseEnter} onMouseLeave={z.onMouseLeave}>
            <circle cx={cx} cy={cy} r={22} fill="white" opacity={0.92} />
            <circle cx={cx} cy={cy} r={22} fill={color} fillOpacity={0.85}
                    stroke={z.stroke} strokeWidth={2} />
          </g>
        );
      })}

      {/* Индикатор «перёд» */}
      <g opacity="0.45" pointerEvents="none">
        <path d="M512,30 L536,68 L488,68 Z" fill={OUTLINE} />
        <text x="512" y="92" textAnchor="middle" fontSize="26"
          fontFamily="ui-sans-serif, system-ui" fill={INK} letterSpacing="2">FRONT</text>
      </g>
    </svg>
  );
}


/* ============================================================
 * FRONT VIEW — вид спереди
 * Singleframe-решётка трапецией, узкие Matrix LED, чёрный обвес.
 * ============================================================ */
function FrontView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 460 310"
      className="w-full h-auto max-h-[420px] mx-auto block"
      role="img"
      aria-label="Audi A6 Allroad — вид спереди"
    >
      <ellipse cx="230" cy="292" rx="200" ry="5" fill={INK} opacity="0.2" />

      {/* рейлинги */}
      <rect x="150" y="46" width="160" height="5" rx="2" fill={DARK} />
      <rect x="156" y="42" width="6" height="9" rx="1" fill={DARK} />
      <rect x="298" y="42" width="6" height="9" rx="1" fill={DARK} />

      {/* КРЫША — широкая, ровная */}
      <path
        d="M158,52 Q230,38 302,52 L290,96 Q230,84 170,96 Z"
        {...zoneProps("roof")}
      />

      {/* ЛОБОВОЕ */}
      <path
        d="M170,96 Q230,86 290,96 L276,150 Q230,138 184,150 Z"
        {...zoneProps("windshield")}
      />
      {/* A-стойки */}
      <line x1="170" y1="96" x2="158" y2="52" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="290" y1="96" x2="302" y2="52" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />
      {/* зеркала */}
      <path d="M30,150 Q12,154 16,168 Q34,172 56,160 Z" fill={DARK} />
      <path d="M430,150 Q448,154 444,168 Q426,172 404,160 Z" fill={DARK} />
      <ellipse cx="40" cy="162" rx="3" ry="2.5" fill={GLASS} opacity="0.5" />
      <ellipse cx="420" cy="162" rx="3" ry="2.5" fill={GLASS} opacity="0.5" />

      {/* КАПОТ — с фирменными гранями */}
      <path
        d="M90,152 Q132,144 184,150 L276,150 Q328,144 370,152 L354,196 Q230,182 106,196 Z"
        {...zoneProps("hood")}
      />
      {/* грани капота */}
      <path d="M184,152 L194,192 M276,152 L266,192" stroke={DIVIDER} strokeWidth="0.6" strokeDasharray="3 3" fill="none" />
      <path d="M150,158 Q230,150 310,158" stroke={DIVIDER} strokeWidth="0.5" fill="none" opacity="0.6" />

      {/* КРЫЛЬЯ */}
      <path
        d="M36,228 Q40,180 90,152 L106,196 L82,248 Q58,248 36,244 Z"
        {...zoneProps("flfender")}
      />
      <path
        d="M424,228 Q420,180 370,152 L354,196 L378,248 Q402,248 424,244 Z"
        {...zoneProps("frfender")}
      />

      {/* БАМПЕР */}
      <path
        d="M40,230 L420,230 Q426,250 416,272 L44,272 Q34,250 40,230 Z"
        {...zoneProps("fbumper")}
      />

      {/* SINGLEFRAME — фирменная трапеция Audi */}
      <path
        d="M172,196 L288,196 L276,258 L184,258 Z"
        fill={DARK} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round"
      />
      {/* вертикальные ламели */}
      <g stroke="oklch(0.4 0.008 250)" strokeWidth="0.55">
        {Array.from({ length: 11 }).map((_, i) => {
          const t = i / 10;
          const xTop = 174 + t * 112;
          const xBot = 186 + t * 88;
          return <line key={i} x1={xTop} y1="200" x2={xBot} y2="254" />;
        })}
      </g>
      {/* кольца Audi */}
      <g fill="none" stroke={CHROME} strokeWidth="1.3">
        <circle cx="222" cy="226" r="6" />
        <circle cx="232" cy="226" r="6" />
        <circle cx="242" cy="226" r="6" />
        <circle cx="252" cy="226" r="6" />
      </g>

      {/* нижние воздухозаборники */}
      <rect x="60" y="246" width="82" height="14" rx="3" fill={DARK} opacity="0.6" />
      <rect x="318" y="246" width="82" height="14" rx="3" fill={DARK} opacity="0.6" />
      {/* противотуманные/датчики */}
      <circle cx="80" cy="253" r="2.5" fill={LAMP} opacity="0.8" />
      <circle cx="380" cy="253" r="2.5" fill={LAMP} opacity="0.8" />

      {/* MATRIX LED — узкие угловатые фары */}
      <path
        d="M88,196 L152,194 Q160,210 152,222 L96,224 Q78,216 88,196 Z"
        fill={LAMP} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round"
      />
      <path
        d="M372,196 L308,194 Q300,210 308,222 L364,224 Q382,216 372,196 Z"
        fill={LAMP} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round"
      />
      {/* DRL signature */}
      <path d="M94,204 L150,202 M310,202 L366,204" stroke={INK} strokeWidth="0.7" fill="none" opacity="0.7" />
      <path d="M100,212 L146,210 M314,210 L360,212" stroke={INK} strokeWidth="0.5" fill="none" opacity="0.5" />

      {/* номерной знак */}
      <rect x="200" y="262" width="60" height="14" rx="2" fill="white" stroke={OUTLINE} strokeWidth="0.6" />

      {/* ОБВЕС allroad на арках — поверх крыльев и бампера */}
      <path
        d="M40,272 Q34,288 52,288 L102,288 Q114,272 96,262 L82,248 Q58,248 40,272 Z"
        fill={CLAD} opacity="0.9"
      />
      <path
        d="M420,272 Q426,288 408,288 L358,288 Q346,272 364,262 L378,248 Q402,248 420,272 Z"
        fill={CLAD} opacity="0.9"
      />
    </svg>
  );
}

/* ============================================================
 * REAR VIEW — вид сзади
 * Сквозная LED-полоса, четыре кольца, двойной выхлоп, обвес.
 * ============================================================ */
function RearView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 460 310"
      className="w-full h-auto max-h-[420px] mx-auto block"
      role="img"
      aria-label="Audi A6 Allroad — вид сзади"
    >
      <ellipse cx="230" cy="292" rx="200" ry="5" fill={INK} opacity="0.2" />

      {/* рейлинги */}
      <rect x="150" y="46" width="160" height="5" rx="2" fill={DARK} />

      {/* спойлер на крышке */}
      <path d="M154,96 Q230,86 306,96 L302,104 Q230,96 158,104 Z" fill={DARK} opacity="0.55" />

      {/* КРЫША */}
      <path
        d="M158,52 Q230,38 302,52 L290,94 Q230,82 170,94 Z"
        {...zoneProps("roof")}
      />

      {/* ЗАДНЕЕ СТЕКЛО */}
      <path
        d="M170,94 Q230,84 290,94 L278,156 Q230,144 182,156 Z"
        {...zoneProps("rear_window")}
      />
      {/* нити обогрева */}
      <g stroke={DIVIDER} strokeWidth="0.4" opacity="0.65">
        <line x1="182" y1="108" x2="278" y2="108" />
        <line x1="182" y1="120" x2="278" y2="120" />
        <line x1="182" y1="132" x2="278" y2="132" />
        <line x1="182" y1="144" x2="278" y2="144" />
      </g>
      <line x1="170" y1="94" x2="158" y2="52" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="290" y1="94" x2="302" y2="52" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round" />
      {/* стоп-сигнал в спойлере */}
      <rect x="208" y="98" width="44" height="3" rx="1" fill={TAIL} opacity="0.85" />

      {/* зеркала (видны кромкой) */}
      <path d="M28,150 Q14,154 18,168 Q32,170 50,162 Z" fill={DARK} />
      <path d="M432,150 Q446,154 442,168 Q428,170 410,162 Z" fill={DARK} />

      {/* КРЫШКА БАГАЖНИКА */}
      <path
        d="M90,158 Q132,152 182,156 L278,156 Q328,152 370,158 L356,218 Q230,204 104,218 Z"
        {...zoneProps("trunk")}
      />
      {/* кольца Audi */}
      <g fill="none" stroke={CHROME} strokeWidth="1.2">
        <circle cx="216" cy="182" r="6" />
        <circle cx="226" cy="182" r="6" />
        <circle cx="236" cy="182" r="6" />
        <circle cx="246" cy="182" r="6" />
      </g>
      {/* шильдик allroad */}
      <rect x="200" y="196" width="60" height="6" rx="1" fill={DARK} opacity="0.5" />
      {/* ручка / камера */}
      <circle cx="230" cy="172" r="1.8" fill={DARK} />

      {/* СВЕТОВАЯ ПОЛОСА через всю корму */}
      <rect x="66" y="172" width="328" height="4" rx="2" fill={TAIL} opacity="0.55" />

      {/* ЗАДНИЕ ФОНАРИ */}
      <path
        d="M66,158 L158,158 Q166,176 160,206 L78,206 Q60,186 66,158 Z"
        fill={TAIL} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round"
      />
      <path
        d="M394,158 L302,158 Q294,176 300,206 L382,206 Q400,186 394,158 Z"
        fill={TAIL} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round"
      />
      {/* световые ячейки OLED */}
      <g stroke="oklch(0.94 0.04 30)" strokeWidth="0.5" opacity="0.85" fill="none">
        <path d="M76,170 L150,170" />
        <path d="M80,184 L150,184" />
        <path d="M84,196 L150,196" />
        <path d="M310,170 L384,170" />
        <path d="M310,184 L380,184" />
        <path d="M310,196 L376,196" />
      </g>

      {/* ЗАДНИЕ КРЫЛЬЯ */}
      <path
        d="M36,228 Q40,186 66,158 L78,206 L82,248 Q58,248 36,244 Z"
        {...zoneProps("rlfender")}
      />
      <path
        d="M424,228 Q420,186 394,158 L382,206 L378,248 Q402,248 424,244 Z"
        {...zoneProps("rrfender")}
      />

      {/* ЗАДНИЙ БАМПЕР с диффузором */}
      <path
        d="M40,230 L420,230 Q426,252 414,272 L46,272 Q34,252 40,230 Z"
        {...zoneProps("rbumper")}
      />
      {/* диффузор */}
      <path d="M158,258 L302,258 L294,272 L166,272 Z" fill={DARK} opacity="0.5" />

      {/* номерной знак */}
      <rect x="200" y="234" width="60" height="20" rx="2" fill="white" stroke={OUTLINE} strokeWidth="0.6" />

      {/* двойной выхлоп */}
      <rect x="92" y="262" width="42" height="10" rx="2.5" fill={DARK} stroke={CHROME} strokeWidth="0.6" />
      <rect x="326" y="262" width="42" height="10" rx="2.5" fill={DARK} stroke={CHROME} strokeWidth="0.6" />

      {/* allroad обвес арок */}
      <path
        d="M40,272 Q34,288 52,288 L102,288 Q114,272 96,262 L82,248 Q58,248 40,272 Z"
        fill={CLAD} opacity="0.9"
      />
      <path
        d="M420,272 Q426,288 408,288 L358,288 Q346,272 364,262 L378,248 Q402,248 420,272 Z"
        fill={CLAD} opacity="0.9"
      />
    </svg>
  );
}

/* ============================================================
 * SIDE VIEW — вид сбоку (Audi A6 Allroad, профиль универсала)
 * Длинный капот, протяжённая крыша, кинк D-стойки, чёрный обвес.
 * ============================================================ */
function SideView({
  zoneProps,
  side,
}: {
  zoneProps: ZoneProps;
  side: "left" | "right";
}) {
  const isLeft = side === "left";
  const fender = (pos: "front" | "rear") =>
    pos === "front"
      ? isLeft ? "flfender" : "frfender"
      : isLeft ? "rlfender" : "rrfender";
  const door = (pos: "front" | "rear") =>
    pos === "front"
      ? isLeft ? "fldoor" : "frdoor"
      : isLeft ? "rldoor" : "rrdoor";
  const thresh = isLeft ? "lthresh" : "rthresh";

  return (
    <svg
      viewBox="0 0 720 280"
      className="w-full h-auto max-h-[360px] mx-auto block"
      role="img"
      aria-label={`Audi A6 Allroad — вид ${isLeft ? "слева" : "справа"}`}
    >
      <g transform={isLeft ? "" : "translate(720,0) scale(-1,1)"}>
        <ellipse cx="360" cy="252" rx="320" ry="5" fill={INK} opacity="0.2" />

        {/* рейлинги (поднятые над крышей) */}
        <path
          d="M218,52 Q280,38 380,38 Q458,40 502,54 L498,60 Q458,48 380,46 Q282,46 224,60 Z"
          fill={DARK}
        />
        {/* стойки рейлингов */}
        <rect x="246" y="46" width="4" height="10" rx="1" fill={DARK} />
        <rect x="486" y="46" width="4" height="10" rx="1" fill={DARK} />

        {/* КРЫША — длинная, чуть скруглённая */}
        <path
          d="M226,62 Q282,46 380,46 Q458,48 504,68 L494,100 L230,100 Z"
          {...zoneProps("roof")}
        />

        {/* ЛОБОВОЕ — сильный наклон */}
        <path
          d="M230,100 L300,100 L292,66 Q256,66 234,76 Z"
          {...zoneProps("windshield")}
        />
        {/* ЗАДНЕЕ СТЕКЛО — короткое, с кинком D-стойки */}
        <path
          d="M438,100 L494,100 L504,68 Q472,54 442,52 L438,72 Z"
          {...zoneProps("rear_window")}
        />
        <g stroke={DIVIDER} strokeWidth="0.35" opacity="0.6">
          <line x1="446" y1="70" x2="494" y2="80" />
          <line x1="444" y1="80" x2="498" y2="88" />
          <line x1="442" y1="90" x2="500" y2="96" />
        </g>

        {/* боковые стёкла + B/C стойки */}
        <path
          d="M302,100 L436,100 L436,72 Q368,62 302,72 Z"
          fill={GLASS} stroke={OUTLINE} strokeWidth="0.6" opacity="0.75"
        />
        {/* хром по периметру (DLO) */}
        <path d="M302,72 Q368,62 436,72" fill="none" stroke={CHROME} strokeWidth="1.4" />
        <path d="M302,100 L436,100" fill="none" stroke={CHROME} strokeWidth="1.4" />
        {/* B-стойка */}
        <rect x="348" y="62" width="3.5" height="38" fill={INK} />
        {/* C-стойка */}
        <rect x="402" y="62" width="3.5" height="38" fill={INK} />
        {/* D-стойка наклонная */}
        <path d="M436,72 L438,100" stroke={INK} strokeWidth="2.6" />

        {/* поясная (tornado) линия */}
        <line x1="130" y1="158" x2="600" y2="156" stroke={DIVIDER} strokeWidth="0.6" strokeDasharray="3 3" />

        {/* длинный КАПОТ */}
        <path
          d="M124,118 L230,100 L230,164 L132,164 Z"
          {...zoneProps("hood")}
        />
        {/* линия капота */}
        <path d="M130,118 Q180,114 226,108" fill="none" stroke={DIVIDER} strokeWidth="0.5" />

        {/* ПЕРЕДНЕЕ КРЫЛО + арка */}
        <path
          d="M62,176 Q52,138 100,118 L124,118 L132,164 L132,218 L42,218 Q42,194 62,176 Z
             M60,218 A40,40 0 0,1 144,218 Z"
          fillRule="evenodd"
          {...zoneProps(fender("front"))}
        />

        {/* ПЕРЕДНИЙ БАМПЕР */}
        <path
          d="M28,188 L62,176 L62,224 L34,224 Q20,206 28,188 Z"
          {...zoneProps("fbumper")}
        />
        {/* нижний воздухозаборник */}
        <rect x="38" y="210" width="32" height="8" rx="2" fill={DARK} opacity="0.55" />

        {/* MATRIX LED фара */}
        <path
          d="M52,150 Q78,146 116,154 Q124,164 114,180 Q80,182 58,180 Q40,164 52,150 Z"
          fill={LAMP} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round"
        />
        <line x1="58" y1="160" x2="114" y2="160" stroke={INK} strokeWidth="0.6" opacity="0.6" />
        <line x1="62" y1="170" x2="112" y2="170" stroke={INK} strokeWidth="0.4" opacity="0.45" />

        {/* ДВЕРИ */}
        <path
          d="M230,102 L348,102 L348,224 L240,224 Q230,212 230,190 Z"
          {...zoneProps(door("front"))}
        />
        <path
          d="M348,102 L436,102 L438,224 L348,224 Z"
          {...zoneProps(door("rear"))}
        />
        {/* ручки */}
        <rect x="264" y="148" width="30" height="5" rx="2.5" fill={INK} />
        <rect x="372" y="148" width="30" height="5" rx="2.5" fill={INK} />

        {/* ПОРОГ */}
        <path
          d="M240,224 L438,224 L436,240 L242,240 Z"
          {...zoneProps(thresh)}
        />
        <rect x="248" y="226" width="184" height="6" fill={CLAD} opacity="0.6" />

        {/* ЗАДНЕЕ КРЫЛО + арка */}
        <path
          d="M438,102 L506,118 Q620,140 656,184 L656,224 L438,224 Z
             M548,218 A40,40 0 0,1 632,218 Z"
          fillRule="evenodd"
          {...zoneProps(fender("rear"))}
        />

        {/* КРЫШКА БАГАЖНИКА (профиль) */}
        <path
          d="M438,102 L506,118 L506,164 L438,164 Z"
          {...zoneProps("trunk")}
        />
        {/* лючок бензобака */}
        <circle cx="488" cy="146" r="6" fill="none" stroke={DIVIDER} strokeWidth="0.6" />

        {/* ЗАДНИЙ БАМПЕР */}
        <path
          d="M626,188 L676,172 Q686,206 676,224 L626,224 Z"
          {...zoneProps("rbumper")}
        />

        {/* ЗАДНИЙ ФОНАРЬ */}
        <path
          d="M636,150 Q620,146 592,154 L592,180 Q622,182 638,180 Q650,164 636,150 Z"
          fill={TAIL} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round"
        />
        <line x1="596" y1="162" x2="636" y2="162" stroke="oklch(0.96 0.04 30)" strokeWidth="0.6" opacity="0.7" />
        <line x1="596" y1="172" x2="634" y2="172" stroke="oklch(0.96 0.04 30)" strokeWidth="0.5" opacity="0.5" />

        {/* выхлоп */}
        <rect x="640" y="218" width="24" height="6" rx="2" fill={DARK} stroke={CHROME} strokeWidth="0.5" />

        {/* allroad обвес арок и порога */}
        <path d="M60,222 A48,48 0 0,1 146,222 L148,232 Q104,246 58,232 Z"
          fill={CLAD} opacity="0.85" />
        <path d="M546,222 A48,48 0 0,1 632,222 L634,232 Q590,246 544,232 Z"
          fill={CLAD} opacity="0.85" />

        {/* КОЛЁСА — пятилучевые диски Audi */}
        {[104, 590].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={220} r="42" fill={DARK} />
            <circle cx={cx} cy={220} r="34" fill="oklch(0.16 0.005 250)" />
            <circle cx={cx} cy={220} r="26" fill={CHROME} opacity="0.65" />
            <circle cx={cx} cy={220} r="7" fill={DARK} stroke={CHROME} strokeWidth="0.6" />
            {[0, 72, 144, 216, 288].map((a) => {
              const rad = ((a - 90) * Math.PI) / 180;
              const x1 = cx + 8 * Math.cos(rad);
              const y1 = 220 + 8 * Math.sin(rad);
              const x2 = cx + 25 * Math.cos(rad);
              const y2 = 220 + 25 * Math.sin(rad);
              return (
                <line key={a} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={DARK} strokeWidth="5" strokeLinecap="round" />
              );
            })}
            {/* тормозной диск виден между лучами */}
            <circle cx={cx} cy={220} r="20" fill="none" stroke="oklch(0.5 0.008 250)" strokeWidth="0.6" opacity="0.6" />
          </g>
        ))}

        {/* зеркало */}
        <path d="M232,100 L256,82 Q268,82 268,96 L256,112 L234,112 Z" fill={DARK} />
        <path d="M236,96 L262,90" stroke={GLASS} strokeWidth="1.4" opacity="0.6" />

        {/* шильдик allroad на заднем крыле */}
        <g opacity="0.7">
          <text x="500" y="190" fontSize="7" fontFamily="ui-sans-serif, system-ui"
            fontWeight={500} fill={INK} letterSpacing="0.5">
            allroad
          </text>
        </g>
      </g>
    </svg>
  );
}
