import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { CarReport } from "./report.api";

const SHARED_API_BASE_URL = "https://carreports.ru";

// Backward compatibility for previously built client bundles that still call
// /_serverFn/0c96cdc8792cfcbfa4062ef33bb15a8638381876f306ea4ed17abbfc9a6cef21.
// Current app code uses report.api.ts directly in the browser.
export const getReport = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({ token: z.string().trim().min(1) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CarReport> => {
    const res = await fetch(
      `${SHARED_API_BASE_URL}/api/v1/shared/report?token=${encodeURIComponent(data.token)}`,
    );

    if (!res.ok) throw new Error(`Report fetch failed: ${res.status}`);

    const json = (await res.json()) as { result: CarReport; errors?: unknown[] };
    return json.result;
  });