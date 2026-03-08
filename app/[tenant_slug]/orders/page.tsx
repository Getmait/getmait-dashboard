import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ShoppingBag,
  Clock,
  TrendingUp,
  Coins,
  User,
  Truck,
  MapPin,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import type { Ordrer } from '@/lib/types'

function parseOrdreDetaljer(raw: string): string {
  try {
    const items = JSON.parse(raw)
    if (Array.isArray(items)) {
      return items
        .map((i: { antal?: number; navn?: string }) => `${i.antal ?? 1}x ${i.navn ?? '?'}`)
        .join(', ')
    }
  } catch { /* ikke JSON */ }
  return raw
}


export default async function OrdersPage({
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

  const { data: ordrer } = await supabase
    .from('ordrer')
    .select('*')
    .eq('store_id', tenant.store_id)
    .order('oprettet_at', { ascending: false })

  const alle = (ordrer ?? []) as Ordrer[]
  const now = new Date()

  const maanedStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const maanedOrdrer = alle.filter((o) => o.oprettet_at >= maanedStart)
  const omsaetning = maanedOrdrer.reduce((sum, o) => sum + Number(o.total_pris ?? 0), 0)
  const iDagStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const iDag = alle.filter((o) => o.oprettet_at >= iDagStart).length

  const stats = [
    {
      label: 'Ordrer i dag',
      value: String(iDag),
      icon: ShoppingBag,
      sub: 'Seneste 24 timer',
    },
    {
      label: 'Ordrer denne måned',
      value: String(maanedOrdrer.length),
      icon: TrendingUp,
      sub: `${alle.length} i alt`,
    },
    {
      label: 'Omsætning (måned)',
      value: `${omsaetning.toLocaleString('da-DK')} kr.`,
      icon: Coins,
      sub: 'Via Mait',
    },
    {
      label: 'Gns. ordreværdi',
      value: maanedOrdrer.length > 0
        ? `${Math.round(omsaetning / maanedOrdrer.length)} kr.`
        : '—',
      icon: Clock,
      sub: 'Denne måned',
    },
  ]

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">
          Bestillinger
        </h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 leading-none">
          Alle ordrer modtaget via Mait AI
        </p>
      </div>

      {/* KPI KORT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-[#ea580c] transition-all">
                <stat.icon size={22} />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">
              {stat.label}
            </p>
            <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none mb-1">
              {stat.value}
            </h3>
            <p className="text-[9px] font-bold text-slate-300 uppercase italic leading-none">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ORDRELISTE */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="bg-slate-100 p-3 rounded-2xl text-slate-400">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black italic uppercase leading-none mb-1">
              Alle Bestillinger
            </h3>
            <p className="text-[9px] font-bold text-slate-300 uppercase italic leading-none">
              {alle.length} ordre{alle.length !== 1 ? 'r' : ''} i alt
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-slate-100">
                <th className="px-8 py-5">Kunde</th>
                <th className="px-6 py-5">Bestilling</th>
                <th className="px-6 py-5">Levering / Adresse</th>
                <th className="px-6 py-5 text-right">Beløb</th>
                <th className="px-8 py-5 text-right">Tidspunkt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {alle.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-300 font-semibold italic">
                    Ingen bestillinger endnu
                  </td>
                </tr>
              )}
              {alle.map((order) => {
                const dato = new Date(order.oprettet_at)
                const diffMin = Math.round((now.getTime() - dato.getTime()) / 60000)
                const tidLabel =
                  diffMin < 2
                    ? 'Lige nu'
                    : diffMin < 60
                    ? `${diffMin} min siden`
                    : format(dato, 'd. MMM HH:mm', { locale: da })

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-[#ea580c] transition-colors shrink-0">
                          <User size={18} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-black uppercase italic text-slate-800 leading-none">
                            {order.kunde_navn ?? order.kunde_tlf ?? 'Anonym'}
                          </span>
                          {order.kunde_tlf && order.kunde_navn && (
                            <span className="text-[10px] font-bold text-slate-400 leading-none">
                              {order.kunde_tlf}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      <p className="text-[11px] font-bold text-slate-500 italic leading-snug truncate">
                        {parseOrdreDetaljer(order.ordre_detaljer)}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {order.levering ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg leading-none w-fit">
                            <Truck size={11} /> Levering
                          </span>
                          {order.delivery_address && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 italic leading-none">
                              <MapPin size={10} className="shrink-0" />
                              {order.delivery_address}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg leading-none">
                          Afhentning
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-black italic text-[#ea580c] leading-none">
                        {order.total_pris
                          ? `${Number(order.total_pris).toLocaleString('da-DK')} kr.`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-[9px] font-black text-slate-300 uppercase italic whitespace-nowrap leading-none">
                        {tidLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* FOOTER */}
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white flex items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="bg-[#ea580c] p-4 rounded-2xl shadow-lg shrink-0">
          <CheckCircle2 size={24} className="text-white" />
        </div>
        <div>
          <h4 className="text-base font-black uppercase italic tracking-tighter mb-1 text-orange-500 leading-none">
            Automatisk Ordrestyring
          </h4>
          <p className="text-slate-400 font-medium italic text-xs max-w-lg leading-relaxed">
            Alle bestillinger herover er modtaget og håndteret af Mait AI — uden at du behøvede at løfte en finger.
          </p>
        </div>
        <div className="absolute bottom-0 right-0 p-8 opacity-5 rotate-12 pointer-events-none">
          <ShoppingBag size={120} />
        </div>
      </div>

    </div>
  )
}
