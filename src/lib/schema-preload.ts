// Preload all schema background images so switching tabs / opening
// the schema viewer feels instant. Imported eagerly from the report route.
import carTop from "@/assets/car-top.webp";
import carSide from "@/assets/car-side.webp";
import carFront from "@/assets/car-front.webp";
import carRear from "@/assets/car-rear.webp";
import frame from "@/assets/frame-schema.webp";
import interiorFront from "@/assets/interior-front.webp";
import interiorRear from "@/assets/interior-rear.webp";

const SCHEMA_IMAGES = [
  carTop,
  carSide,
  carFront,
  carRear,
  frame,
  interiorFront,
  interiorRear,
];

let started = false;

export function preloadSchemaImages() {
  if (started || typeof window === "undefined") return;
  started = true;
  // Use Image() decoding in the background — non-blocking, fills HTTP cache.
  for (const src of SCHEMA_IMAGES) {
    const img = new Image();
    img.decoding = "async";
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "low";
    img.src = src;
  }
}
