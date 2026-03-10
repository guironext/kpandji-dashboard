"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Building2,
  Receipt,
  Search,
  RefreshCw,
  Loader2,
  User,
  Phone,
  Mail,
  AlertCircle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  getClientsFromFacturesByFilters,
  type ClientFromFacture,
  type ClientEntrepriseFromFacture,
} from "@/lib/actions/clients-from-factures";
import { getObjectifPeriods } from "@/lib/actions/objectif-period";
import { getCommercialUsers } from "@/lib/actions/user";
import { Skeleton } from "@/components/ui/skeleton";

type UnifiedClient = (ClientFromFacture | ClientEntrepriseFromFacture) & {
  displayName: string;
};

function formatPeriodLabel(p: { start: Date; end: Date }) {
  const s = new Date(p.start);
  const e = new Date(p.end);
  return `${s.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} → ${e.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;
}

export default function ClientsPage() {
  const [commercialId, setCommercialId] = useState<string>("all");
  const [objectifPeriodId, setObjectifPeriodId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const [periods, setPeriods] = useState<{ id: string; start: Date; end: Date }[]>([]);
  const [commercials, setCommercials] = useState<{ id: string; fullName: string }[]>([]);
  const [clients, setClients] = useState<ClientFromFacture[]>([]);
  const [clientEntreprises, setClientEntreprises] = useState<ClientEntrepriseFromFacture[]>([]);

  const fetchFilters = useCallback(async () => {
    const [periodsRes, commercialsRes] = await Promise.all([
      getObjectifPeriods(),
      getCommercialUsers(),
    ]);
    if (periodsRes.success && periodsRes.data) {
      setPeriods(periodsRes.data);
    }
    if (commercialsRes.success && commercialsRes.data) {
      setCommercials(commercialsRes.data);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchFilters();

      const result = await getClientsFromFacturesByFilters({
        status_facture: "FACTURE",
        commercialId: commercialId && commercialId !== "all" ? commercialId : undefined,
        objectifPeriodId: objectifPeriodId && objectifPeriodId !== "all" ? objectifPeriodId : undefined,
      });

      if (result.success && result.data) {
        setClients(result.data.clients);
        setClientEntreprises(result.data.clientEntreprises);
      } else {
        setError(result.error || "Erreur lors du chargement");
        setClients([]);
        setClientEntreprises([]);
      }
    } catch (err) {
      console.error("Error fetching clients from factures:", err);
      setError("Une erreur est survenue");
      setClients([]);
      setClientEntreprises([]);
    } finally {
      setLoading(false);
    }
  }, [commercialId, objectifPeriodId, fetchFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Données actualisées");
  };

  const unifiedClients: UnifiedClient[] = useMemo(() => {
    const fromClients: UnifiedClient[] = clients.map((c) => ({
      ...c,
      displayName: c.nom,
    }));
    const fromEntreprises: UnifiedClient[] = clientEntreprises.map((c) => ({
      ...c,
      displayName: c.sigle ? `${c.nom_entreprise} (${c.sigle})` : c.nom_entreprise,
    }));
    return [...fromClients, ...fromEntreprises];
  }, [clients, clientEntreprises]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return unifiedClients;
    const q = searchQuery.toLowerCase().trim();
    return unifiedClients.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q)) ||
        c.telephone.includes(q) ||
        (c.commercial?.toLowerCase().includes(q))
    );
  }, [unifiedClients, searchQuery]);

  const clientsFiltered: UnifiedClient[] = useMemo(
    () => filteredClients.filter((c) => c.type === "client"),
    [filteredClients]
  );
  const entreprisesFiltered: UnifiedClient[] = useMemo(
    () => filteredClients.filter((c) => c.type === "client_entreprise"),
    [filteredClients]
  );

  const totalClients = clients.length;
  const totalEntreprises = clientEntreprises.length;
  const totalAll = totalClients + totalEntreprises;

  const statCards = [
    {
      label: "Total",
      value: totalAll,
      icon: Receipt,
      className: "from-emerald-500/10 to-teal-500/5 border-emerald-200/50 dark:border-emerald-800/30",
      iconBg: "bg-emerald-500",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Clients particuliers",
      value: totalClients,
      icon: User,
      className: "from-sky-500/10 to-blue-500/5 border-sky-200/50 dark:border-sky-800/30",
      iconBg: "bg-sky-500",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Clients entreprises",
      value: totalEntreprises,
      icon: Building2,
      className: "from-violet-500/10 to-purple-500/5 border-violet-200/50 dark:border-violet-800/30",
      iconBg: "bg-violet-500",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
  ];

  if (loading && clients.length === 0 && clientEntreprises.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-14" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 mb-6" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center py-3 border-b border-border/50 last:border-0">
                  <Skeleton className="h-4 w-28 shrink-0" />
                  <Skeleton className="h-4 w-40 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && totalAll === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Clients facturés
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Clients et entreprises liés aux factures
            </p>
          </div>
        </header>
        <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Erreur de chargement</h3>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchData()}>
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Clients facturés
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Clients et entreprises liés aux factures (status facturé) par commercial et période
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualiser
        </Button>
      </header>

      {/* Filters */}
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Filtres</CardTitle>
          </div>
          <CardDescription>
            Filtrez par commercial et période objectif pour afficher les clients ayant des factures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>Commercial</Label>
              <Select value={commercialId} onValueChange={setCommercialId}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Tous les commerciaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les commerciaux</SelectItem>
                  {commercials.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Période objectif</Label>
              <Select value={objectifPeriodId} onValueChange={setObjectifPeriodId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Toutes les périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {formatPeriodLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`overflow-hidden border bg-gradient-to-br ${stat.className} transition-all hover:shadow-md hover:-translate-y-0.5`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} text-white shadow-sm`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${stat.iconColor}`}>{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Table */}
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Liste des clients
              </CardTitle>
              <CardDescription className="mt-1">
                {filteredClients.length} résultat{filteredClients.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (nom, email, tél...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-muted bg-muted/30 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Aucun client trouvé</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {searchQuery
                  ? "Aucun résultat pour votre recherche. Modifiez les filtres ou la recherche."
                  : "Aucun client ou entreprise avec facture (status facturé) pour les critères sélectionnés."}
              </p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tous ({filteredClients.length})</TabsTrigger>
                <TabsTrigger value="clients">Particuliers ({clientsFiltered.length})</TabsTrigger>
                <TabsTrigger value="entreprises">Entreprises ({entreprisesFiltered.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-0">
                <ClientsTable items={filteredClients} />
              </TabsContent>
              <TabsContent value="clients" className="mt-0">
                <ClientsTable items={clientsFiltered} />
              </TabsContent>
              <TabsContent value="entreprises" className="mt-0">
                <ClientsTable items={entreprisesFiltered} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClientsTable({ items }: { items: UnifiedClient[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Nom / Entreprise</TableHead>
            <TableHead className="font-semibold">Contact</TableHead>
            <TableHead className="font-semibold">Commercial</TableHead>
            <TableHead className="font-semibold w-28">Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow
              key={`${item.type}-${item.id}`}
              className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {item.type === "client" ? (
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  {item.displayName}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.telephone}
                  </span>
                  {item.email && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {item.email}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.commercial || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    item.type === "client"
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                  }
                >
                  {item.type === "client" ? "Particulier" : "Entreprise"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
