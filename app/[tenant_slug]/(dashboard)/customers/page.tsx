'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTenant } from '@/lib/hooks/useTenant'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  Users,
  Zap,
  Send,
  TrendingUp,
  Gift,
  Activity,
  ShieldCheck,
  Search,
  Percent,
  Pizza,
  Heart,
  AlertTriangle,
  Leaf,
  PenLine,
  Star,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import type { SmsCampaign, Customer } from '@/lib/types'

function MenuItemPicker({ menuItems, value, onChange }: {
  menuItems: { id: string; name: string; category: string; price: number }[]
  value: string
  onChange: (v: string) => void
}) {
  if (menuItems.length > 0) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#ea580c]/20"
      >
        {Object.entries(
          menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
            acc[item.category] = [...(acc[item.category] ?? []), item]
            return acc
          }, {})
        ).map(([cat, items]) => (
          <optgroup key={cat} label={cat}>
            {items.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name} ({item.price} kr.)
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    )
  }
  return (
    <input
      type="text"
      placeholder="fx Margherita"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#ea580c]/20"
    />
  )
}

function AntalStepper({ value, onChange, min = 1 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg bg-slate-100 font-black text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center text-lg leading-none"
      >
        −
      </button>
      <span className="flex-1 text-center text-sm font-black text-slate-800">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-lg bg-slate-100 font-black text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center text-lg leading-none"
      >
        +
      </button>
    </div>
  )
}

function getCustomerStatus(orderCount: number, lastOrderAt: string | null): 'Stamkunde' | 'Aktiv' | 'Inaktiv' | 'Ny' {
  if (!lastOrderAt) return 'Ny'
  if ((Date.now() - new Date(lastOrderAt).getTime()) > 60 * 24 * 60 * 60 * 1000) return 'Inaktiv'
  if (orderCount >= 8) return 'Stamkunde'
  return 'Aktiv'
}

type OfferType = 'rabat' | 'gratis' | 'savner' | 'fejl' | 'dato' | 'fri' | 'yndling' | null

