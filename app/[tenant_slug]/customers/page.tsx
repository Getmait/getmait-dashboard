'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTenant } from '@/lib/hooks/useTenant'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  Users,
  Zap,
  Wand2,
  Send,
  TrendingUp,
  Gift,
  Activity,
  ShieldCheck,
  Search,
  Sparkles,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import type { SmsCampaign, Customer } from '@/lib/types'

function getCustomerStatus(orderCount: number): 'Stamkunde' | 'Aktiv' | 'Inaktiv' {
  if (orderCount >= 8) return 'Stamkunde'
  if (orderCount >= 1) return 'Aktiv'
  return 'Inaktiv'
}

const AI_TEMPLATES = [
  "Halløj {{Navn}}! Det er ved at være tid til din faste yndlingsret. Jeg har sat 15% rabat ind på dit nummer i dag, hvis du bestiller inden kl. 18. Svar JA for bestilling.",
  "Hey {{Navn}}, vejret kalder på hygge! Hvad med en varm middag til at lune på? Som tak fordi du er stamkunde, giver vi en gratis sodavand med i aften. Svar JA.",
  "Godaften {{Navn}}! Det er længe siden vi har set dig. Her er en 20% rabat til dig i aften — kun til dig. Svar blot JA for bestilling!",
]

export default function KundeklubPage() {
  const { tenant, loading: tenantLoading } = useTenant()
  const { customers, loading: customersLoading } = useCustomers(tenant?.id)

  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [smsText, setSmsText] = useState(
    'Hey {{Navn}}, god fodboldkamp i aften. Skal jeg have din yndlingsret klar inden kampstart? Fordi du er en god stamkunde får du 10% rabat. Hilsen fra ' +
      (tenant?.name ?? 'os') +
      '. Besvar blot med Ja.'
  )
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const smsRecipients = customers.filter((c) => c.opted_in_sms)
  const totalSmsSent = campaigns.reduce((sum, c) => sum + (c.sent_to_count ?? 0), 0)

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
  }, [fetchCampaigns])

  function generateAiSms() {
    setIsGeneratingAi(true)
    setTimeout(() => {
      setSmsText(AI_TEMPLATES[Math.floor(Math.random() * AI_TEMPLATES.length)])
      setIsGeneratingAi(false)
    }, 1200)
  }

  async function handleSend() {
    if (!smsText.trim() || !tenant?.id || smsRecipients.length === 0) return
    setSending(true)
    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenant.id, message: smsText.trim() }),
    })
    setSending(false)
    if (res.ok) {
      setSent(true)
      fetchCampaigns()
      setTimeout(() => setSent(false), 3000)
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

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">
            Kundeklub & SMS
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 leading-none">
            Send hyper-personaliserede tilbud direkte til dine stamkunder.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-orange-50 border border-orange-100 px-5 py-3 rounded-2xl text-center">
            <p className="text-[8px] font-black text-[#cc5533] uppercase tracking-widest leading-none mb-1">Medlemmer</p>
            <p className="text-xl font-black italic text-[#cc5533] leading-none">{smsRecipients.length}</p>
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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-[#cc5533] p-3.5 rounded-2xl text-white shadow-lg">
                  <MessageSquare size={22} fill="white" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">
                  Opret SMS Kampagne
                </h3>
              </div>
              <button
                onClick={generateAiSms}
                disabled={isGeneratingAi}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-50 text-[#cc5533] rounded-xl font-black text-[10px] uppercase tracking-widest italic hover:bg-orange-100 transition-all border border-orange-100 shadow-sm disabled:opacity-50"
              >
                {isGeneratingAi
                  ? <Zap size={14} className="animate-spin" />
                  : <Wand2 size={14} />}
                {isGeneratingAi ? 'Mait tænker...' : 'Generér med AI'}
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block ml-1 leading-none">
                  Besked — brug {'{{Navn}}'} som personaliserings-tag
                </label>
                <textarea
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-[#cc5533]/5 outline-none transition-all shadow-inner text-slate-700 leading-relaxed italic resize-none"
                />
                <div className="flex gap-2 mt-4">
                  {['Navn'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSmsText((t) => t + ` {{${tag}}}`)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-400 uppercase hover:border-[#cc5533] hover:text-[#cc5533] transition-all leading-none"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                {isGeneratingAi && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-[2rem]">
                    <div className="flex items-center gap-3 text-[#cc5533] font-black italic uppercase text-xs tracking-widest leading-none">
                      <Sparkles size={20} className="animate-pulse" /> Optimering i gang...
                    </div>
                  </div>
                )}
              </div>

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
                    Sendes til {smsRecipients.length} tilmeldte
                  </p>
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !smsText.trim() || smsRecipients.length === 0}
                  className="bg-slate-900 text-white px-10 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] italic hover:bg-[#cc5533] transition-all shadow-2xl flex items-center gap-4 group disabled:opacity-40"
                >
                  {sent ? '✓ SENDT!' : sending ? 'SENDER...' : (
                    <>UDSEND KAMPAGNE <Send size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
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
                    <th className="px-8 py-5 text-[#cc5533]">Navn / Status</th>
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
                    const status = getCustomerStatus(customer.order_count)
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
                                  ? 'bg-orange-100 text-[#cc5533]'
                                  : status === 'Aktiv'
                                  ? 'bg-green-50 text-green-600'
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
                    {campaigns.length > 0
                      ? `${Math.min(Math.round((campaigns[0]?.sent_to_count ?? 0) / Math.max(smsRecipients.length, 1) * 100), 100)}%`
                      : '—'}
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
                  style={{ width: campaigns.length > 0 ? '68%' : '0%' }}
                />
              </div>
            </div>
          </div>

          {/* LOYALITET */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative group overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:text-[#cc5533] transition-colors shadow-sm">
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
                  {customers.filter((c) => getCustomerStatus(c.order_count) === 'Stamkunde').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase italic text-slate-400 leading-none">SMS-tilmeldte</span>
                <span className="text-sm font-black italic text-[#cc5533] leading-none">{smsRecipients.length}</span>
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
              <Zap size={20} className="text-[#cc5533] fill-[#cc5533]" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] italic leading-none text-[#cc5533]">
                Mait AI Indsigt
              </h4>
            </div>
            <p className="text-[13px] font-bold italic text-slate-600 leading-relaxed">
              {customers.filter((c) => getCustomerStatus(c.order_count) === 'Inaktiv').length > 0
                ? `Du har ${customers.filter((c) => getCustomerStatus(c.order_count) === 'Inaktiv').length} inaktive kunder. Skal jeg sende dem et "Savner dig"-tilbud?`
                : 'Dine kunder er aktive. Overvej en kampagne for at booste omsætningen i weekenden.'}
            </p>
            <button className="mt-5 text-[10px] font-black uppercase tracking-widest text-[#cc5533] underline decoration-2 underline-offset-8 hover:text-orange-700 transition-all leading-none block">
              Opret kampagne
            </button>
            <Activity size={80} className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:scale-110 transition-transform text-slate-900" />
          </div>

        </div>
      </div>

      {/* GDPR FOOTER */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-8">
          <div className="bg-[#cc5533] p-5 rounded-[1.5rem] shadow-xl">
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
