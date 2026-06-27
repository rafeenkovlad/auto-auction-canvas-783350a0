import { GalleryTileBody } from "@/components/GalleryTile";
import type { GalleryItem } from "@/components/MediaGallery";

interface AdditionalMaterialsProps {
  items: GalleryItem[];
  onOpen: (idx: number) => void;
}

export function AdditionalMaterials({ items, onOpen }: AdditionalMaterialsProps) {
  if (items.length === 0) return null;
  return (
    <section className="panel p-5 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Дополнительные материалы
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((item) => (
          <button
            key={`${item.file.id}-${item.idx}`}
            type="button"
            onClick={() => onOpen(item.idx)}
            className="text-left rounded-lg border border-border bg-card hover:border-accent hover:shadow-sm transition-all overflow-hidden flex flex-col"
          >
            <GalleryTileBody item={item} />
          </button>
        ))}
      </div>
    </section>
  );
}
