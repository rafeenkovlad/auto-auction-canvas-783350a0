import type { InspectionElement } from "@/lib/report.functions";

/* ===== Element → label / zone / side mapping ===== */
const ELEMENT_META: Record<
  string,
  { label: string; zone?: string; side: "left" | "right" | "center" }
> = {
  // Center / general
  general_condition: { label: "Общее состояние", side: "center" },
  // Hood / roof / trunk / bumpers — center column rows above & below diagram
  hood: { label: "Капот", zone: "hood", side: "center" },
  roof: { label: "Крыша", zone: "roof", side: "center" },
  trunk: { label: "Крышка багажника", zone: "trunk", side: "center" },
  front_bumper: { label: "Передний бампер", zone: "fbumper", side: "center" },
  rear_bumper: { label: "Задний бампер", zone: "rbumper", side: "center" },
  // Left side
  front_left_fender: { label: "Переднее левое крыло", zone: "flfender", side: "left" },
  front_left_door: { label: "Передняя левая дверь", zone: "fldoor", side: "left" },
  rear_left_door: { label: "Задняя левая дверь", zone: "rldoor", side: "left" },
  rear_left_fender: { label: "Заднее левое крыло", zone: "rlfender", side: "left" },
  left_threshold: { label: "Левый порог", zone: "lthresh", side: "left" },
  // Right side
  front_right_fender: { label: "Переднее правое крыло", zone: "frfender", side: "right" },
  front_right_door: { label: "Передняя правая дверь", zone: "frdoor", side: "right" },
  rear_right_door: { label: "Задняя правая дверь", zone: "rrdoor", side: "right" },
  rear_right_fender: { label: "Заднее правое крыло", zone: "rrfender", side: "right" },
  right_threshold: { label: "Правый порог", side: "right", zone: "rthresh" },
};

type Status = "ok" | "minor" | "serious" | "skipped";

function statusOf(el: InspectionElement): Status {
  if (el.seriousDamageTags.length > 0) return "serious";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}

function scoreOf(el: InspectionElement): number {
  const s = statusOf(el);
  if (s === "serious") return 1.5;
  if (s === "minor") return 2.5 + (el.noSeriousDamageTags.length === 1 ? 0.5 : 0);
  return 4.5;
}

function chipClass(s: Status): string {
  return s === "ok"
    ? "grade-chip grade-good"
    : s === "minor"
      ? "grade-chip grade-warn"
      : s === "serious"
        ? "grade-chip grade-bad"
        : "grade-chip grade-skip";
}

function fmtScore(n: number) {
  return n.toFixed(1);
}

/* ===== Row ===== */
function RowItem({
  el,
  align,
}: {
  el: InspectionElement;
  align: "left" | "right";
}) {
  const meta = ELEMENT_META[el.elementType];
  const label = meta?.label ?? el.elementType.replace(/_/g, " ");
  const st = statusOf(el);
  const score = scoreOf(el);

  const dots = (
    <>
      <span className="dot-btn" aria-hidden>+</span>
      <span className="dot-btn" aria-hidden>−</span>
    </>
  );
  const chip = <span className={chipClass(st)}>{fmtScore(score)}</span>;

  if (align === "left") {
    return (
      <div className="insp-row">
        {dots}
        <span className="truncate flex-1">{label}</span>
        {chip}
      </div>
    );
  }
  return (
    <div className="insp-row justify-end text-right">
      {chip}
      <span className="truncate flex-1">{label}</span>
      {dots}
    </div>
  );
}

/* ===== Aggregate zone status for the SVG ===== */
function buildZoneMap(elements: InspectionElement[]) {
  const m = new Map<string, Status>();
  const rank = (s: Status) => (s === "serious" ? 3 : s === "minor" ? 2 : s === "ok" ? 1 : 0);
  for (const el of elements) {
    const z = ELEMENT_META[el.elementType]?.zone;
    if (!z) continue;
    const st = statusOf(el);
    const cur = m.get(z);
    if (!cur || rank(st) > rank(cur)) m.set(z, st);
  }
  return m;
}

function zoneFill(m: Map<string, Status>, id: string): string {
  const st = m.get(id);
  if (st === "serious") return "color-mix(in oklab, var(--grade-bad) 60%, white)";
  if (st === "minor") return "color-mix(in oklab, var(--grade-warn) 70%, white)";
  if (st === "ok") return "color-mix(in oklab, var(--grade-good) 25%, white)";
  return "white";
}
function zoneStroke(m: Map<string, Status>, id: string): string {
  const st = m.get(id);
  if (st === "serious") return "var(--grade-bad)";
  if (st === "minor") return "var(--grade-warn)";
  if (st === "ok") return "var(--grade-good)";
  return "oklch(0.85 0.005 250)";
}

