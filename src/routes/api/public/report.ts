import { createFileRoute } from "@tanstack/react-router";
import { getServerConfig } from "@/lib/config.server";

// Proxy for the shared report API so the browser doesn't talk directly to
// carreports.ru (cross-origin / sandboxed previews fail with Failed to fetch).
// Lives under /api/public/* so it is reachable on published deployments.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export const Route = createFileRoute("/api/public/report")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token")?.trim();
        if (!token) {
          return new Response(
            JSON.stringify({ error: "Не указан токен отчёта" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
        const { sharedApiBaseUrl } = getServerConfig();
        try {
          const upstream = await fetch(
            `${sharedApiBaseUrl}/api/v1/shared/report?token=${encodeURIComponent(token)}`,
          );
          const body = await upstream.text();
          return new Response(body, {
            status: upstream.status,
            headers: {
              "Content-Type":
                upstream.headers.get("content-type") ?? "application/json",
              "Cache-Control": "no-store",
              ...corsHeaders,
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return new Response(
            JSON.stringify({ error: `Upstream fetch failed: ${message}` }),
            {
              status: 502,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      },
    },
  },
});
