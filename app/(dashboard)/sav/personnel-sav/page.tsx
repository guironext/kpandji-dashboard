import PersonnelSavClient from "./PersonnelSavClient";

export default function PersonnelSavPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-primary/[0.04] via-background to-muted/25">
      <div
        className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[min(100%,72rem)] -translate-x-1/2 rounded-full bg-primary/[0.09] blur-3xl"
        aria-hidden
      />
      <div className="container relative max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PersonnelSavClient />
      </div>
    </div>
  );
}
