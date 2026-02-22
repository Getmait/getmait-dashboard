'use client'

import { useTenant } from '@/lib/hooks/useTenant'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function CustomersPage() {
  const { tenant, loading: tenantLoading } = useTenant()
  const { customers, loading } = useCustomers(tenant?.id)

  const smsCount = customers.filter((c) => c.opted_in_sms).length

  if (tenantLoading || loading) {
    return <Skeleton className="h-96 rounded-3xl" />
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm rounded-3xl">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-[#1a1a2e]">{customers.length}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">Totale kunder</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-3xl">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-[#cc5533]">{smsCount}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">SMS-tilmeldte</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer table */}
      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-black text-[#1a1a2e]">Kundeklub</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-center py-12 text-slate-400 font-semibold">
              Ingen kunder endnu
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100">
                  <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Navn</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Telefon</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Bestillinger</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Sidst aktiv</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">SMS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-[#1a1a2e]">{customer.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{customer.phone}</TableCell>
                    <TableCell className="font-bold text-[#1a1a2e]">{customer.order_count}</TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {customer.last_order_at
                        ? format(new Date(customer.last_order_at), 'd. MMM yyyy', { locale: da })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold rounded-full ${
                          customer.opted_in_sms
                            ? 'bg-green-50 text-green-600 border-green-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {customer.opted_in_sms ? 'Tilmeldt' : 'Frameldt'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
