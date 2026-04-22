'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'
import type { Tenant } from '@/lib/types'

const LABELS: Record<string, string> = {
  dashboard: 'Overblik',
  orders: 'Bestillinger',
  customers: 'Kundeklub',
  sms: 'SMS Kampagner',
  settings: 'Indstillinger',
}

interface TopBarProps {
  tenant: Tenant
  userEmail: string
}

export function TopBar({ tenant, userEmail }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const tenantSlug = pathname.split('/')[1]
  const segment = pathname.split('/').pop() ?? 'dashboard'
  const pageLabel = LABELS[segment] ?? segment

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {tenant.name}
        </p>
        <h1 className="text-lg font-black text-[#1a1a2e] leading-tight">{pageLabel}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="w-9 h-9 cursor-pointer">
            <AvatarFallback className="bg-[#cc5533]/10 text-[#cc5533] font-black text-sm">
              {userEmail.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => router.push(`/${tenantSlug}/settings`)}
          >
            <User size={14} /> Profil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
            onClick={handleSignOut}
          >
            <LogOut size={14} /> Log ud
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
