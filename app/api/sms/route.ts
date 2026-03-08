import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK_URL = 'https://n8n.getmait.dk/webhook/sms-kampagne'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tenant_id, message, segment } = await req.json()
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

  // Hent SMS-tilmeldte kunder — filtrer på segment hvis angivet
  let query = supabase
    .from('customers')
    .select('name, phone, last_order_at, order_count')
    .eq('tenant_id', tenant_id)
    .eq('opted_in_sms', true)

  if (segment === 'inactive') {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    query = query.or(`last_order_at.is.null,last_order_at.lt.${sixtyDaysAgo}`)
  }

  const { data: customers } = await query

  if (!customers || customers.length === 0) {
    return NextResponse.json({ error: 'Ingen modtagere i det valgte segment' }, { status: 400 })
  }

  // Udtræk rabat-procent fra besked (fx {{Rabat15}} → 15)
  const rabatMatch = message.match(/\{\{Rabat(\d+)\}\}/)
  const rabatPct = rabatMatch ? parseInt(rabatMatch[1], 10) : null

  // Udtræk RedningsDeal-tag (fx {{RedningsDeal:Margherita:4}} eller {{RedningsDeal:Margherita}})
  const rescueMatch = message.match(/\{\{RedningsDeal:([^:}]+)(?::(\d+))?\}\}/)
  const rescueItemName = rescueMatch ? rescueMatch[1] : null
  const rescueAntal = rescueMatch?.[2] ?? null

  // Hent menupris for rescue-retten (bruges til præcis rabat-beregning)
  let rescueItemPrice: number | null = null
  if (rescueItemName) {
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('price')
      .eq('tenant_id', tenant_id)
      .eq('name', rescueItemName)
      .eq('is_active', true)
      .single()
    rescueItemPrice = menuItem ? Number(menuItem.price) : null
  }

  // Hent ordrer til yndlingspizza-beregning + rabat-beregning
  const { data: ordrer } = await supabase
    .from('ordrer')
    .select('kunde_tlf, ordre_detaljer, total_pris')
    .eq('store_id', tenant.store_id)

  // Byg yndlingspizza-map + gennemsnitsbeløb per telefonnummer
  const yndlingMap: Record<string, string> = {}
  const storeTotals: Record<string, number> = {}
  const customerOrderTotals: Record<string, { sum: number; count: number }> = {}
  let storeOrderSum = 0
  let storeOrderCount = 0

  if (ordrer) {
    const itemCounts: Record<string, Record<string, number>> = {}
    ordrer.forEach(o => {
      try {
        const items = JSON.parse(o.ordre_detaljer)
        if (Array.isArray(items) && o.kunde_tlf) {
          if (!itemCounts[o.kunde_tlf]) itemCounts[o.kunde_tlf] = {}
          items.forEach((i: { navn?: string; antal?: number }) => {
            const navn = i.navn ?? '?'
            const antal = i.antal ?? 1
            itemCounts[o.kunde_tlf][navn] = (itemCounts[o.kunde_tlf][navn] ?? 0) + antal
            storeTotals[navn] = (storeTotals[navn] ?? 0) + antal
          })
        }
      } catch { /* skip invalid JSON */ }

      // Akkumulér ordrebeløb til rabat-beregning
      const pris = Number(o.total_pris ?? 0)
      if (pris > 0 && o.kunde_tlf) {
        if (!customerOrderTotals[o.kunde_tlf]) customerOrderTotals[o.kunde_tlf] = { sum: 0, count: 0 }
        customerOrderTotals[o.kunde_tlf].sum += pris
        customerOrderTotals[o.kunde_tlf].count += 1
        storeOrderSum += pris
        storeOrderCount += 1
      }
    })
    Object.entries(itemCounts).forEach(([phone, counts]) => {
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
      if (top) yndlingMap[phone] = top[0]
    })
  }

  // Butikkens mest populære ret — bruges som fallback for kunder uden ordrehistorik
  const storeTopItem = Object.entries(storeTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Butikkens gennemsnitlige ordrebeløb — fallback til rabat-beregning
  const storeAvgOrder = storeOrderCount > 0 ? storeOrderSum / storeOrderCount : 0

  // Berig modtagere med personaliserings-data
  const now = new Date()
  let fallbackCount = 0
  const recipients = customers.map(c => {
    const dageSiden = c.last_order_at
      ? Math.round((now.getTime() - new Date(c.last_order_at).getTime()) / (1000 * 60 * 60 * 24))
      : null
    const yndlingspizza = yndlingMap[c.phone] ?? storeTopItem
    if (!yndlingMap[c.phone] && storeTopItem) fallbackCount++

    // Beregn rabat i kr. — brug menupris ved rescue deal, ellers kundens gennemsnit
    let rabatKr: number | null = null
    if (rabatPct !== null) {
      const basePrice = rescueItemPrice !== null
        ? rescueItemPrice
        : (customerOrderTotals[c.phone]
            ? customerOrderTotals[c.phone].sum / customerOrderTotals[c.phone].count
            : storeAvgOrder)
      rabatKr = basePrice > 0 ? Math.round(basePrice * rabatPct / 100) : null
    }

    // Byg rescue-tekst (samme for alle modtagere)
    const rescueText = rescueItemName
      ? rescueAntal ? `${rescueAntal} x ${rescueItemName}` : rescueItemName
      : null

    return {
      name: c.name,
      phone: c.phone,
      yndlingspizza,
      dage_siden: dageSiden,
      rabat_kr: rabatKr,
      rescue_text: rescueText,
    }
  })

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
      recipients,
      campaign_id: campaign?.id ?? null,
    }),
  })

  if (!n8nRes.ok) {
    return NextResponse.json({ error: 'SMS-udsendelse fejlede', details: await n8nRes.text() }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    sent_to: customers.length,
    yndlingspizza_fallback_count: fallbackCount,
    yndlingspizza_fallback_item: storeTopItem,
  })
}
