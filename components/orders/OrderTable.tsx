'use client'

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
import { OrderStatusBadge } from './OrderStatusBadge'
import { Badge } from '@/components/ui/badge'
import type { Order } from '@/lib/types'

interface OrderTableProps {
  orders: Order[]
}

export function OrderTable({ orders }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 font-semibold">
        Ingen bestillinger endnu
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-100">
          <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Kunde</TableHead>
          <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Telefon</TableHead>
          <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Kanal</TableHead>
          <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Total</TableHead>
          <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Status</TableHead>
          <TableHead className="font-black text-xs uppercase tracking-wider text-slate-400">Tidspunkt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} className="border-slate-100 hover:bg-slate-50/50">
            <TableCell className="font-semibold text-[#1a1a2e]">{order.customer_name}</TableCell>
            <TableCell className="text-slate-500 text-sm">{order.customer_phone}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`text-xs font-bold rounded-full capitalize ${
                  order.channel === 'voice'
                    ? 'bg-purple-50 text-purple-600 border-purple-200'
                    : 'bg-sky-50 text-sky-600 border-sky-200'
                }`}
              >
                {order.channel === 'voice' ? '📞 Opkald' : '💬 Chat'}
              </Badge>
            </TableCell>
            <TableCell className="font-black text-[#cc5533]">{order.total} kr.</TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="text-slate-400 text-xs">
              {format(new Date(order.created_at), 'd. MMM HH:mm', { locale: da })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
