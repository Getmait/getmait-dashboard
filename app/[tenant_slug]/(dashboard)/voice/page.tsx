import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  PhoneCall,
  Clock,
  Activity,
  AlertCircle,
  Mic2,
  Volume2,
  Headphones,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import type { Ordrer } from '@/lib/types'

function getCallStatus(order: Ordrer): { label: string; color: string } {
  if (Number(order.total_pris ?? 0) > 0) return { label: 'Gennemført', color: 'bg-green-100 text-green-700' }
  if (order.status === 'viderestillet') return { label: 'Viderestillet', color: 'bg-blue-100 text-blue-700' }
  return { label: 'Besvaret', color: 'bg-slate-100 text-slate-400' }
}

function getCallType(order: Ordrer): string {
  if (Number(order.total_pris ?? 0) > 0) return 'Bestilling'
  return 'Info'
}

function parseOrdreDetaljer(raw: string, menuNrMap: Record<string, string> = {}): string {
  try {
    const items = JSON.parse(raw)
    if (Array.isArray(items)) {
      return items
        .map((i: { antal?: number; navn?: string }) => {
          const navn = i.navn ?? '?'
          const nr = menuNrMap[navn.toLowerCase()]
          const label = nr ? `Nr.${nr} ${navn}` : navn
          return `${i.antal ?? 1}x ${label}`
        })
        .join(', ')
    }
  } catch { /* ikke JSON */ }
  return raw
}

