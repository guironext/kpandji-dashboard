"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Mail,
  ClipboardList,
  Activity,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import {
  getCommunicationUserActivities,
  getCommunicationUserStats,
  type CommunicationActivity,
} from "@/lib/actions/communication-activity";

const activityConfig = {
  project: {
    icon: FileText,
    label: "Projet",
    gradient: "from-sky-500 to-cyan-600",
    bg: "bg-sky-500",
    light: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    hover: "hover:border-sky-300 hover:shadow-sky-100",
  },
  message: {
    icon: MessageSquare,
    label: "Message",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-500",
    light: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    hover: "hover:border-violet-300 hover:shadow-violet-100",
  },
  courrier: {
    icon: Mail,
    label: "Courrier",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-500",
    light: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    hover: "hover:border-amber-300 hover:shadow-amber-100",
  },
  plan_action: {
    icon: ClipboardList,
    label: "Plan d'action",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500",
    light: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    hover: "hover:border-emerald-300 hover:shadow-emerald-100",
  },
} as const;

const quickActions = [
  {
    href: "/communication/projets",
    label: "Projets",
    icon: FileText,
    gradient: "from-sky-500 to-cyan-600",
    bg: "bg-sky-500/10",
    shadow: "shadow-sky-500/20",
  },
  {
    href: "/communication/messages",
    label: "Messages",
    icon: MessageSquare,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    shadow: "shadow-violet-500/20",
  },
  {
    href: "/communication/numero-courrier",
    label: "Courriers",
    icon: Mail,
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10",
    shadow: "shadow-amber-500/20",
  },
  {
    href: "/communication/mise-oeuvre",
    label: "Mise en œuvre",
    icon: ClipboardList,
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10",
    shadow: "shadow-emerald-500/20",
  },
] as const;

export default function CommunicationDashboard() {
  const { userId: clerkId } = useAuth();
  const [activities, setActivities] = useState<CommunicationActivity[]>([]);
  const [stats, setStats] = useState<{
    totalProjects: number;
    totalMessages: number;
    totalCourriers: number;
    activeProjects: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!clerkId) {
        setLoading(false);
        return;
      }

      const [activitiesResult, statsResult] = await Promise.all([
        getCommunicationUserActivities(clerkId, 25),
        getCommunicationUserStats(clerkId),
      ]);

      if (activitiesResult.success && activitiesResult.data) {
        setActivities(activitiesResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
      setLoading(false);
    };

    fetchData();
  }, [clerkId]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (date: Date | string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-500 to-cyan-600 animate-ping opacity-20" />
          <div className="relative animate-spin rounded-full h-14 w-14 border-2 border-sky-200 border-t-sky-600" />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement de vos activités...</p>
      </div>
    );
  }

  if (!clerkId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-slate-700 font-medium">Veuillez vous connecter pour voir votre tableau de bord.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 px-6 pt-8 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span className="text-sm font-medium text-sky-100/90">Tableau de bord</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Communication
          </h1>
          <p className="mt-2 text-lg text-sky-100/80 max-w-xl">
            Vue d&apos;ensemble de vos projets, messages et activités
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Projets",
            value: stats?.totalProjects ?? 0,
            sub: `${stats?.activeProjects ?? 0} actifs`,
            icon: FolderOpen,
            gradient: "from-sky-500 to-cyan-600",
            iconBg: "bg-sky-500/20",
          },
          {
            label: "Messages",
            value: stats?.totalMessages ?? 0,
            sub: "Envoyés et reçus",
            icon: MessageSquare,
            gradient: "from-violet-500 to-purple-600",
            iconBg: "bg-violet-500/20",
          },
          {
            label: "Courriers",
            value: stats?.totalCourriers ?? 0,
            sub: "Numéros créés",
            icon: Mail,
            gradient: "from-amber-500 to-orange-600",
            iconBg: "bg-amber-500/20",
          },
          {
            label: "Actions",
            value: activities.filter((a) => a.type === "plan_action").length,
            sub: "Dans vos projets",
            icon: ClipboardList,
            gradient: "from-emerald-500 to-teal-600",
            iconBg: "bg-emerald-500/20",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="group relative overflow-hidden border-0 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`} />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className="h-6 w-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Accès rapide
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex items-center gap-4 p-5 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-slate-300 hover:scale-[1.02]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />
              <div className={`relative p-3 rounded-xl ${action.bg} shadow-sm`}>
                <action.icon className="h-6 w-6 text-slate-700" />
              </div>
              <div className="relative flex-1 min-w-0 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Activités récentes</CardTitle>
              <CardDescription>
                Chronologie de vos projets, messages, courriers et plans d&apos;action
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="p-4 rounded-2xl bg-slate-100 mb-4">
                <Zap className="h-12 w-12 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">Aucune activité pour le moment</p>
              <p className="text-sm text-slate-500 mt-1 text-center max-w-sm">
                Créez un projet, envoyez un message ou générez un courrier pour commencer.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line - centered with icon circle (px-6 + 20px = 44px) */}
              <div className="absolute left-11 top-0 bottom-0 w-0.5 bg-slate-200" />

              <div className="divide-y divide-slate-100">
                {activities.map((activity) => {
                  const config = activityConfig[activity.type];
                  const IconComponent = config.icon;
                  const content = (
                    <>
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient} shadow-lg ring-4 ring-white`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pl-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900">
                            {activity.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${config.light} ${config.border} ${config.text}`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {getRelativeTime(activity.date)}
                        </p>
                      </div>
                      {activity.link && (
                        <ArrowRight className="flex-shrink-0 h-4 w-4 text-slate-300 group-hover:text-sky-600 transition-colors" />
                      )}
                    </>
                  );

                  return activity.link ? (
                    <Link
                      key={activity.id}
                      href={activity.link}
                      className="group flex items-start gap-4 px-6 py-5 transition-colors hover:bg-slate-50/80"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 px-6 py-5"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
