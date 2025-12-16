"use client";

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { Loader2, FileText, DollarSign, Receipt, FileTextIcon } from "lucide-react"

const Page = () => {
  const router = useRouter()
  const [invoices, setInvoices] = useState<SistreInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-col w-full p-8">
      <div className="flex justify-end mb-6">
        <Button 
          onClick={() => router.push('/manager/sistre/creer-invoice')}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold shadow-lg"
        >
          Créer Reçu
        </Button>
      </div>
      <div className="flex flex-col w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Liste des Reçus SISTRE
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <span className="ml-2 text-muted-foreground">Chargement...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error}</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun reçu créé pour le moment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 via-amber-50/60 to-orange-50/40 border-b-2 border-gray-200">
                      <TableHead className="font-extrabold text-gray-900 py-5 text-sm uppercase tracking-wide">
                        Numéro de Reçu
                      </TableHead>
                      <TableHead className="font-extrabold text-gray-900 py-5 text-sm uppercase tracking-wide">
                        Articles
                      </TableHead>
                      <TableHead className="font-extrabold text-gray-900 py-5 text-center text-sm uppercase tracking-wide">
                        Quantité
                      </TableHead>
                      <TableHead className="font-extrabold text-gray-900 py-5 text-right text-sm uppercase tracking-wide">
                        Montant Total
                      </TableHead>
                      <TableHead className="font-extrabold text-gray-900 py-5 text-sm uppercase tracking-wide">
                        Date de Création
                      </TableHead>
                      <TableHead className="font-extrabold text-gray-900 py-5 text-center text-sm uppercase tracking-wide">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const totalQuantity = invoice.lineItems.reduce((sum, item) => sum + item.quantity, 0)
                      return (
                        <TableRow 
                          key={invoice.id}
                          className="hover:bg-amber-50/30 transition-colors"
                        >
                          <TableCell className="font-semibold text-gray-900">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="flex flex-col gap-1">
                              {invoice.lineItems.map((item, index) => (
                                <span key={item.id} className="text-sm text-gray-700">
                                  {index + 1}. {item.description}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {totalQuantity}
                          </TableCell>
                          <TableCell className="text-right font-bold text-amber-600">
                            <div className="flex items-center justify-end gap-2">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(invoice.total)}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(invoice.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="flex flex-col items-start justify-center gap-2 text-center">
                            <Button
                              onClick={() => router.push(`/manager/sistre/${invoice.id}`)}
                              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold shadow-md"
                              size="sm"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Reçu
                            </Button>

                            <Button
                              onClick={() => router.push(`/manager/sistre/${invoice.id}/contract`)}
                              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold shadow-md"
                              size="sm"
                            >
                              <FileTextIcon className="h-4 w-4 mr-2" />
                              Contrat
                            </Button>
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
      </div>
    </div>
  )
}

export default Page