'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Customer } from '@/lib/types'

export function useCustomers(tenantId: string | undefined) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()
    supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCustomers(data ?? [])
        setLoading(false)
      })
  }, [tenantId])

  return { customers, loading }
}
