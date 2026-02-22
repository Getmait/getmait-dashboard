'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/lib/hooks/useTenant'
import { useOrders } from '@/lib/hooks/useOrders'
import { OrderTable } from '@/components/orders/OrderTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { OrderStatus } from '@/lib/types'

const statusFilters: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Alle', value: 'all' },
  { label: 'Afventer', value: 'pending' },
  { label: 'Bekræftet', value: 'confirmed' },
  { label: 'Afsluttet', value: 'completed' },
  { label: 'Annulleret', value: 'cancelled' },
]

export default function OrdersPage() {
  const { tenant, loading: tenantLoading } = useTenant()
  const { orders, loading } = useOrders(tenant?.id)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (tenantLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(({ label, value }) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(value)}
            className={`rounded-full font-bold text-xs ${
              filter === value
                ? 'bg-[#cc5533] hover:bg-[#b34929] text-white border-0'
                : 'border-slate-200 text-slate-500 hover:text-[#1a1a2e]'
            }`}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-black text-[#1a1a2e]">
            {filtered.length} bestilling{filtered.length !== 1 ? 'er' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <OrderTable orders={filtered} />
        </CardContent>
      </Card>
    </div>
  )
}
