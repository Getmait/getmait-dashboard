'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '@/lib/hooks/useTenant'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { SmsComposer } from '@/components/sms/SmsComposer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import type { SmsCampaign } from '@/lib/types'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'

export default function SmsPage() {
  const { tenant, loading: tenantLoading } = useTenant()
  const { customers, loading: customersLoading } = useCustomers(tenant?.id)
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])

  const smsRecipients = customers.filter((c) => c.opted_in_sms)

  const fetchCampaigns = useCallback(async () => {
    if (!tenant?.id) return
    const supabase = createClient()
    const { data } = await supabase
      .from('sms_campaigns')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
    setCampaigns(data ?? [])
  }, [tenant?.id])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  if (tenantLoading || customersLoading) {
    return <Skeleton className="h-96 rounded-3xl" />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Composer */}
      <Card className="border-0 shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base font-black text-[#1a1a2e]">Ny SMS-kampagne</CardTitle>
          <p className="text-sm text-slate-400">
            Sendes til {smsRecipients.length} tilmeldte modtagere
          </p>
        </CardHeader>
        <CardContent>
          <SmsComposer
            tenantId={tenant!.id}
            recipientCount={smsRecipients.length}
            onSent={fetchCampaigns}
          />
        </CardContent>
      </Card>

      {/* Campaign history */}
      <Card className="border-0 shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base font-black text-[#1a1a2e]">Tidligere kampagner</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-semibold text-sm">
              Ingen kampagner endnu
            </p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <p className="text-sm font-semibold text-[#1a1a2e] mb-2">{campaign.message}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{campaign.sent_to_count} modtagere</span>
                    <span>
                      {campaign.sent_at
                        ? format(new Date(campaign.sent_at), 'd. MMM yyyy HH:mm', { locale: da })
                        : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
