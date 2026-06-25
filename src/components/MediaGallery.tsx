import { useEffect, useMemo, useRef, useState } from "react";
import { Car, Armchair, Wrench, Disc3, AppWindow, Lightbulb, Shield, Hash, FileText, Images, ChevronLeft } from "lucide-react";
import { GalleryTileBody } from "@/components/GalleryTile";
import type { LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  match: (i: GalleryItem) => boolean;
}> = [
  { key: "body", label: "Кузов", icon: Car, match: (i) => i.sectionKey === "bodyElements" },
  { key: "interior", label: "Салон", icon: Armchair, match: (i) => i.sectionKey === "interiorElements" },
  {
    key: "engine",
    label: "Двигатель",
    icon: Wrench,
    match: (i) =>
      i.sectionKey === "underHoodElements" ||
      i.sectionKey === "computerDiagnosticsElements",
  },
  { key: "wheels", label: "Колёса и тормоза", icon: Disc3, match: (i) => i.sectionKey === "wheelsAndBrakesElements" },
  { key: "glass", label: "Стёкла", icon: AppWindow, match: (i) => i.sectionKey === "glassElements" },
  { key: "lighting", label: "Освещение", icon: Lightbulb, match: (i) => i.sectionKey === "lightningElements" },
  { key: "frame", label: "Силовые элементы", icon: Shield, match: (i) => i.sectionKey === "bodyReinforcementElements" },
  { key: "vin", label: "VIN и маркировки", icon: Hash, match: (i) => i.sectionKey === "characteristics" || i.sectionKey === "car" },
  { key: "documents", label: "Документы", icon: FileText, match: (i) => i.sectionKey === "documents" || i.sectionKey === "legal" },
];

export function MediaGallery({
  items,
  onOpen,
}: {
  items: GalleryItem[];
  onOpen: (idx: number) => void;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const groups = useMemo(() => {
    const used = new Set<number>();
    const result: Array<{
      key: string;
      label: string;
      icon: LucideIcon;
      count: number;
      items: GalleryItem[];
      cover: string | null;
    }> = [];
    for (const g of SECTION_GROUPS) {
      const groupItems = items.filter((i) => !used.has(i.idx) && g.match(i));
      groupItems.forEach((i) => used.add(i.idx));
      if (groupItems.length === 0) continue;
      const coverItem = groupItems.find((i) => !i.isVideo) ?? groupItems[0];
      result.push({
        key: g.key,
        label: g.label,
        icon: g.icon,
        count: groupItems.length,
        items: groupItems,
        cover: coverItem.file.url ?? null,
      });
    }
    const other = items.filter((i) => !used.has(i.idx));
    if (other.length > 0) {
      const coverItem = other.find((i) => !i.isVideo) ?? other[0];
      result.push({
        key: "other",
        label: "Прочее",
        icon: Images,
        count: other.length,
        items: other,
        cover: coverItem.file.url ?? null,
      });
    }
    return result;
  }, [items]);

  if (items.length === 0) return null;

  const active = activeKey ? groups.find((g) => g.key === activeKey) ?? null : null;

  return (
    <section className="panel p-4 sm:p-5 md:p-6 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {active ? (
            <button
              type="button"
              onClick={() => setActiveKey(null)}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ChevronLeft size={14} />
              <span>Фото и видео с осмотра</span>
            </button>
          ) : (
            <span>Фото и видео с осмотра</span>
          )}
          <span className="mono text-[11px] normal-case tracking-normal text-muted-foreground/70">
            ({active ? `${active.label} · ${active.count}` : items.length})
          </span>
        </h3>
      </div>

      {active ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {active.items.map((item) => (
            <button
              key={item.idx}
              type="button"
              onClick={() => onOpen(item.idx)}
              className="group rounded-lg border border-border bg-card overflow-hidden text-left hover:border-accent hover:shadow-sm transition-all"
            >
              <GalleryTileBody item={item} />
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {groups.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveKey(g.key)}
                className="group relative aspect-[4/3] rounded-lg border border-border bg-card overflow-hidden text-left hover:border-accent hover:shadow-sm transition-all"
                title={`${g.label} · ${g.count}`}
              >
                {g.cover ? (
                  <img
                    src={g.cover}
                    alt={g.label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, oklch(0.15 0.02 250 / 0.05) 0%, oklch(0.15 0.02 250 / 0.7) 100%)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-between gap-2 text-white">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Icon size={14} strokeWidth={2} className="shrink-0" />
                    <span className="text-xs font-semibold truncate">{g.label}</span>
                  </span>
                  <span className="mono text-[10px] px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm tabular-nums">
                    {g.count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
