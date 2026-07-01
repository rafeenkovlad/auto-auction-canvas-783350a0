import { useEffect, useState } from "react";
import type { CarReport } from "@/lib/report.api";

/**
 * Preview mode data source.
 *
 * When the report page is opened with `?token=preview`, the report payload
 * is NOT fetched from the API. Instead we read it from the device using one
 * of these transports (in order of priority):
 *
 * 1. `postMessage` from the opener window / parent frame (PWA integration)
 *    Message shape: { type: "vin-diezel:preview", report: CarReport }
 * 2. `sessionStorage[PREVIEW_STORAGE_KEY]` — JSON of CarReport
 * 3. `localStorage[PREVIEW_STORAGE_KEY]`   — JSON of CarReport
 *
 * The page also broadcasts `{ type: "vin-diezel:preview-ready" }` to opener
 * and parent, so a PWA can wait for the tab to load and then push data in.
 */
export const PREVIEW_STORAGE_KEY = "vin-diezel:preview-report";
export const PREVIEW_MESSAGE_TYPE = "vin-diezel:preview";
export const PREVIEW_READY_TYPE = "vin-diezel:preview-ready";

function readFromStorage(storage: Storage | undefined): CarReport | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CarReport;
  } catch {
    return null;
  }
}

export function usePreviewReport(enabled: boolean) {
  const [report, setReport] = useState<CarReport | null>(() => {
    if (!enabled || typeof window === "undefined") return null;
    return (
      readFromStorage(window.sessionStorage) ??
      readFromStorage(window.localStorage)
    );
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Signal readiness so a PWA opener/parent can push data in.
    const readyMsg = { type: PREVIEW_READY_TYPE };
    try {
      window.opener?.postMessage(readyMsg, "*");
    } catch {
      /* ignore */
    }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(readyMsg, "*");
      }
    } catch {
      /* ignore */
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type !== PREVIEW_MESSAGE_TYPE) return;
      const incoming = (data as { report?: CarReport }).report;
      if (!incoming) return;
      setReport(incoming);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== PREVIEW_STORAGE_KEY || !event.newValue) return;
      try {
        setReport(JSON.parse(event.newValue) as CarReport);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled]);

  return report;
}
