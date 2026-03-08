import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Coins,
  TrendingUp,
  Clock,
  Zap,
  ShieldCheck,
  User,
  ExternalLink,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import type { Ordrer } from '@/lib/types'

export default async function DashboardPage({
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

  const storeId = tenant.store_id

  const { data: ordrer } = await supabase
    .from('ordrer')
    .select('*')
    .eq('store_id', storeId)
    .order('oprettet_at', { ascending: false })

  const alle = (ordrer ?? []) as Ordrer[]

  const now = new Date()
  const maanedStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const maanedOrdrer = alle.filter(o => o.oprettet_at >= maanedStart)

  const omsaetning = maanedOrdrer.reduce((sum, o) => sum + Number(o.total_pris ?? 0), 0)
  const antalOrdrer = maanedOrdrer.length
  const timerSparet = Math.round((alle.length * 3) / 60)

  const forrigeMaanedStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const forrigeMaanedSlut = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
  const forrigeOmsaetning = alle
    .filter(o => o.oprettet_at >= forrigeMaanedStart && o.oprettet_at <= forrigeMaanedSlut)
    .reduce((sum, o) => sum + Number(o.total_pris ?? 0), 0)

  const omsaetningChange =
    forrigeOmsaetning > 0
      ? `${Math.round(((omsaetning - forrigeOmsaetning) / forrigeOmsaetning) * 100) >= 0 ? '+' : ''}${Math.round(((omsaetning - forrigeOmsaetning) / forrigeOmsaetning) * 100)}%`
      : 'Ny'

  const fuldfoert = alle.filter(o => Number(o.total_pris ?? 0) > 0).length
  const konvertering = alle.length > 0 ? Math.round((fuldfoert / alle.length) * 100) : 0

  const seneste = alle.slice(0, 5)

  function parseOrdreDetaljer(raw: string): string {
    try {
      const items = JSON.parse(raw)
      if (Array.isArray(items)) {
        return items
          .map((i: { antal?: number; navn?: string; pris?: number }) =>
            `${i.antal ?? 1}x ${i.navn ?? '?'}`
          )
          .join(', ')
      }
    } catch { /* ikke JSON */ }
    return raw
  }

  const stats = [
    {
      label: 'Omsætning via Mait',
      value: `${omsaetning.toLocaleString('da-DK')} kr.`,
      change: omsaetningChange,
      icon: Coins,
      description: 'Bestillinger på autopilot',
    },
    {
      label: 'Ordrer denne måned',
      value: String(antalOrdrer),
      change: `${alle.length} total`,
      icon: TrendingUp,
      description: 'Håndteret af Mait',
    },
    {
      label: 'Arbejdskraft sparet',
      value: `${timerSparet} timer`,
      change: `${alle.length * 3} min`,
      icon: Clock,
      description: 'Frigjort fra telefonen',
    },
    {
      label: 'Automationsgrad',
      value: alle.length > 0 ? '94%' : '—',
      change: '+2%',
      icon: Zap,
      description: 'Håndteret uden hjælp',
    },
  ]

  return (
    <div className="space-y-10">

      {/* KPI KORT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-[#cc5533] transition-all">
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-green-50 text-green-600 border border-green-100">
                {stat.change}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">
              {stat.label}
            </p>
            <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none mb-1">
              {stat.value}
            </h3>
            <p className="text-[9px] font-bold text-slate-300 uppercase italic leading-none">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* GRID: INDHOLD + INDSIGT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-8">

          {/* PROFIT CENTER */}
          <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-[#cc5533] p-3 rounded-2xl text-white shadow-lg shadow-orange-100">
                <Zap size={24} fill="white" />
              </div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">
                Profit Center
              </h2>
            </div>
            <div className="space-y-4">
              <div className="p-6 rounded-[2rem] border border-orange-50 bg-white border-l-4 border-l-[#cc5533] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-5">
                  <div className="p-3.5 rounded-2xl h-fit bg-green-50 text-green-600">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-base uppercase italic mb-1 tracking-tight text-slate-800 leading-none">
                      Mersalg: Sodavand
                    </h4>
                    <p className="text-xs text-slate-500 font-medium italic leading-relaxed max-w-sm">
                      80% bestiller kun pizza. Mait kan tilbyde 1.5L sodavand automatisk og øge din gennemsnitsordre.
                    </p>
                  </div>
                </div>
                <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic hover:bg-[#cc5533] transition-all whitespace-nowrap leading-none shadow-lg">
                  Aktiver Mersalg
                </button>
              </div>
            </div>
          </section>

          {/* SENESTE BESTILLINGER */}
          <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-3 rounded-2xl text-slate-900 shadow-sm">
                  <Clock size={22} />
                </div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">
                  Seneste Bestillinger fra Mait
                </h2>
              </div>
              <Link
                href={`/${tenant_slug}/orders`}
                className="text-[10px] font-black text-slate-400 hover:text-[#cc5533] uppercase tracking-widest transition-all flex items-center gap-2 leading-none"
              >
                Vis alle <ExternalLink size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {seneste.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-8">
                  Ingen bestillinger endnu
                </p>
              )}
              {seneste.map((order) => {
                const dato = new Date(order.oprettet_at)
                const diffMin = Math.round((now.getTime() - dato.getTime()) / 60000)
                const tidLabel =
                  diffMin < 2
                    ? 'Lige nu'
                    : diffMin < 60
                    ? `${diffMin} min siden`
                    : format(dato, 'd. MMM HH:mm', { locale: da })

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-orange-100 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm text-slate-300 group-hover:text-[#cc5533] transition-colors">
                        <User size={20} />
                      </div>
                      <div className="leading-none">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black uppercase italic leading-none text-slate-800">
                            {order.kunde_navn ?? order.kunde_tlf ?? 'Anonym'}
                          </p>
                          <span className="text-[8px] font-bold text-slate-300 uppercase leading-none">
                            #{order.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold italic tracking-tight leading-none max-w-xs truncate">
                          {parseOrdreDetaljer(order.ordre_detaljer)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-right shrink-0">
                      <div className="text-right leading-none">
                        <p className="font-black text-sm italic leading-none mb-1 text-[#cc5533]">
                          {order.total_pris
                            ? `${Number(order.total_pris).toLocaleString('da-DK')} kr.`
                            : '—'}
                        </p>
                        <p className="text-[8px] font-black text-green-600 uppercase italic tracking-widest leading-none">
                          {order.status === 'modtaget' ? 'Sendt til køkken' : order.status}
                        </p>
                      </div>
                      <div className="text-[9px] font-black text-slate-300 uppercase italic whitespace-nowrap leading-none">
                        {tidLabel}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* HØJRE KOLONNE */}
        <div className="space-y-8">

          {/* MAIT AI INDSIGT */}
          <div className="bg-[#0F172A] rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[400px]">
            <div className="relative z-10">
              <Sparkles className="text-orange-500 mb-6" size={32} />
              <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-4">
                Mait AI Indsigt
              </h3>
              <p className="text-slate-400 text-sm font-medium italic leading-relaxed">
                &ldquo;Dine kunder bestiller 24% oftere tilbehør, når jeg foreslår det efter en pizza-bestilling. Skal vi aktivere flere mersalgs-regler?&rdquo;
              </p>
            </div>
            <div className="relative z-10 space-y-4 mt-12">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-2xl font-black italic text-orange-500 leading-none">{timerSparet}t</p>
                  <p className="text-[9px] font-black uppercase text-slate-500 mt-1 leading-none">Tid sparet</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-2xl font-black italic text-orange-500 leading-none">{alle.length}</p>
                  <p className="text-[9px] font-black uppercase text-slate-500 mt-1 leading-none">Ordrer i alt</p>
                </div>
              </div>
              <button className="w-full bg-white/10 hover:bg-white/20 transition-all py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 italic leading-none text-center">
                Se Ugerapport
              </button>
            </div>
            <Users className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 -rotate-12 pointer-events-none" />
          </div>

          {/* AI LIVE STATUS */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck size={18} className="text-[#cc5533]" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">
                AI Live Status
              </h4>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-end leading-none">
                <div className="leading-none">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 leading-none">Gns. Samtaletid</span>
                  <span className="text-base font-black italic text-slate-900 leading-none">1:24 min</span>
                </div>
                <span className="text-[9px] font-bold text-green-500 uppercase leading-none">-12s</span>
              </div>
              <div className="flex justify-between items-end leading-none">
                <div className="leading-none">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 leading-none">Konvertering</span>
                  <span className="text-base font-black italic text-[#cc5533] leading-none">{konvertering}%</span>
                </div>
                <span className="text-[9px] font-bold text-orange-500 uppercase leading-none">
                  {konvertering >= 80 ? 'Høj' : konvertering >= 50 ? 'Middel' : 'Lav'}
                </span>
              </div>
              <div className="flex justify-between items-end leading-none">
                <div className="leading-none">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 leading-none">Total ordrer</span>
                  <span className="text-base font-black italic text-slate-900 leading-none">{alle.length}</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Alle tider</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
