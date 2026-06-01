import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/reports/share/$token")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/", search: { token: params.token } });
  },
});
