import type { FileRef, InspectionElement } from "@/lib/report.api";

export type Status = "ok" | "minor" | "serious";

export type EnrichedElement = InspectionElement & {
  _status: Status;
  _category: string;
  _displayName: string;
  _sectionKey: string;
};

/** Single source of truth for element severity. */
export function getElementStatus(el: InspectionElement): Status {
  if (el.seriousDamageTags.length > 0) return "serious";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}

export type StatusMeta = {
  icon: string;
  label: string;
  bg: string;
  fg: string;
};

export function statusMeta(s: Status): StatusMeta {
  if (s === "ok")
    return { icon: "✓", label: "Норма", bg: "var(--grade-good)", fg: "white" };
  if (s === "minor")
    return {
      icon: "!",
      label: "Незначительные повреждения",
      bg: "var(--grade-warn)",
      fg: "oklch(0.25 0.05 70)",
    };
  return {
    icon: "✕",
    label: "Серьёзные повреждения",
    bg: "var(--grade-bad)",
    fg: "white",
  };
}

export function statusFill(s: Status) {
  if (s === "serious") return "color-mix(in oklab, var(--grade-bad) 38%, white)";
  if (s === "minor") return "color-mix(in oklab, var(--grade-warn) 42%, white)";
  return "color-mix(in oklab, var(--grade-good) 18%, white)";
}

export function statusStroke(s: Status) {
  if (s === "serious") return "var(--grade-bad)";
  if (s === "minor") return "var(--grade-warn)";
  return "color-mix(in oklab, var(--grade-good) 70%, oklch(0.45 0.01 250))";
}

export function fmtMileage(km: number | null | undefined) {
  if (km == null) return "—";
  return km.toLocaleString("ru-RU") + " км";
}

export function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return d;
  }
}

export function isImageFile(file: FileRef | null | undefined) {
  if (!file?.url) return false;
  const t = (file.type || "").toLowerCase();
  const ext = file.url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return t.includes("image") || ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext);
}

export function isVideoFile(file: FileRef | null | undefined) {
  if (!file?.url) return false;
  const t = (file.type || "").toLowerCase();
  const url = file.url;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return (
    t.includes("video") ||
    ext === "m3u8" ||
    url.includes(".m3u8") ||
    ["mp4", "webm", "mov"].includes(ext)
  );
}

export function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function sectionSummary(elements: EnrichedElement[]) {
  if (elements.length === 0) return { status: null as Status | null, summary: "—" };
  let serious = 0, minor = 0;
  for (const e of elements) {
    if (e._status === "serious") serious++;
    else if (e._status === "minor") minor++;
  }
  const status: Status = serious > 0 ? "serious" : minor > 0 ? "minor" : "ok";
  const damaged = elements.filter((e) => e._status !== "ok");
  let summary: string;
  if (status === "ok") {
    summary = "Замечаний не выявлено. Все элементы в норме.";
  } else {
    const top = damaged[0];
    const tag =
      top?.seriousDamageTags[0]?.name ?? top?.noSeriousDamageTags[0]?.name;
    const count = damaged.length;
    summary =
      `Замечания по ${count} ${pluralize(count, "элементу", "элементам", "элементам")}` +
      (tag ? `: ${tag.toLowerCase()}.` : ".");
  }
  return { status, summary };
}
