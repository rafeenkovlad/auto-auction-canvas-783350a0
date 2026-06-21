import { useMemo } from "react";
import type { FileRef } from "@/lib/report.api";

export type GalleryItem = {
  file: FileRef;
  idx: number;
  caption: string;
  sectionKey: string;
  isVideo: boolean;
  isDamage: boolean;
  tag?: { name: string; severe: boolean } | null;
  timestamp?: string | null;
};

const SECTION_GROUPS: Array<{
  key: string;
  label: string;
  match: (i: GalleryItem) => boolean;
}> = [
  { key: "body", label: "Кузов", match: (i) => i.sectionKey === "bodyElements" },
  { key: "interior", label: "Салон", match: (i) => i.sectionKey === "interiorElements" },
  {
    key: "engine",
    label: "Двигатель",
    match: (i) =>
      i.sectionKey === "underHoodElements" ||
      i.sectionKey === "computerDiagnosticsElements",
  },
  { key: "wheels", label: "Колёса и тормоза", match: (i) => i.sectionKey === "wheelsAndBrakesElements" },
  { key: "glass", label: "Стёкла", match: (i) => i.sectionKey === "glassElements" },
  { key: "lighting", label: "Освещение", match: (i) => i.sectionKey === "lightningElements" },
  { key: "frame", label: "Силовые элементы", match: (i) => i.sectionKey === "bodyReinforcementElements" },
  { key: "vin", label: "VIN и маркировки", match: (i) => i.sectionKey === "characteristics" || i.sectionKey === "car" },
  { key: "documents", label: "Документы", match: (i) => i.sectionKey === "documents" || i.sectionKey === "legal" },
];

export function MediaGallery({
  items,
  onOpen,
  renderTile,
}: {
  items: GalleryItem[];
  onOpen: (idx: number) => void;
  renderTile: (item: GalleryItem) => React.ReactNode;
}) {
  const groups = useMemo(() => {
    const used = new Set<number>();
    const result: Array<{ key: string; label: string; items: GalleryItem[] }> = [];
    for (const g of SECTION_GROUPS) {
      const groupItems = items.filter((i) => {
        if (used.has(i.idx)) return false;
        return g.match(i);
      });
      groupItems.forEach((i) => used.add(i.idx));
      if (groupItems.length > 0) result.push({ key: g.key, label: g.label, items: groupItems });
    }
    const other = items.filter((i) => !used.has(i.idx));
    if (other.length > 0) result.push({ key: "other", label: "Прочее", items: other });
    return result;
  }, [items]);

  if (items.length === 0) return null;

  const gridClass =
    "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4";

  return (
    <section className="panel p-4 sm:p-5 md:p-6 flex flex-col gap-5 sm:gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Фото и видео с осмотра
          <span className="ml-2 mono text-[11px] normal-case tracking-normal text-muted-foreground/70">
            ({items.length})
          </span>
        </h3>
      </div>

      {groups.map((g) => (
        <div key={g.key} className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
            <h4 className="text-[13px] sm:text-sm font-semibold ink">{g.label}</h4>
            <span className="mono text-[11px] text-muted-foreground/70 tabular-nums">
              {g.items.length}
            </span>
          </div>
          <div className={gridClass}>
            {g.items.map((item) => (
              <button
                key={`${item.file.id}-${item.idx}`}
                type="button"
                onClick={() => onOpen(item.idx)}
                className="text-left rounded-lg border border-border bg-card hover:border-accent hover:shadow-sm transition-all overflow-hidden flex flex-col"
              >
                {renderTile(item)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
