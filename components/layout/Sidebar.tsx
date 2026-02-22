'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  MessageSquare,
  Settings,
  Zap,
  Pizza,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-[#cc5533] flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-black text-[#1a1a2e] tracking-tight">GetMait</span>
      </div>

      {/* Tenant name */}
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          Butik
        </p>
        <p className="font-bold text-[#1a1a2e] truncate">{tenant.name}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems(tenant.slug).map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all',
                active
                  ? 'bg-[#cc5533]/10 text-[#cc5533]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#1a1a2e]'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge */}
      <div className="px-6 py-5 border-t border-slate-100">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#cc5533]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#cc5533] animate-pulse" />
          {tenant.plan}
        </span>
      </div>
    </aside>
  )
}
