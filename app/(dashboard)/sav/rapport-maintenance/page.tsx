import RapportMaintenanceClient from "./RapportMaintenanceClient";

export default function RapportMaintenancePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-primary/[0.04] via-background to-muted/25">
      <div
        className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[min(100%,72rem)] -translate-x-1/2 rounded-full bg-primary/[0.09] blur-3xl"
        aria-hidden
      />
      <div className="container relative max-w-6xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        <RapportMaintenanceClient />
      </div>
    </div>
  );
}
