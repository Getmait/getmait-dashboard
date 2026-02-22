import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/lib/types'

const config: Record<OrderStatus, { label: string; className: string }> = {
  pending:   { label: 'Afventer',   className: 'bg-amber-50 text-amber-600 border-amber-200' },
  confirmed: { label: 'Bekræftet', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed: { label: 'Afsluttet', className: 'bg-green-50 text-green-600 border-green-200' },
  cancelled: { label: 'Annulleret', className: 'bg-red-50 text-red-500 border-red-200' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = config[status]
  return (
    <Badge variant="outline" className={`text-xs font-bold rounded-full px-3 ${className}`}>
      {label}
    </Badge>
  )
}
