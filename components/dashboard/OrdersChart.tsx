'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format, subDays } from 'date-fns'
import { da } from 'date-fns/locale'
import type { Order } from '@/lib/types'

interface OrdersChartProps {
  orders: Order[]
}

export function OrdersChart({ orders }: OrdersChartProps) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const key = format(date, 'yyyy-MM-dd')
    const label = format(date, 'EEE', { locale: da })
    const count = orders.filter((o) => o.created_at.startsWith(key)).length
    const revenue = orders
      .filter((o) => o.created_at.startsWith(key))
      .reduce((sum, o) => sum + Number(o.total), 0)
    return { label, count, revenue }
  })

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={last7} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            borderRadius: '1rem',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            fontSize: 12,
          }}
          formatter={(value: unknown) => [`${value}`, '']}
        />
        <Bar dataKey="count" fill="#cc5533" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
