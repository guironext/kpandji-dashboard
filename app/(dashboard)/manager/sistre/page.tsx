"use client";

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAllSistreInvoices, type SistreInvoice } from '@/lib/actions/sistre'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Loader2, 
  FileText, 
  DollarSign, 
  Receipt, 
  FileTextIcon, 
  Search,
  Calendar,
  Sparkles
} from "lucide-react"

const Page = () => {
  const router = useRouter()
  const [invoices, setInvoices] = useState<SistreInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const result = await getAllSistreInvoices()
        
        if (result.success && result.data) {
          setInvoices(result.data)
        } else {
          setError(result.error || 'Failed to fetch invoices')
        }
      } catch (err) {
        setError('An error occurred while fetching invoices')
        console.error('Error fetching invoices:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  // Filter invoices based on search term
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices
    
    return invoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.lineItems.some(item => 
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [invoices, searchTerm])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-col w-full p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
      {/* Enhanced Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent">
                  Reçus SISTRE
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gérez et consultez tous vos reçus SISTRE
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/manager/sistre/creer-invoice')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6 py-6 text-base"
            size="lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Créer un Nouveau Reçu
          </Button>
        </div>

       
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 via-amber-50/30 to-orange-50/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-amber-600" />
              Liste des Reçus
            </CardTitle>
            
            {/* Search Bar */}
            {!loading && !error && invoices.length > 0 && (
              <div className="relative w-full md:w-auto md:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro ou article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-6 border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
              <p className="text-muted-foreground text-lg">Chargement des reçus...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="p-4 rounded-full bg-red-100 mb-4">
                <FileText className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-500 text-lg font-medium">{error}</p>
              <p className="text-muted-foreground text-sm mt-2">Veuillez réessayer plus tard</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              {searchTerm ? (
                <>
                  <div className="p-4 rounded-full bg-amber-100 mb-4">
                    <Search className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-gray-900 text-lg font-medium mb-2">Aucun résultat trouvé</p>
                  <p className="text-muted-foreground text-sm text-center">
                    Aucun reçu ne correspond à &quot;{searchTerm}&quot;
                  </p>
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="mt-4"
                  >
                    Réinitialiser la recherche
                  </Button>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 mb-4">
                    <FileText className="h-12 w-12 text-amber-600" />
                  </div>
                  <p className="text-gray-900 text-xl font-bold mb-2">Aucun reçu créé</p>
                  <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
                    Commencez par créer votre premier reçu SISTRE en cliquant sur le bouton ci-dessus
                  </p>
                  <Button
                    onClick={() => router.push('/manager/sistre/creer-invoice')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Créer le Premier Reçu
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 via-amber-50/60 to-orange-50/40 border-b-2 border-amber-200/50">
                    <TableHead className="font-extrabold text-gray-900 py-6 px-6 text-sm uppercase tracking-wide">
                      Numéro de Reçu
                    </TableHead>
                    <TableHead className="font-extrabold text-gray-900 py-6 px-6 text-sm uppercase tracking-wide">
                      Articles
                    </TableHead>
                    <TableHead className="font-extrabold text-gray-900 py-6 px-6 text-center text-sm uppercase tracking-wide">
                      Quantité
                    </TableHead>
                    <TableHead className="font-extrabold text-gray-900 py-6 px-6 text-right text-sm uppercase tracking-wide">
                      Montant Total
                    </TableHead>
                    <TableHead className="font-extrabold text-gray-900 py-6 px-6 text-sm uppercase tracking-wide">
                      Date de Création
                    </TableHead>
                    <TableHead className="font-extrabold text-gray-900 py-6 px-6 text-center text-sm uppercase tracking-wide">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice, index) => {
                    const totalQuantity = invoice.lineItems.reduce((sum, item) => sum + item.quantity, 0)
                    return (
                      <TableRow 
                        key={invoice.id}
                        className="hover:bg-gradient-to-r hover:from-amber-50/50 hover:via-orange-50/30 hover:to-amber-50/50 transition-all duration-200 border-b border-gray-100"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-semibold text-gray-900 py-6 px-6">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                              {invoice.invoiceNumber}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md py-6 px-6">
                          <div className="flex flex-col gap-2">
                            {invoice.lineItems.slice(0, 3).map((item, idx) => (
                              <div key={item.id} className="flex items-start gap-2">
                                <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                  {idx + 1}
                                </span>
                                <span className="text-sm text-gray-700 flex-1">{item.description}</span>
                              </div>
                            ))}
                            {invoice.lineItems.length > 3 && (
                              <Badge variant="outline" className="w-fit text-xs">
                                +{invoice.lineItems.length - 3} autre(s)
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-6 px-6">
                          <div className="flex items-center justify-center">
                            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 font-bold text-base px-3 py-1">
                              {totalQuantity}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-6 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 rounded-lg border border-amber-200">
                              <DollarSign className="h-4 w-4 text-amber-600" />
                              <span className="font-bold text-lg text-amber-700">
                                {formatCurrency(invoice.total)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 px-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-gray-700">
                              {new Date(invoice.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(invoice.createdAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 px-6">
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <Button
                              onClick={() => router.push(`/manager/sistre/${invoice.id}`)}
                              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                              size="sm"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Reçu
                            </Button>
                            <Button
                              onClick={() => router.push(`/manager/sistre/${invoice.id}/contract`)}
                              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                              size="sm"
                            >
                              <FileTextIcon className="h-4 w-4 mr-2" />
                              Contrat
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      {!loading && !error && invoices.length > 0 && searchTerm && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {filteredInvoices.length} reçu{filteredInvoices.length > 1 ? 's' : ''} trouvé{filteredInvoices.length > 1 ? 's' : ''} sur {invoices.length}
          </p>
        </div>
      )}
    </div>
  )
}

export default Page