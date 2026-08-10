"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ShoppingCart,
  Calendar,
  CreditCard,
  BarChart3,
  AlertTriangle,
  Wallet,
  Target,
  ClipboardCheck,
  PackageCheck,
  Archive,
  Warehouse,
  Settings,
  ContainerIcon,
  UserCheck,
  DollarSign,
  Eye,
  Plus,
  Sparkles,
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Layers,
} from "lucide-react"

const Page = () => {
  const [expandedDept, setExpandedDept] = useState<string | null>(null)

  const departmentActivities = {
    commercial: {
      title: "Commercial",
      description: "Gestion des ventes, clients et commandes",
      icon: Users,
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      bgPattern: "bg-blue-50",
      activities: [
        { name: "Prospects & Proformas", icon: Plus, path: "/manager/departements/prospects-proformas", color: "from-blue-500 to-blue-600", description: "Liste des prospects et proformas" },
        { name: "Clients & factures", icon: ShoppingCart, path: "/manager/departements/clients-factures", color: "from-green-500 to-green-600", description: "Liste des clients et factures" },
        { name: "Liste des RDV", icon: Calendar, path: "/manager/departements/rendez-vous", color:  "from-purple-500 to-purple-600", description: "Planifier rendez-vous" },
        { name: "Rapports des RDV", icon: Calendar, path: "/manager/departements/rapports-rendez-vous", color: "from-purple-500 to-purple-600", description: "Planifier rendez-vous" },

      ]
    },
    comptable: {
      title: "Comptable",
      description: "Gestion financière et comptable",
      icon: DollarSign,
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      bgPattern: "bg-emerald-50",
      activities: [
        { name: "Nouvelle Facture", icon: Plus, path: "/commercial/creerFacture", color: "from-blue-500 to-blue-600", description: "Créer une facture" },
        { name: "Enregistrer Paiement", icon: CreditCard, path: "/comptable/point-paiement", color: "from-green-500 to-green-600", description: "Paiements clients" },
        { name: "Rapport Financier", icon: BarChart3, path: "/comptable/facture", color: "from-purple-500 to-purple-600", description: "Rapports financiers" },
        { name: "Relances Clients", icon: AlertTriangle, path: "/comptable/clients", color: "from-orange-500 to-orange-600", description: "Gestion relances" },
        { name: "Analyse Trésorerie", icon: Wallet, path: "/comptable/facture", color: "from-indigo-500 to-indigo-600", description: "État trésorerie" },
        { name: "Budget Prévisionnel", icon: Target, path: "/comptable/proforma", color: "from-emerald-500 to-emerald-600", description: "Budgets et prévisions" },
      ]
    },
    magasinier: {
      title: "Magasinier",
      description: "Gestion des stocks et opérations",
      icon: Warehouse,
      gradient: "from-amber-500 via-orange-500 to-red-600",
      bgPattern: "bg-amber-50",
      activities: [
        { name: "Renseigner Commande", icon: ClipboardCheck, path: "/magasinier/renseigner-commande", color: "from-blue-500 to-blue-600", description: "Détails commandes" },
        { name: "Pièces Vérifiées", icon: PackageCheck, path: "/magasinier/listeConteneurs", color: "from-green-500 to-green-600", description: "Vérification pièces" },
        { name: "Stockage", icon: Archive, path: "/magasinier/listeConteneurs", color: "from-purple-500 to-purple-600", description: "Gestion stockage" },
        { name: "Stock Disponible", icon: Warehouse, path: "/magasinier/listeConteneurs", color: "from-orange-500 to-orange-600", description: "État des stocks" },
        { name: "Attribution Pièces", icon: Settings, path: "/magasinier/renseigner-commande", color: "from-indigo-500 to-indigo-600", description: "Assigner pièces" },
        { name: "Opérations Montage", icon: ContainerIcon, path: "/magasinier/listeConteneurs", color: "from-cyan-500 to-cyan-600", description: "Suivi montage" },
      ]
    },
    superviseur: {
      title: "Superviseur",
      description: "Supervision et monitoring",
      icon: Activity,
      gradient: "from-purple-500 via-pink-500 to-rose-600",
      bgPattern: "bg-purple-50",
      activities: [
        { name: "Rapport Rendez-vous", icon: Calendar, path: "/superviseur/rapportrendezvous", color: "from-blue-500 to-blue-600", description: "Rapports RDV" },
        { name: "Suivi Bon Commande", icon: ShoppingCart, path: "/superviseur/suivi-bon-commande", color: "from-green-500 to-green-600", description: "Suivi commandes" },
        { name: "Suivi Rendez-vous", icon: Eye, path: "/superviseur/suivi-rendez-vous", color: "from-purple-500 to-purple-600", description: "Monitoring RDV" },
        { name: "Tableau Chute", icon: BarChart3, path: "/superviseur/tableau-chute", color: "from-orange-500 to-orange-600", description: "Analyse performance" },
      ]
    },
    manager: {
      title: "Manager",
      description: "Gestion et supervision globale",
      icon: Users,
      gradient: "from-slate-600 via-gray-600 to-zinc-600",
      bgPattern: "bg-slate-50",
      activities: [
        { name: "Commandes", icon: ShoppingCart, path: "/manager/commandes", color: "from-blue-500 to-blue-600", description: "Gestion commandes" },
        { name: "Liste Conteneurs", icon: Warehouse, path: "/manager/listeConteneurs", color: "from-green-500 to-green-600", description: "Suivi conteneurs" },
        { name: "Sistre", icon: Users, path: "/manager/sistre", color: "from-purple-500 to-purple-600", description: "Gestion équipe" },
        { name: "Tableau Commandes", icon: BarChart3, path: "/manager/tableau-commandes", color: "from-orange-500 to-orange-600", description: "Vue d'ensemble" },
      ]
    },
    autres: {
      title: "Autres Services",
      description: "Services complémentaires",
      icon: Sparkles,
      gradient: "from-cyan-500 via-blue-500 to-indigo-600",
      bgPattern: "bg-cyan-50",
      activities: [
        { name: "Onboarding", icon: UserCheck, path: "/onboarding", color: "from-indigo-500 to-indigo-600", description: "Intégration équipe" },
        { name: "Test Scanner", icon: Eye, path: "/test-scanner", color: "from-cyan-500 to-cyan-600", description: "Outils de test" },
      ]
    }
  }

  const toggleDepartment = (deptKey: string) => {
    setExpandedDept(expandedDept === deptKey ? null : deptKey)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 p-4 md:p-6 lg:p-8">
      {/* Enhanced Header */}
      <div className="relative mb-8 md:mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Centre d&apos;Activités
                  </h1>
                  <p className="text-slate-600 text-base md:text-lg mt-1 font-medium">
                    Accès rapide à toutes les fonctionnalités par département
                  </p>
                </div>
               
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 px-3 py-1.5 shadow-lg shadow-emerald-500/20">
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  Système actif
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-3 py-1.5 shadow-lg shadow-blue-500/20">
                  <Grid3X3 className="w-3.5 h-3.5 mr-1.5" />
                  {Object.keys(departmentActivities).length} départements
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {Object.entries(departmentActivities).map(([key, dept]) => {
          const DeptIcon = dept.icon
          const isExpanded = expandedDept === key

          return (
            <Card key={key} className={`relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 ${dept.bgPattern} hover:scale-105`}>
              {/* Department Background Pattern */}
              <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-br ${dept.gradient} opacity-10`}></div>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${dept.gradient} rounded-full -translate-y-16 translate-x-16 blur-2xl opacity-20`}></div>

              <CardHeader className="relative pb-4 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${dept.gradient} rounded-2xl shadow-lg`}>
                    <DeptIcon className="w-6 h-6 text-white" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDepartment(key)}
                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                    {dept.title}
                  </CardTitle>
                  <p className="text-slate-600 text-sm leading-relaxed">{dept.description}</p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="bg-white/70 text-slate-700 border-0 text-xs">
                    <Layers className="w-3 h-3 mr-1" />
                    {dept.activities.length} activités
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative">
                {isExpanded ? (
                  <div className="space-y-3">
                    {dept.activities.map((activity, index) => {
                      const IconComponent = activity.icon
                      return (
                        <Link key={index} href={activity.path} className="group block">
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 border border-white/50 hover:border-white/70 transition-all duration-300 hover:shadow-md">
                            <div className={`flex-shrink-0 p-2 bg-gradient-to-br ${activity.color} rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300`}>
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                {activity.name}
                              </h4>
                              <p className="text-xs text-slate-600 mt-0.5">{activity.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {dept.activities.slice(0, 4).map((activity, index) => {
                      const IconComponent = activity.icon
                      return (
                        <Link key={index} href={activity.path} className="group">
                          <div className={`flex flex-col items-center p-3 rounded-lg bg-white/40 hover:bg-white/60 border border-white/30 hover:border-white/50 transition-all duration-300 hover:shadow-sm`}>
                            <div className={`p-2 bg-gradient-to-br ${activity.color} rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 mb-2`}>
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-medium text-slate-700 text-center leading-tight group-hover:text-blue-600 transition-colors">
                              {activity.name}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                    {dept.activities.length > 4 && (
                      <div className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/50">
                        <div className="p-2 bg-slate-400 rounded-lg mb-2">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-medium text-slate-600 text-center">
                          +{dept.activities.length - 4} autres
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Page