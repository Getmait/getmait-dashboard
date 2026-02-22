'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/lib/hooks/useTenant'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Tenant } from '@/lib/types'

export default function SettingsPage() {
  const { tenant, loading } = useTenant()
  const [form, setForm] = useState<Partial<Tenant>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (tenant) setForm({ name: tenant.name, phone: tenant.phone ?? '', email: tenant.email ?? '' })
  }, [tenant])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!tenant) return
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('tenants')
      .update({ name: form.name, phone: form.phone, email: form.email })
      .eq('id', tenant.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <Skeleton className="h-96 w-full max-w-lg rounded-3xl" />

  return (
    <div className="max-w-lg space-y-6">
      <Card className="border-0 shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base font-black text-[#1a1a2e]">Butiksprofil</CardTitle>
          <p className="text-sm text-slate-400">Opdater dine kontaktoplysninger</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Butiksnavn
              </Label>
              <Input
                value={form.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-2xl border-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Telefon
              </Label>
              <Input
                value={form.phone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-2xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Email
              </Label>
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-2xl border-slate-200"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full px-6 bg-[#cc5533] hover:bg-[#b34929] text-white font-bold"
              >
                {saving ? 'Gemmer...' : saved ? '✓ Gemt!' : 'Gem ændringer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Read-only info */}
      <Card className="border-0 shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base font-black text-[#1a1a2e]">Kontoinfo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-500">Slug</span>
            <code className="text-[#cc5533] font-mono">{tenant?.slug}</code>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-500">Plan</span>
            <span className="font-bold uppercase text-[#1a1a2e]">{tenant?.plan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-500">Status</span>
            <span className={`font-bold ${tenant?.is_active ? 'text-green-600' : 'text-red-500'}`}>
              {tenant?.is_active ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
