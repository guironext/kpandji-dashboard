"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { AgendaDuJourMarquee } from "@/components/manager/AgendaDuJourMarquee";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Mail,
  Send,
  MessageSquare,
  Contact,
  UserSearch,
  Briefcase,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const sections: {
  title: string;
  color: string;
  bg: string;
  items: { href: string; label: string; description: string; icon: typeof Mail }[];
}[] = [
  {
    title: "Principal",
    color: "text-indigo-600",
    bg: "bg-indigo-500/10",
    items: [
      {
        href: "/assistante/agenda",
        label: "Agenda",
        description: "Rendez-vous et planification",
        icon: CalendarDays,
      },
      {
        href: "/assistante/rapports-activites",
        label: "Rapports d'activités",
        description: "Consulter et gérer les rapports",
        icon: FileText,
      },
    ],
  },
  {
    title: "Communication",
    color: "text-sky-600",
    bg: "bg-sky-500/10",
    items: [
      {
        href: "/assistante/numero-courrier",
        label: "Courriers",
        description: "Numéros de courrier",
        icon: Mail,
      },
      {
        href: "/assistante/messages",
        label: "Messages",
        description: "Échanges et envois",
        icon: Send,
      },
      {
        href: "/assistante/suivi-messages",
        label: "Suivi messages",
        description: "Suivi des fils de discussion",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Répertoires",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    items: [
      {
        href: "/assistante/repertoire-clients",
        label: "Clients",
        description: "Répertoire clients",
        icon: Contact,
      },
      {
        href: "/assistante/repertoire-prospects",
        label: "Prospects",
        description: "Répertoire prospects",
        icon: UserSearch,
      },
      {
        href: "/assistante/repertoire-partenaires",
        label: "Partenaires",
        description: "Réseau partenaires",
        icon: Briefcase,
      },
    ],
  },
];

export default function AssistanteDashboardPage() {
  const { user, isLoaded } = useUser();
  const firstName = user?.firstName?.trim() || user?.username?.trim();
  const greeting = isLoaded && firstName ? `Bienvenue, ${firstName}` : "Bienvenue";

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-slate-800 px-6 py-8 shadow-lg shadow-indigo-900/20 md:px-10 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-indigo-200" />
              <span className="text-sm font-medium text-indigo-200/90">
                Assistante — Direction
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-6 w-6 shrink-0 text-amber-300" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {greeting}
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-indigo-100/85">
                  Tableau de bord : accédez rapidement à l&apos;agenda, la communication
                  et les répertoires.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Agenda du jour
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tous les rendez-vous d’aujourd’hui, en défilement horizontal.
          </p>
          <div className="mt-4">
            <AgendaDuJourMarquee />
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="mb-10 last:mb-0">
            <h2
              className={`mb-4 text-xs font-semibold uppercase tracking-wider ${section.color}`}
            >
              {section.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                <Link key={item.href} href={item.href} className="group block">
                  <Card className="h-full border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                    <CardContent className="flex items-start gap-4 p-5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${section.bg} transition-transform group-hover:scale-105`}
                      >
                        <Icon className="h-6 w-6 text-slate-800" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {item.description}
                        </p>
                        <div className="mt-3 flex items-center text-sm font-medium text-indigo-600">
                          <span className="group-hover:underline">Ouvrir</span>
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