/* ===== Main ===== */
export function BodyMap({
  elements,
  title = "Exterior Grading",
  overallScore,
}: {
  elements: InspectionElement[];
  title?: string;
  overallScore?: number;
}) {
  const zoneMap = buildZoneMap(elements);

  // Split rows by side, fallback distribute "center"/unknown rows across sides
  const lefts: InspectionElement[] = [];
  const rights: InspectionElement[] = [];
  const centersTop: InspectionElement[] = [];
  const centersBottom: InspectionElement[] = [];

  elements.forEach((el, idx) => {
    const meta = ELEMENT_META[el.elementType];
    const side = meta?.side ?? (idx % 2 === 0 ? "left" : "right");
    if (side === "left") lefts.push(el);
    else if (side === "right") rights.push(el);
    else {
      // route certain center elements above the car (hood/front_bumper), others below
      const t = el.elementType;
      if (t === "hood" || t === "front_bumper") centersTop.push(el);
      else if (t === "trunk" || t === "rear_bumper" || t === "roof") centersBottom.push(el);
      else (idx % 2 === 0 ? lefts : rights).push(el);
    }
  });

  // Balance left/right by length
  while (lefts.length > rights.length + 1) rights.push(lefts.pop()!);
  while (rights.length > lefts.length + 1) lefts.push(rights.pop()!);

  return (
    <div className="panel p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {title}
        </h3>
        {overallScore != null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Overall
            </span>
            <span
              className={`grade-chip ${
                overallScore >= 4
                  ? "grade-good"
                  : overallScore >= 2.5
                    ? "grade-warn"
                    : "grade-bad"
              }`}
            >
              {fmtScore(overallScore)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_minmax(220px,300px)_1fr] gap-3 md:gap-5 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-1.5">
          {lefts.map((el) => (
            <RowItem key={el.id} el={el} align="left" />
          ))}
        </div>

        {/* Center: top labels + car + bottom labels */}
        <div className="flex flex-col gap-2">
          {centersTop.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {centersTop.map((el) => (
                <RowItem key={el.id} el={el} align="left" />
              ))}
            </div>
          )}
          <CarSvg zoneMap={zoneMap} />
          {centersBottom.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {centersBottom.map((el) => (
                <RowItem key={el.id} el={el} align="left" />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-1.5">
          {rights.map((el) => (
            <RowItem key={el.id} el={el} align="right" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== Top-down car SVG ===== */
function CarSvg({ zoneMap }: { zoneMap: Map<string, Status> }) {
  const f = (id: string) => zoneFill(zoneMap, id);
  const s = (id: string) => zoneStroke(zoneMap, id);
  return (
    <svg viewBox="0 0 260 520" className="w-full h-auto max-h-[460px]">
      {/* Outer outline */}
      <rect
        x="30" y="10" width="200" height="500" rx="70" ry="90"
        fill="white"
        stroke="oklch(0.7 0.01 250)"
        strokeWidth="1.5"
      />

      {/* Front bumper */}
      <path
        d="M50,30 Q130,5 210,30 L205,55 Q130,42 55,55 Z"
        fill={f("fbumper")} stroke={s("fbumper")} strokeWidth="1.5"
      />
      {/* Hood */}
      <rect x="60" y="60" width="140" height="75" rx="6"
        fill={f("hood")} stroke={s("hood")} strokeWidth="1.5" />
      {/* Front fenders */}
      <path d="M30,65 L60,65 L60,140 L34,140 Z"
        fill={f("flfender")} stroke={s("flfender")} strokeWidth="1.5" />
      <path d="M230,65 L200,65 L200,140 L226,140 Z"
        fill={f("frfender")} stroke={s("frfender")} strokeWidth="1.5" />
      {/* Windshield */}
      <path d="M65,140 L195,140 L182,180 L78,180 Z"
        fill="oklch(0.95 0.005 250)" stroke="oklch(0.75 0.01 250)" strokeWidth="1" />
      {/* Front doors */}
      <rect x="38" y="185" width="44" height="80"
        fill={f("fldoor")} stroke={s("fldoor")} strokeWidth="1.5" />
      <rect x="178" y="185" width="44" height="80"
        fill={f("frdoor")} stroke={s("frdoor")} strokeWidth="1.5" />
      {/* Rear doors */}
      <rect x="38" y="268" width="44" height="80"
        fill={f("rldoor")} stroke={s("rldoor")} strokeWidth="1.5" />
      <rect x="178" y="268" width="44" height="80"
        fill={f("rrdoor")} stroke={s("rrdoor")} strokeWidth="1.5" />
      {/* Thresholds */}
      <rect x="32" y="185" width="6" height="163"
        fill={f("lthresh")} stroke={s("lthresh")} strokeWidth="1" />
      <rect x="222" y="185" width="6" height="163"
        fill={f("rthresh")} stroke={s("rthresh")} strokeWidth="1" />
      {/* Roof / cabin */}
      <rect x="85" y="185" width="90" height="163" rx="4"
        fill={f("roof")} stroke={s("roof")} strokeWidth="1.5" />
      {/* Steering wheel hint */}
      <circle cx="70" cy="215" r="6" fill="none" stroke="oklch(0.75 0.01 250)" strokeWidth="1" />
      {/* Rear fenders */}
      <path d="M30,353 L60,353 L60,425 L34,425 Z"
        fill={f("rlfender")} stroke={s("rlfender")} strokeWidth="1.5" />
      <path d="M230,353 L200,353 L200,425 L226,425 Z"
        fill={f("rrfender")} stroke={s("rrfender")} strokeWidth="1.5" />
      {/* Rear window */}
      <path d="M78,353 L182,353 L195,392 L65,392 Z"
        fill="oklch(0.95 0.005 250)" stroke="oklch(0.75 0.01 250)" strokeWidth="1" />
      {/* Trunk */}
      <rect x="60" y="397" width="140" height="75" rx="6"
        fill={f("trunk")} stroke={s("trunk")} strokeWidth="1.5" />
      {/* Rear bumper */}
      <path d="M50,495 Q130,520 210,495 L205,470 Q130,483 55,470 Z"
        fill={f("rbumper")} stroke={s("rbumper")} strokeWidth="1.5" />

      {/* Front direction marker */}
      <polygon points="130,18 136,28 124,28" fill="oklch(0.6 0.01 250)" opacity="0.5" />
    </svg>
  );
}
