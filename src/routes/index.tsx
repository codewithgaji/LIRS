import { createFileRoute, redirect } from "@tanstack/react-router";

/** The register opens on the dashboard; the auth gate handles signed-out users. */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