export default function KundeklubPage() {
  const { tenant, loading: tenantLoading } = useTenant()
  const { customers, loading: customersLoading } = useCustomers(tenant?.id)

  const [menuItems, setMenuItems] = useState<{ id: string; name: string; category: string; price: number }[]>([])
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])

  // Simplified offer form
  const [offerType, setOfferType] = useState<OfferType>(null)
  const [offerPct, setOfferPct] = useState(15)
  const [offerItem, setOfferItem] = useState('')
  const [offerAntal, setOfferAntal] = useState(2)
  const [offerPris, setOfferPris] = useState('')
  const [friTekst, setFriTekst] = useState('')

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const smsRecipients = customers.filter((c) => c.opted_in_sms)
  const inactiveRecipients = smsRecipients.filter((c) => getCustomerStatus(c.order_count, c.last_order_at) === 'Inaktiv')
  const segment = offerType === 'savner' ? 'inactive' : 'all'
  const activeRecipients = segment === 'inactive' ? inactiveRecipients : smsRecipients
  const totalSmsSent = campaigns.reduce((sum, c) => sum + (c.sent_to_count ?? 0), 0)
  const konverteringPct = campaigns.length > 0
    ? Math.min(Math.round((campaigns[0]?.sent_to_count ?? 0) / Math.max(smsRecipients.length, 1) * 100), 100)
    : 0

  function generateSmsText(): string {
    const item = offerItem || menuItems[0]?.name || 'pizza'
    if (offerType === 'rabat') {
      return `Hej {{Navn}}! Vi giver dig {{Rabat${offerPct}}} rabat på din næste bestilling. Ring eller bestil online nu.`
    }
    if (offerType === 'gratis') {
      return `Hej {{Navn}}! Bestil ${offerAntal} pizzaer i aften og få ${item} med gratis. Svar JA for at bestille.`
    }
    if (offerType === 'savner') {
      return `Hej {{Navn}}! Det er {{DageSiden}} dage siden vi sidst så dig. Som stamkunde får du {{Rabat${offerPct}}} rabat i aften. Ring eller bestil online nu.`
    }
    if (offerType === 'fejl') {
      const pris = offerPris ? ` kun ${offerPris} kr.` : ''
      return `Hej! Vi har ${offerAntal} stk. ${item} klar nu${pris}. Fejlbestilling. Svar JA for at bestille. Første der svarer får den!`
    }
    if (offerType === 'dato') {
      return `Hej {{Navn}}! Vi har friske råvarer der skal bruges i dag. {{Rabat${offerPct}}} rabat på ${item} i aften. Svar JA for at bestille.`
    }
    if (offerType === 'fri') {
      return friTekst
    }
    if (offerType === 'yndling') {
      return `Hej {{Navn}}! Vi kan se at du elsker {{Yndlingspizza}}. Skal vi lave den til dig i aften? Svar JA for at bestille. Vi klargør den med det samme!`
    }
    return ''
  }

  const fetchMenuItems = useCallback(async () => {
    if (!tenant?.id) return
    const supabase = createClient()
    const { data } = await supabase
      .from('menu_items')
      .select('id, name, category, price')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('category')
      .order('name')
    setMenuItems(data ?? [])
    if (data?.length) setOfferItem(data[0].name)
  }, [tenant?.id])

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

  useEffect(() => {
    fetchCampaigns()
    fetchMenuItems()
  }, [fetchCampaigns, fetchMenuItems])

  async function handleSend() {
    const smsText = generateSmsText()
    if (!smsText || !tenant?.id || activeRecipients.length === 0) return
    setSending(true)
    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenant.id, message: smsText, segment }),
    })
    setSending(false)
    if (res.ok) {
      setSent(true)
      fetchCampaigns()
      setOfferType(null)
      setFriTekst('')
      setTimeout(() => setSent(false), 4000)
    } else {
      const err = await res.json()
      alert(err.error ?? 'SMS-udsendelse fejlede')
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  )

  if (tenantLoading || customersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  const offerTypes: { type: OfferType; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      type: 'rabat',
      icon: <Percent size={20} />,
      title: 'Rabat',
      desc: 'X% rabat på næste bestilling',
    },
    {
      type: 'gratis',
      icon: <Pizza size={20} />,
      title: 'Gratis ret',
      desc: 'Bestil X, få en ret gratis',
    },
    {
      type: 'savner',
      icon: <Heart size={20} />,
      title: 'Vi savner dig',
      desc: 'Til inaktive kunder, 60+ dage',
    },
    {
      type: 'fejl',
      icon: <AlertTriangle size={20} />,
      title: 'Fejlbestilling',
      desc: 'Sælg en klar ret billigt — hurtig SMS',
    },
    {
      type: 'dato',
      icon: <Leaf size={20} />,
      title: 'Dato-vare',
      desc: 'Råvarer der skal bruges i dag',
    },
    {
      type: 'yndling',
      icon: <Star size={20} />,
      title: 'Yndlingsret',
      desc: 'Personlig SMS med kundens favoritret',
    },
    {
      type: 'fri',
      icon: <PenLine size={20} />,
      title: 'Skriv selv',
      desc: 'Fri tekst fra bunden',
    },
  ]

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">
            Kundeklub & SMS
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 leading-none">
            Send tilbud direkte til dine stamkunder.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-orange-50 border border-orange-100 px-5 py-3 rounded-2xl text-center">
            <p className="text-[8px] font-black text-[#ea580c] uppercase tracking-widest leading-none mb-1">Medlemmer</p>
            <p className="text-xl font-black italic text-[#ea580c] leading-none">{smsRecipients.length}</p>
          </div>
          <div className="bg-slate-900 px-5 py-3 rounded-2xl text-center shadow-lg">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SMS Sendt</p>
            <p className="text-xl font-black italic text-white leading-none">{totalSmsSent.toLocaleString('da-DK')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* VENSTRE KOLONNE: SMS COMPOSER + KUNDELISTE */}
        <div className="lg:col-span-2 space-y-6">

          {/* SMS COMPOSER */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#ea580c] p-3.5 rounded-2xl text-white shadow-lg">
                <MessageSquare size={22} fill="white" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">
                Send SMS Kampagne
              </h3>
            </div>

            {/* TRIN 1: Vælg tilbudstype */}
            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none ml-1">
                Hvad vil du tilbyde?
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {offerTypes.map(({ type, icon, title, desc }) => (
                  <button
                    key={type}
                    onClick={() => setOfferType(offerType === type ? null : type)}
                    className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 text-center transition-all ${
                      offerType === type
                        ? 'border-[#ea580c] bg-orange-50 text-[#ea580c]'
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {icon}
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{title}</span>
                    <span className="text-[9px] font-medium text-slate-400 leading-snug">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TRIN 2: Udfyld detaljer */}
            {offerType !== null && (
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-5 mb-6">

                {/* Rabat % vælger */}
                {(offerType === 'rabat' || offerType === 'savner') && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 leading-none">
                      Vælg rabat
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {[10, 15, 20, 25, 30].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setOfferPct(pct)}
                          className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${
                            offerPct === pct
                              ? 'bg-[#ea580c] text-white shadow-md'
                              : 'bg-white border border-slate-200 text-slate-500 hover:border-[#ea580c] hover:text-[#ea580c]'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gratis ret vælger */}
                {offerType === 'gratis' && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                        Gratis ret
                      </p>
                      <MenuItemPicker menuItems={menuItems} value={offerItem} onChange={setOfferItem} />
                    </div>
                    <div className="w-32">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                        Min. antal
                      </p>
                      <AntalStepper value={offerAntal} onChange={setOfferAntal} />
                    </div>
                  </div>
                )}

                {/* Fejlbestilling vælger */}
                {offerType === 'fejl' && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                        Hvilken ret?
                      </p>
                      <MenuItemPicker menuItems={menuItems} value={offerItem} onChange={setOfferItem} />
                    </div>
                    <div className="w-24">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                        Antal
                      </p>
                      <AntalStepper value={offerAntal} onChange={setOfferAntal} min={1} />
                    </div>
                    <div className="w-32">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                        Pris (kr.)
                      </p>
                      <input
                        type="number"
                        min={1}
                        placeholder="fx 49"
                        value={offerPris}
                        onChange={(e) => setOfferPris(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#ea580c]/20"
                      />
                    </div>
                  </div>
                )}

                {/* Dato-vare vælger */}
                {offerType === 'dato' && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                        Hvilken ret?
                      </p>
                      <MenuItemPicker menuItems={menuItems} value={offerItem} onChange={setOfferItem} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                        Rabat
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {[10, 15, 20, 25, 30].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setOfferPct(pct)}
                            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${
                              offerPct === pct
                                ? 'bg-[#ea580c] text-white shadow-md'
                                : 'bg-white border border-slate-200 text-slate-500 hover:border-[#ea580c] hover:text-[#ea580c]'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fri tekst */}
                {offerType === 'fri' && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                      Din besked
                    </p>
                    <textarea
                      rows={4}
                      placeholder="Skriv din SMS her..."
                      value={friTekst}
                      onChange={(e) => setFriTekst(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#ea580c]/5 outline-none transition-all text-slate-700 leading-relaxed resize-none"
                    />
                  </div>
                )}

                {/* SMS Preview */}
                {offerType !== 'fri' && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                      Forhåndsvisning
                    </p>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-600 italic leading-relaxed">
                      {generateSmsText()}
                    </div>
                    {offerType === 'savner' && (
                      <p className="text-[10px] font-bold text-orange-500 mt-2 ml-1 leading-none italic">
                        Sendes kun til kunder der ikke har bestilt i 60+ dage ({inactiveRecipients.length} kunder)
                      </p>
                    )}
                  </div>
                )}

                {/* Tags */}
                {offerType !== null && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-2 leading-none">
                      Tilpas med tags — klik for at tilføje til fri tekst
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { tag: '{{Navn}}', label: 'Navn' },
                        { tag: '{{Yndlingspizza}}', label: 'Yndlingspizza' },
                        { tag: '{{DageSiden}}', label: 'Dage siden sidst' },
                        { tag: '{{Rabat10}}', label: 'Rabat 10%' },
                        { tag: '{{Rabat15}}', label: 'Rabat 15%' },
                        { tag: '{{Rabat20}}', label: 'Rabat 20%' },
                      ].map(({ tag, label }) => (
                        <button
                          key={tag}
                          onClick={() => {
                            const base = offerType !== 'fri' ? generateSmsText() + ' ' : friTekst + ' '
                            setFriTekst(base + tag)
                            setOfferType('fri')
                          }}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-[#ea580c] hover:text-[#ea580c] transition-all leading-none"
                        >
                          + {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SEND */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-[11px] font-black text-slate-400"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase italic leading-none">
                  Sendes til {activeRecipients.length} {segment === 'inactive' ? 'inaktive' : 'tilmeldte'}
                </p>
              </div>
              <button
                onClick={handleSend}
                disabled={sending || offerType === null || activeRecipients.length === 0 || (offerType === 'fri' && !friTekst.trim())}
                className="bg-slate-900 text-white px-10 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] italic hover:bg-[#ea580c] transition-all shadow-2xl flex items-center gap-4 group disabled:opacity-40"
              >
                {sent ? '✓ SENDT!' : sending ? 'SENDER...' : (
                  <>UDSEND KAMPAGNE <Send size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </section>

          {/* KUNDELISTE */}
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3.5 rounded-2xl text-slate-400 shadow-sm">
                  <Users size={22} />
                </div>
                <h3 className="text-xl font-black italic uppercase leading-none text-slate-800">
                  Dine Stamkunder
                </h3>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  placeholder="Søg navn eller tlf..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-3.5 text-[10px] font-black outline-none uppercase tracking-widest text-slate-900 shadow-inner italic leading-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-slate-100">
                    <th className="px-8 py-5 text-[#ea580c]">Navn / Status</th>
                    <th className="px-6 py-5">Tlf. nummer</th>
                    <th className="px-6 py-5">Leveringsadresse</th>
                    <th className="px-6 py-5">Bestillinger</th>
                    <th className="px-8 py-5 text-right">Sidst aktiv</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-300 font-semibold italic">
                        Ingen kunder matcher søgningen
                      </td>
                    </tr>
                  )}
                  {filtered.map((customer) => {
                    const status = getCustomerStatus(customer.order_count, customer.last_order_at)
                    return (
                      <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-black uppercase italic text-slate-800 leading-none">
                              {customer.name}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-1 rounded-md w-fit leading-none ${
                                status === 'Stamkunde'
                                  ? 'bg-orange-100 text-[#ea580c]'
                                  : status === 'Aktiv'
                                  ? 'bg-green-50 text-green-600'
                                  : status === 'Ny'
                                  ? 'bg-blue-50 text-blue-500'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-500 font-bold italic text-sm leading-none">
                          {customer.phone}
                        </td>
                        <td className="px-6 py-5 text-slate-400 italic text-[11px] leading-none max-w-[180px] truncate">
                          {customer.address ?? <span className="text-slate-200">—</span>}
                        </td>
                        <td className="px-6 py-5 font-black italic text-slate-800 leading-none">
                          {customer.order_count}
                        </td>
                        <td className="px-8 py-5 text-right text-slate-400 font-bold uppercase italic text-[11px] leading-none">
                          {customer.last_order_at
                            ? format(new Date(customer.last_order_at), 'd. MMM yyyy', { locale: da })
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* HØJRE KOLONNE: WIDGETS */}
        <div className="space-y-6">

          {/* KONVERTERING */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 mb-8 italic leading-none">
              Konvertering
            </h4>
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-5xl font-black italic tracking-tighter text-white leading-none">
                    {campaigns.length > 0 ? `${konverteringPct}%` : '—'}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mt-2 italic leading-none">
                    {campaigns.length > 0 ? 'Seneste kampagne' : 'Ingen kampagner endnu'}
                  </p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-2xl border border-green-500/20 shadow-sm">
                  <TrendingUp size={20} className="text-green-500" />
                </div>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="bg-orange-500 h-full shadow-[0_0_15px_#f97316] transition-all duration-700"
                  style={{ width: `${konverteringPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* LOYALITET */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative group overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:text-[#ea580c] transition-colors shadow-sm">
                <Gift size={20} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 leading-none">
                Loyalitet
              </h4>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase italic text-slate-400 leading-none">Stamkunder</span>
                <span className="text-sm font-black italic text-slate-800 leading-none">
                  {customers.filter((c) => getCustomerStatus(c.order_count, c.last_order_at) === 'Stamkunde').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase italic text-slate-400 leading-none">SMS-tilmeldte</span>
                <span className="text-sm font-black italic text-[#ea580c] leading-none">{smsRecipients.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase italic text-slate-400 leading-none">Kampagner sendt</span>
                <span className="text-sm font-black italic text-slate-800 leading-none">{campaigns.length}</span>
              </div>
            </div>
          </div>

          {/* MAIT AI INDSIGT */}
          <div className="bg-orange-50 rounded-[2.5rem] p-8 border border-orange-100 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-5">
              <Zap size={20} className="text-[#ea580c] fill-[#ea580c]" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] italic leading-none text-[#ea580c]">
                Mait AI Indsigt
              </h4>
            </div>
            <p className="text-[13px] font-bold italic text-slate-600 leading-relaxed">
              {inactiveRecipients.length > 0
                ? `Du har ${inactiveRecipients.length} inaktive kunder. Skal jeg sende dem et tilbud?`
                : 'Dine kunder er aktive. Overvej en kampagne for at booste omsætningen i weekenden.'}
            </p>
            <button
              onClick={() => {
                setOfferType('savner')
                setOfferPct(15)
                document.querySelector('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="mt-5 text-[10px] font-black uppercase tracking-widest text-[#ea580c] underline decoration-2 underline-offset-8 hover:text-orange-700 transition-all leading-none block"
            >
              Opret kampagne
            </button>
            <Activity size={80} className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-transform text-slate-900" />
          </div>

        </div>
      </div>

      {/* GDPR FOOTER */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-8">
          <div className="bg-[#ea580c] p-5 rounded-[1.5rem] shadow-xl">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2 text-orange-500 leading-none">
              GDPR & Samtykke Sikret
            </h4>
            <p className="text-slate-400 font-medium italic text-sm max-w-xl leading-relaxed">
              Alle kunder i klubben har afgivet samtykke til SMS-marketing via Maits bestillings-flow.
              Du overholder alle lovkrav i EU automatisk ved brug af vores platform.
            </p>
          </div>
        </div>
        <Users size={180} className="absolute top-0 right-0 p-10 opacity-5 rotate-12 text-white pointer-events-none" />
      </div>

    </div>
  )
}
