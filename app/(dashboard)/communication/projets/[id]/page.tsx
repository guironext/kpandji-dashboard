import { getCommunicationProjectById } from "@/lib/actions/communication-project";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Circle,
} from "lucide-react";
import ProjetDetailClient from "./ProjetDetailClient";
import {
  PROJECT_SECTIONS,
  PROJECT_STEP_COLORS,
  getProjectProgress,
  getSectionStatuses,
  projectHasAnyContent,
  fieldHasValue,
} from "../project-sections";
import { cn } from "@/lib/utils";

async function ProjetDetailPageContent({
  params,
  projetsListPath = "/communication/projets",
}: {
  params: Promise<{ id: string }>;
  projetsListPath?: string;
}) {
  const { id } = await params;
  const result = await getCommunicationProjectById(id);
  if (!result.success || !result.project) notFound();
  const project = result.project;

  const hasAnyContent = projectHasAnyContent(project);
  const progress = getProjectProgress(project);
  const sectionStatuses = getSectionStatuses(project);
  const sectionsCompleted = sectionStatuses.filter((s) => s.hasContent).length;

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-20 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 gap-1.5 px-2 text-slate-600 hover:bg-white/60 hover:text-violet-700"
            asChild
          >
            <Link href={projetsListPath}>
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
          <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
          <Link
            href={projetsListPath}
            className="text-slate-500 transition-colors hover:text-violet-600"
          >
            Projets
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
          <span
            className="max-w-[200px] truncate font-medium text-slate-800 sm:max-w-md"
            title={project.name}
          >
            {project.name}
          </span>
        </nav>

        <ProjetDetailClient
          project={project}
          projetsListPath={projetsListPath}
          hasAnyContent={hasAnyContent}
          progressPercent={progress.percent}
          filledFields={progress.filled}
          totalFields={progress.total}
          sectionsCompleted={sectionsCompleted}
        >
          {/* Mobile: horizontal step shortcuts */}
          <nav
            className="mb-2 flex gap-2 overflow-x-auto pb-2 lg:hidden"
            aria-label="Aller à une étape"
          >
            {PROJECT_SECTIONS.map((section, index) => {
              const status = sectionStatuses[index];
              const colors = PROJECT_STEP_COLORS[index];
              if (!status.hasContent) return null;
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#section-${section.id}`}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:border-violet-200 hover:text-violet-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white",
                      colors.gradient
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {section.subtitle}
                </a>
              );
            })}
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,260px)_1fr]">
            {/* Sticky step navigator */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-slate-200/40 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Parcours
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {sectionsCompleted} / {PROJECT_SECTIONS.length} étapes renseignées
                  </p>
                  <nav className="mt-4 space-y-1" aria-label="Étapes du projet">
                    {PROJECT_SECTIONS.map((section, index) => {
                      const status = sectionStatuses[index];
                      const colors = PROJECT_STEP_COLORS[index];
                      const Icon = section.icon;
                      return (
                        <a
                          key={section.id}
                          href={`#section-${section.id}`}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition-all",
                            status.hasContent
                              ? "hover:bg-slate-50"
                              : "opacity-60 hover:opacity-100 hover:bg-slate-50/80"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-105",
                              colors.gradient
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-slate-800 leading-tight">
                              {section.subtitle}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {status.filled}/{status.total} champs
                            </span>
                          </span>
                          {status.complete ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : status.hasContent ? (
                            <Circle className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                          ) : (
                            <Circle className="h-3 w-3 shrink-0 text-slate-300" />
                          )}
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Sections timeline */}
            <div className="relative space-y-8">
              <div
                className="absolute left-[1.125rem] top-4 bottom-4 hidden w-px bg-gradient-to-b from-violet-200 via-slate-200 to-transparent sm:block"
                aria-hidden
              />

              {PROJECT_SECTIONS.map((section, index) => {
                const colors = PROJECT_STEP_COLORS[index];
                const status = sectionStatuses[index];
                const visibleFields = section.fields.filter((f) =>
                  fieldHasValue(project, f.key)
                );
                if (visibleFields.length === 0) return null;

                const Icon = section.icon;

                return (
                  <section
                    key={section.id}
                    id={`section-${section.id}`}
                    className="relative scroll-mt-28 sm:pl-12"
                  >
                    {/* Timeline node */}
                    <div
                      className={cn(
                        "absolute left-0 top-6 z-10 hidden h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-md sm:flex",
                        colors.iconBox
                      )}
                    >
                      {section.id}
                    </div>

                    <article
                      className={cn(
                        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur-sm transition-shadow duration-300 hover:shadow-2xl",
                        colors.cardGlow
                      )}
                    >
                      {/* Colored top bar */}
                      <div
                        className={cn(
                          "h-1 w-full bg-gradient-to-r",
                          colors.gradient
                        )}
                      />

                      <div className="p-6 sm:p-8">
                        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:hidden",
                                colors.iconBox
                              )}
                            >
                              <Icon className="h-7 w-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "border-0 bg-slate-100/80 text-xs font-medium",
                                    colors.accent
                                  )}
                                >
                                  Étape {section.id}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
                                >
                                  {status.filled}/{status.total} complété
                                </Badge>
                              </div>
                              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                {section.title}
                              </h2>
                              <p className="text-sm leading-relaxed text-slate-600">
                                {section.goal}
                              </p>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-4 ring-white sm:flex",
                              colors.iconBox
                            )}
                          >
                            <Icon className="h-7 w-7" />
                          </div>
                        </header>

                        <div className="mt-8 space-y-6">
                          {visibleFields.map((field) => {
                            const value =
                              project[
                                field.key as keyof typeof project
                              ];
                            return (
                              <div key={field.key} className="group">
                                <p
                                  className={cn(
                                    "mb-2 text-xs font-semibold uppercase tracking-wider",
                                    colors.accent
                                  )}
                                >
                                  {field.label}
                                </p>
                                <div
                                  className={cn(
                                    "rounded-xl border px-4 py-4 text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap transition-colors group-hover:border-slate-200",
                                    colors.fieldBorder,
                                    colors.fieldBg
                                  )}
                                >
                                  {String(value)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </article>
                  </section>
                );
              })}
            </div>
          </div>
        </ProjetDetailClient>
      </div>
    </div>
  );
}

export default function ProjetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return ProjetDetailPageContent({
    params,
    projetsListPath: "/communication/projets",
  });
}
