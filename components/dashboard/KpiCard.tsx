import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend }: KpiCardProps) {
  return (
    <Card className="border-0 shadow-sm bg-white rounded-3xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#cc5533]/10 flex items-center justify-center">
            <Icon size={20} className="text-[#cc5533]" />
          </div>
          {trend && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                trend.positive
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        <p className="text-3xl font-black text-[#1a1a2e] mb-1">{value}</p>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
