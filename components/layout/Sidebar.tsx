'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  MessageSquare,
  Settings,
  Zap,
  Pizza,
  Clock,
  Truck,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  RotateCcw,
  LogOut,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Tenant } from '@/lib/types'

const navItems = (slug: string) => [
  { href: `/${slug}/dashboard`, label: 'Overblik', icon: LayoutDashboard },
  { href: `/${slug}/orders`, label: 'Bestillinger', icon: ShoppingBag },
  { href: `/${slug}/menu`, label: 'Menu', icon: Pizza },
  { href: `/${slug}/customers`, label: 'Kundeklub', icon: Users },
  { href: `/${slug}/sms`, label: 'SMS', icon: MessageSquare },
  { href: `/${slug}/settings`, label: 'Indstillinger', icon: Settings },
]

interface SidebarProps {
  tenant: Tenant
}

export function Sidebar({ tenant }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [isOnline, setIsOnline] = useState(tenant.is_online ?? true)
  const [waitTime, setWaitTime] = useState(tenant.wait_time ?? 10)
  const [deliveryEnabled, setDeliveryEnabled] = useState(tenant.delivery_enabled ?? true)
  const [deliveryPrice, setDeliveryPrice] = useState(tenant.delivery_price ?? 29)
  const [deliveryTime, setDeliveryTime] = useState(tenant.delivery_time ?? 45)

  useEffect(() => {
    setIsOnline(tenant.is_online ?? true)
    setWaitTime(tenant.wait_time ?? 10)
    setDeliveryEnabled(tenant.delivery_enabled ?? true)
    setDeliveryPrice(tenant.delivery_price ?? 29)
    setDeliveryTime(tenant.delivery_time ?? 45)
  }, [tenant])

  async function save(updates: Partial<Tenant>) {
    await supabase.from('tenants').update(updates).eq('id', tenant.id)
  }

  function addStressTime() {
    const newWait = waitTime + 10
    const newDelivery = deliveryEnabled ? deliveryTime + 10 : deliveryTime
    setWaitTime(newWait)
    if (deliveryEnabled) setDeliveryTime(newDelivery)
    save({ wait_time: newWait, delivery_time: newDelivery })
  }

  function resetTimes() {
    setWaitTime(10)
    setDeliveryTime(45)
    save({ wait_time: 10, delivery_time: 45 })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#cc5533] flex items-center justify-center shadow-lg shadow-orange-100 rotate-2">
          <Zap size={18} className="text-white fill-white" />
        </div>
        <div>
          <span className="text-base font-black tracking-tighter uppercase italic text-slate-800 block leading-none">GetMait</span>
          <span className="text-[8px] font-black text-[#cc5533] uppercase tracking-widest">Partner Portal</span>
        </div>
      </div>

      {/* Tenant name */}
      <div className="px-5 py-3 border-b border-slate-100 shrink-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Butik</p>
        <p className="font-bold text-[#1a1a2e] truncate text-sm">{tenant.name}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems(tenant.slug).map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-black uppercase italic tracking-wide transition-all',
                active
                  ? 'bg-[#cc5533]/10 text-[#cc5533] border border-[#cc5533]/10'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-[#1a1a2e]'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Operationelle kontroller */}
      <div className="px-3 pb-3 space-y-2.5 shrink-0 border-t border-slate-100 pt-3">

        {/* Live Ventetid */}
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <Clock size={12} className="text-[#cc5533]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Live Ventetid</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl font-black italic tracking-tighter text-slate-800 leading-none">
              {waitTime} <span className="text-xs uppercase text-slate-400">min</span>
            </div>
            <button
              onClick={resetTimes}
              className="p-1.5 text-slate-300 hover:text-[#cc5533] transition-colors"
              title="Nulstil"
            >
              <RotateCcw size={13} />
            </button>
          </div>
          <button
            onClick={addStressTime}
            className="w-full bg-orange-50 hover:bg-orange-100 text-[#cc5533] py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 group"
          >
            <AlertTriangle size={11} className="group-hover:animate-bounce" />
            <span className="text-[9px] font-black uppercase tracking-widest italic">+10 Min Stress</span>
          </button>
        </div>

        {/* Levering */}
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Truck size={12} className="text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Levering</span>
            </div>
            <button
              onClick={() => {
                const next = !deliveryEnabled
                setDeliveryEnabled(next)
                save({ delivery_enabled: next })
              }}
              className={`transition-all ${deliveryEnabled ? 'text-blue-500' : 'text-slate-300'}`}
            >
              {deliveryEnabled
                ? <ToggleRight size={26} strokeWidth={1.5} />
                : <ToggleLeft size={26} strokeWidth={1.5} />}
            </button>
          </div>
          <div className={`space-y-1.5 transition-all duration-300 ${deliveryEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100">
              <span className="text-[8px] font-black uppercase text-slate-400 italic">Pris (kr.)</span>
              <input
                type="number"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(parseInt(e.target.value) || 0)}
                onBlur={() => save({ delivery_price: deliveryPrice })}
                className="bg-transparent text-right text-xs font-black text-slate-800 focus:outline-none w-10"
              />
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100">
              <span className="text-[8px] font-black uppercase text-slate-400 italic">Tid (min.)</span>
              <input
                type="number"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(parseInt(e.target.value) || 0)}
                onBlur={() => save({ delivery_time: deliveryTime })}
                className="bg-transparent text-right text-xs font-black text-slate-800 focus:outline-none w-10"
              />
            </div>
            <p className="text-[8px] font-bold uppercase text-slate-400 text-center italic">
              {deliveryEnabled ? 'Levering tilbydes kunder nu' : 'Kun afhentning muligt'}
            </p>
          </div>
        </div>

        {/* Mait AI status */}
        <div className={`rounded-[1.5rem] p-4 relative overflow-hidden transition-all duration-500 ${isOnline ? 'bg-slate-900' : 'bg-slate-100 border border-slate-200'}`}>
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-black italic uppercase tracking-widest ${isOnline ? 'text-white' : 'text-slate-500'}`}>
                  Mait er {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !isOnline
                  setIsOnline(next)
                  save({ is_online: next })
                }}
                className={`transition-all ${isOnline ? 'text-[#cc5533]' : 'text-slate-300'}`}
              >
                {isOnline
                  ? <ToggleRight size={28} strokeWidth={1.5} />
                  : <ToggleLeft size={28} strokeWidth={1.5} />}
              </button>
            </div>
            <p className="text-[8px] font-bold uppercase leading-tight text-slate-400 italic">
              {isOnline
                ? 'AI besvarer alle opkald og beskeder.'
                : 'AI deaktiveret. Kunder kan ikke bestille.'}
            </p>
          </div>
          <UtensilsCrossed className="absolute -bottom-6 -right-6 w-20 h-20 opacity-5 -rotate-12" />
        </div>

        {/* Log ud */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[9px] font-black uppercase italic text-slate-300 hover:text-red-500 transition-colors"
        >
          <LogOut size={13} /> Log ud
        </button>

      </div>
    </aside>
  )
}
