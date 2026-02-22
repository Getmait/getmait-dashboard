'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(
    error === 'unauthorized' ? 'Du har ikke adgang til denne butik.' : ''
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLoginError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setLoginError('Forkert email eller adgangskode.')
      setLoading(false)
      return
    }

    if (redirectTo) {
      router.push(redirectTo)
      return
    }

    // Find tenant for this user and redirect
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) return

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenants!inner(slug)')
      .eq('user_id', session.session.user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slug = (tenantUser?.tenants as any)?.slug as string | undefined
    if (slug) {
      router.push(`/${slug}/dashboard`)
    } else {
      setLoginError('Din konto er ikke tilknyttet en butik.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-[#cc5533] flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-black text-[#1a1a2e] tracking-tight">GetMait</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-black text-[#1a1a2e] mb-1">Log ind</h2>
          <p className="text-sm text-slate-400 mb-6">Adgang til dit dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Email
              </Label>
              <Input
                type="email"
                placeholder="din@email.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-2xl border-slate-200 focus:border-[#cc5533] focus:ring-[#cc5533]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Adgangskode
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-2xl border-slate-200 focus:border-[#cc5533] focus:ring-[#cc5533]/20"
              />
            </div>

            {loginError && (
              <p className="text-sm text-red-500 font-medium bg-red-50 rounded-2xl px-4 py-2.5">
                {loginError}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-6 bg-[#cc5533] hover:bg-[#b34929] text-white font-black text-sm tracking-wide"
            >
              {loading ? 'Logger ind...' : 'Log ind'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by GetMait © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
