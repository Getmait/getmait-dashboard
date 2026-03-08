import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK_URL = 'https://n8n.getmait.dk/webhook/sms-kampagne'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tenant_id, message } = await req.json()
  if (!tenant_id || !message?.trim()) {
    return NextResponse.json({ error: 'Mangler tenant_id eller besked' }, { status: 400 })
  }

  // Hent tenant + store (for Twilio from-nummer)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, store_id, name')
    .eq('id', tenant_id)
    .single()

  if (!tenant?.store_id) {
    return NextResponse.json({ error: 'Tenant ikke fundet' }, { status: 404 })
  }

  const { data: store } = await supabase
    .from('stores')
    .select('phone_number, sms_phone')
    .eq('id', tenant.store_id)
    .single()

  const fromNumber = store?.sms_phone || store?.phone_number
  if (!fromNumber) {
    return NextResponse.json({ error: 'Ingen Twilio-nummer tilknyttet denne butik' }, { status: 400 })
  }

  // Hent SMS-tilmeldte kunder
  const { data: customers } = await supabase
    .from('customers')
    .select('name, phone')
    .eq('tenant_id', tenant_id)
    .eq('opted_in_sms', true)

  if (!customers || customers.length === 0) {
    return NextResponse.json({ error: 'Ingen SMS-tilmeldte kunder' }, { status: 400 })
  }

  // Gem kampagne i DB
  const { data: campaign } = await supabase
    .from('sms_campaigns')
    .insert({
      tenant_id,
      message: message.trim(),
      sent_to_count: customers.length,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  // Send til n8n → Twilio
  const n8nRes = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message.trim(),
      from_number: fromNumber,
      recipients: customers,
      campaign_id: campaign?.id ?? null,
    }),
  })

  if (!n8nRes.ok) {
    return NextResponse.json({ error: 'SMS-udsendelse fejlede', details: await n8nRes.text() }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sent_to: customers.length })
}
