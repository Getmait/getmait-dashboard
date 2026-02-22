'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

export function useOrders(tenantId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()
    supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoading(false)
      })

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => {
          supabase
            .from('orders')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .then(({ data }) => setOrders(data ?? []))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  return { orders, loading }
}