export default async function VoicePage({
  params,
}: {
  params: Promise<{ tenant_slug: string }>
}) {
  const { tenant_slug } = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', tenant_slug)
    .single()

  if (!tenant) redirect('/login')

  const [{ data: ordrer }, { data: menuRetter }] = await Promise.all([
    supabase
      .from('ordrer')
      .select('*')
      .eq('store_id', tenant.store_id)
      .order('oprettet_at', { ascending: false })
      .limit(50),
    supabase
      .from('menu')
      .select('nr, navn')
      .eq('store_id', tenant.store_id)
      .not('nr', 'is', null),
  ])

  const menuNrMap: Record<string, string> = {}
  for (const item of menuRetter ?? []) {
    if (item.navn && item.nr) menuNrMap[item.navn.toLowerCase()] = item.nr
  }

  const alle = (ordrer ?? []) as Ordrer[]
  const now = new Date()

  const besvarede = alle.length
  const gennemfoerte = alle.filter((o) => Number(o.total_pris ?? 0) > 0).length
  const automationsgrad = besvarede > 0 ? Math.round((gennemfoerte / besvarede) * 100) : 0
  const timerSparet = Math.round((besvarede * 3) / 60)

  const stats = [
    {
      label: 'Besvarede Opkald',
      value: String(besvarede),
      icon: PhoneCall,
      sub: 'Via Mait AI',
    },
    {
      label: 'Sparet Tid (Tlf)',
      value: `${timerSparet} t.`,
      icon: Clock,
      sub: 'Ca. 3 min/opkald',
    },
    {
      label: 'Automationsgrad',
      value: `${automationsgrad}%`,
      icon: Activity,
      sub: 'Bestillinger klaret af AI',
    },
    {
      label: 'Missede Opkald',
      value: '—',
      icon: AlertCircle,
      sub: 'Ikke målt endnu',
    },
  ]

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">
            Voice & Opkald
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 leading-none">
            Overvåg og optimer hvordan din AI-tjener håndterer telefonen.
          </p>
        </div>
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Linje Status</span>
            <span className={`text-xs font-black uppercase italic leading-none ${tenant.is_online ? 'text-green-600' : 'text-slate-400'}`}>
              {tenant.is_online ? 'Aktiv & Klar' : 'Offline'}
            </span>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${tenant.is_online ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`} />
        </div>
      </div>

      {/* KPI KORT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 group transition-all hover:shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:text-[#ea580c] transition-colors">
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">
              {stat.label}
            </p>
            <h3 className="text-3xl font-black text-slate-900 italic tracking-tight leading-none">
              {stat.value}
            </h3>
            <p className="text-[9px] font-bold text-slate-300 uppercase italic leading-none mt-1">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* OPKALDS HISTORIK */}
        <div className="lg:col-span-2">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-xl text-slate-400">
                  <Mic2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black italic uppercase leading-none mb-1">Seneste Opkald</h3>
                  <p className="text-[9px] font-bold text-slate-300 uppercase italic leading-none">Opdateres i realtid</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] italic border-b border-slate-100">
                    <th className="px-8 py-5">Kunde / Type</th>
                    <th className="px-6 py-5">Bestilling / Info</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Tidspunkt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {alle.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-300 font-semibold italic">
                        Ingen opkald endnu
                      </td>
                    </tr>
                  )}
                  {alle.slice(0, 20).map((order) => {
                    const callStatus = getCallStatus(order)
                    const callType = getCallType(order)
                    const resumé = parseOrdreDetaljer(order.ordre_detaljer, menuNrMap)
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-black uppercase italic text-slate-800 leading-none">
                              {order.kunde_navn ?? order.kunde_tlf ?? 'Ukendt nr.'}
                            </span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">
                              {callType}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3 max-w-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 shadow-[0_0_5px_rgba(249,115,22,0.4)]" />
                            <p className="text-[11px] font-bold text-slate-500 italic leading-tight truncate">
                              &ldquo;{resumé}&rdquo;
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded leading-none ${callStatus.color}`}>
                            {callStatus.label}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="text-[9px] font-black text-slate-300 uppercase italic whitespace-nowrap leading-none">
                            {format(new Date(order.oprettet_at), 'd. MMM HH:mm', { locale: da })}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* HØJRE KOLONNE */}
        <div className="space-y-6">

          {/* EFFEKTIVITET GAUGE */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-400 mb-8 italic leading-none">
              Telefon-effektivitet
            </h4>
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-5xl font-black italic tracking-tighter text-white leading-none">
                  {automationsgrad}%
                </p>
                <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest mt-1 italic leading-none">
                  Bestillinger klaret 100% af AI
                </p>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-700"
                  style={{ width: `${automationsgrad}%` }}
                />
              </div>
            </div>
            <Volume2 size={120} className="absolute -bottom-6 -right-6 opacity-5 rotate-12 group-hover:scale-110 transition-all duration-700" />
          </div>

          {/* FRIGJORTE HÆNDER */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm overflow-hidden relative group">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-50 p-2.5 rounded-xl text-[#ea580c]">
                <Clock size={18} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 leading-none">
                Frigjorte Hænder
              </h4>
            </div>
            <div className="space-y-2 relative z-10">
              <p className="text-3xl font-black italic text-slate-900 leading-none">
                {besvarede * 3} min.
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-[10px] font-black text-green-500 uppercase leading-none">
                  {timerSparet} timer i alt
                </span>
              </div>
            </div>
            <p className="text-[10px] font-medium italic text-slate-400 mt-4 leading-relaxed relative z-10">
              {timerSparet > 0
                ? `Du har sparet ${timerSparet} timer på ikke at tale i telefon. Det svarer til ca. ${timerSparet * 12} ekstra pizzaer.`
                : 'Opkald besvaret af Mait registreres automatisk her.'}
            </p>
            <Headphones size={100} className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:rotate-12 transition-transform" />
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <div className="bg-[#ea580c] p-4 rounded-2xl shadow-lg">
            <CheckCircle2 size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase italic tracking-tighter mb-1 text-orange-500 leading-none">
              Kvalitetssikring & Logning
            </h4>
            <p className="text-slate-400 font-medium italic text-xs max-w-md leading-relaxed">
              Alle opkald bliver transskriberet af Mait i realtid. Du kan altid gense resuméet herover,
              hvis der opstår tvivl om en bestilling.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 p-8 opacity-5 rotate-12 text-white pointer-events-none">
          <PhoneCall size={120} />
        </div>
      </div>

    </div>
  )
}
