import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { OrdersChart } from '@/components/dashboard/OrdersChart'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, Users, TrendingUp, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant_slug: string }>
}) {
  const { tenant_slug } = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenant_slug)
    .single()

  if (!tenant) return null

  const [
    { data: orders },
    { data: customers },
    { data: campaigns },
  ] = await Promise.all([
    supabase.from('orders').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
    supabase.from('customers').select('id, opted_in_sms').eq('tenant_id', tenant.id),
    supabase.from('sms_campaigns').select('id').eq('tenant_id', tenant.id),
  ])

  const allOrders = orders ?? []
  const allCustomers = customers ?? []

  const todayStr = new Date().toISOString().split('T')[0]
  const todayOrders = allOrders.filter((o) => o.created_at.startsWith(todayStr))
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const pendingCount = allOrders.filter((o) => o.status === 'pending').length
  const smsCount = allCustomers.filter((c) => c.opted_in_sms).length

  return (
    <div className="space-y-8">
      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Bestillinger i dag"
          value={todayOrders.length}
          icon={ShoppingBag}
          subtitle={`${pendingCount} afventer`}
        />
        <KpiCard
          title="Omsætning i dag"
          value={`${todayRevenue} kr.`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Kundeklub"
          value={allCustomers.length}
          icon={Users}
          subtitle={`${smsCount} SMS-tilmeldte`}
        />
        <KpiCard
          title="SMS-kampagner"
          value={campaigns?.length ?? 0}
          icon={MessageSquare}
        />
      </div>

      {/* Chart + recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-0 shadow-sm rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-[#1a1a2e]">
              Bestillinger — seneste 7 dage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart orders={allOrders} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-[#1a1a2e]">
              Seneste bestillinger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1a1a2e]">{order.customer_name}</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(order.created_at), 'd. MMM HH:mm', { locale: da })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#cc5533]">{order.total} kr.</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              ))}
              {allOrders.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Ingen bestillinger</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
