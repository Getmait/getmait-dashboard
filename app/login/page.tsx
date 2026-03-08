'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  Utensils,
  Lock,
  Store,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) return

    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select('tenants!inner(slug)')
      .eq('user_id', session.session.user.id)
      .limit(1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slug = (tenantUsers?.[0]?.tenants as any)?.slug as string | undefined
    if (slug) {
      router.push(`/${slug}/dashboard`)
    } else {
      setLoginError('Din konto er ikke tilknyttet en butik.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden relative">

      {/* Atmosfærisk baggrund */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#cc5533]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">

        {/* Logo & branding */}
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="bg-[#cc5533] p-4 rounded-3xl text-white shadow-2xl shadow-orange-200 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Sparkles size={32} strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Get<span className="text-[#cc5533]">Mait</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2 italic">
              Dashboard-adgang
            </p>
          </div>
        </div>

        {/* Login kort */}
        <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.06)] border border-slate-50 relative group overflow-hidden">

          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
                Velkommen tilbage
              </h2>
              <p className="text-slate-400 font-medium italic text-sm">
                Log ind for at administrere din butik
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic leading-none block">
                  Email
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-6 flex items-center text-slate-300 group-focus-within/input:text-[#cc5533] transition-colors pointer-events-none">
                    <Store size={20} />
                  </div>
                  <input
                    required
                    type="email"
                    placeholder="din@email.dk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] py-6 pl-16 pr-8 text-sm font-bold focus:border-[#cc5533]/20 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-900"
                  />
                </div>
              </div>

              {/* Adgangskode */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic leading-none block">
                    Adgangskode
                  </label>
                  <button
                    type="button"
                    className="text-[9px] font-black uppercase tracking-widest text-[#cc5533] hover:underline italic"
                  >
                    Glemt koden?
                  </button>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-6 flex items-center text-slate-300 group-focus-within/input:text-[#cc5533] transition-colors pointer-events-none">
                    <Lock size={20} />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] py-6 pl-16 pr-16 text-sm font-bold focus:border-[#cc5533]/20 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-6 flex items-center text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Fejl */}
              {loginError && (
                <p className="text-sm text-red-500 font-medium bg-red-50 rounded-2xl px-4 py-3 italic">
                  {loginError}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black uppercase italic text-sm tracking-[0.2em] shadow-2xl hover:bg-[#cc5533] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group/btn relative overflow-hidden leading-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                {loading ? (
                  'Logger ind...'
                ) : (
                  <>
                    LOG IND PÅ DASHBOARD
                    <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Dekorativt baggrundselement */}
          <Utensils className="absolute -bottom-10 -right-10 text-slate-50 w-64 h-64 -rotate-12 pointer-events-none opacity-50 group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Trust & footer */}
        <div className="mt-12 flex flex-col items-center space-y-6 text-center">
          <div className="flex items-center gap-10 opacity-40">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#cc5533]" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Sikkert Log-ind</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">
              Support: help@getmait.dk
            </span>
          </div>
          <div className="opacity-20 flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] italic">
              Powered by GetMait Intelligence
            </span>
            <Sparkles size={10} className="text-[#cc5533]" />
          </div>
        </div>

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
