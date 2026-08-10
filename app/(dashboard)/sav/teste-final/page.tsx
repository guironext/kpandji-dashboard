import TesteFinalClient from "./TesteFinalClient";

export default function TesteFinalPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-x-hidden bg-gradient-to-b from-teal-500/[0.04] via-background to-muted/30">
      <div
        className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[min(100%,72rem)] -translate-x-1/2 rounded-full bg-teal-500/[0.07] blur-3xl"
        aria-hidden
      />
      <div className="container relative max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <TesteFinalClient />
      </div>
    </div>
  );
}
