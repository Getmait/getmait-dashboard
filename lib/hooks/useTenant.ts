'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tenant } from '@/lib/types'

export function useTenant() {
  const params = useParams()
  const tenantSlug = params?.tenant_slug as string
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantSlug) return

    const supabase = createClient()
    supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .single()
      .then(({ data }) => {
        setTenant(data)
        setLoading(false)
      })
  }, [tenantSlug])

  return { tenant, tenantSlug, loading }
}
