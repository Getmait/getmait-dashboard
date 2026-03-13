'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  Utensils,
  Lock,
  Store,
  ShieldCheck,
  User,
  Mail,
  Phone,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  MapPin,
  Hash,
  Clock,
  Building2,
  Settings,
  ShieldAlert,
} from 'lucide-react'
import type { Tenant, TenantUser } from '@/lib/types'

type Tab = 'profile' | 'business' | 'security'

const DEFAULT_OPENING_HOURS: Record<string, string> = {
  mandag: '11:00 - 21:00',
  tirsdag: '11:00 - 21:00',
  onsdag: '11:00 - 21:00',
  torsdag: '11:00 - 21:00',
  fredag: '11:00 - 22:00',
  lørdag: '12:00 - 22:00',
  søndag: '12:00 - 21:00',
}

export default function SettingsPage() {
  const params = useParams()
  const tenantSlug = params.tenant_slug as string

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null)
  const [saveMessage, setSaveMessage] = useState('')

  // Tenant data
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null)
  const [authEmail, setAuthEmail] = useState('')

  // Profile form
  const [profileData, setProfileData] = useState({ displayName: '', phone: '' })

  // Business form
  const [businessData, setBusinessData] = useState({
    name: '',
    cvr: '',
    address: '',
    zipCity: '',
  })
  const [openingHours, setOpeningHours] = useState<Record<string, string>>(DEFAULT_OPENING_HOURS)

  // Security form
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })

  // Fetch data on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAuthEmail(user.email ?? '')

      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', tenantSlug)
        .single()

      if (t) {
        setTenant(t as Tenant)
        setBusinessData({
          name: t.name ?? '',
          cvr: t.cvr ?? '',
          address: t.address ?? '',
          zipCity: t.zip_city ?? '',
        })
        setOpeningHours(
          t.opening_hours && Object.keys(t.opening_hours).length > 0
            ? t.opening_hours
            : DEFAULT_OPENING_HOURS
        )
      }

      const { data: tu } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (tu) {
        setTenantUser(tu as TenantUser)
        setProfileData({
          displayName: tu.display_name ?? '',
          phone: tu.phone ?? '',
        })
      }
    }
    load()
  }, [tenantSlug])

  function showSuccess(msg: string) {
    setSaveStatus('success')
    setSaveMessage(msg)
    setTimeout(() => setSaveStatus(null), 3000)
  }

  function showError(msg: string) {
    setSaveStatus('error')
    setSaveMessage(msg)
    setTimeout(() => setSaveStatus(null), 4000)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantUser) return
    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('tenant_users')
      .update({ display_name: profileData.displayName, phone: profileData.phone })
      .eq('id', tenantUser.id)
    setIsSaving(false)
    if (error) showError('Noget gik galt. Prøv igen.')
    else showSuccess('Profil opdateret')
  }

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault()
    if (!tenant) return
    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('tenants')
      .update({
        name: businessData.name,
        cvr: businessData.cvr,
        address: businessData.address,
        zip_city: businessData.zipCity,
        opening_hours: openingHours,
      })
      .eq('id', tenant.id)
    setIsSaving(false)
    if (error) showError('Noget gik galt. Prøv igen.')
    else {
      setTenant((prev) => prev ? { ...prev, ...businessData, zip_city: businessData.zipCity, opening_hours: openingHours } : prev)
      showSuccess('Butiksinfo opdateret')
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      showError('De nye adgangskoder matcher ikke.')
      return
    }
    if (passwords.new.length < 8) {
      showError('Adgangskoden skal være mindst 8 tegn.')
      return
    }
    setIsSaving(true)
    const supabase = createClient()

    // Re-authenticate with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: passwords.current,
    })
    if (signInError) {
      setIsSaving(false)
      showError('Nuværende adgangskode er forkert.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    setIsSaving(false)
    if (error) showError('Noget gik galt. Prøv igen.')
    else {
      setPasswords({ current: '', new: '', confirm: '' })
      showSuccess('Adgangskode opdateret')
    }
  }

  const displayName = profileData.displayName || authEmail.split('@')[0] || 'U'
  const initial = displayName.charAt(0).toUpperCase()

  const inputClass =
    'w-full bg-slate-50 border-2 border-transparent rounded-[2rem] py-6 pl-16 pr-8 text-sm font-bold focus:border-[#ea580c]/20 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-900'

  const labelClass =
    'text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic leading-none block'

  const iconWrap =
    'absolute inset-y-0 left-6 flex items-center text-slate-300 group-focus-within/input:text-[#ea580c] transition-colors pointer-events-none'

  const submitBtn =
    'bg-slate-900 text-white px-10 py-6 rounded-[2.2rem] font-black uppercase italic text-xs tracking-[0.2em] shadow-xl hover:bg-[#ea580c] active:scale-95 transition-all flex items-center gap-3 min-w-[200px] justify-center leading-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-slate-900 disabled:hover:scale-100'

  return (
    <div className="min-h-full text-slate-900 pb-16">

      {/* Atmosfærisk baggrund */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ea580c]/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100 mb-1">
            <Settings size={14} className="text-[#ea580c]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Indstillinger</span>
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            Min <span className="text-[#ea580c]">Konto</span>
          </h1>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-[2rem] border border-white shadow-sm overflow-x-auto max-w-full">
          {(['profile', 'business', 'security'] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              profile: 'Personlig Profil',
              business: 'Min Butik',
              security: 'Sikkerhed',
            }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Venstre: Profil-kort */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] border border-slate-50 relative overflow-hidden group text-center">
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 bg-slate-100 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-xl">
                  <span className="text-4xl font-black italic text-slate-400">{initial}</span>
                </div>
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                {displayName}
              </h3>
              <p className="text-[#ea580c] font-bold text-[10px] uppercase tracking-[0.2em] mt-2 italic">
                {tenant?.name ?? ''}
              </p>

              <div className="w-full border-t border-slate-50 mt-8 pt-8 space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase italic leading-none">Abonnement</p>
                    <p className="text-xs font-bold text-green-600 leading-none mt-1 uppercase italic">
                      {tenant?.plan === 'starter' ? 'Starter' : tenant?.plan === 'pro' ? 'Pro' : 'Enterprise'}
                    </p>
                  </div>
                </div>
                {businessData.cvr && (
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <Hash size={16} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase italic leading-none">CVR Nummer</p>
                      <p className="text-xs font-bold text-slate-700 leading-none mt-1">{businessData.cvr}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Utensils className="absolute -bottom-10 -left-10 text-slate-50 w-48 h-48 -rotate-12 opacity-50 pointer-events-none" />
          </div>

          {/* Sikkerhedsboks — kun vist på sikkerhed-fane */}
          {activeTab === 'security' && (
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-orange-400">
                  <ShieldAlert size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">Ekspertråd</span>
                </div>
                <p className="text-sm font-medium italic text-slate-300 leading-relaxed">
                  Vælg en adgangskode med mindst 12 tegn, inklusiv tal og symboler, for at sikre dit dashboard bedst muligt.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Højre: Formularer */}
        <div className="lg:col-span-8">
          <div className="bg-white p-8 md:p-12 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.06)] border border-slate-50 relative min-h-[560px]">

            {/* ─── TAB: PERSONLIG PROFIL ─── */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-50 rounded-lg text-[#ea580c]"><User size={20} /></div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Personlig Profil</h2>
                </div>
                <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className={labelClass}>Dit Navn</label>
                    <div className="relative group/input">
                      <div className={iconWrap}><User size={20} /></div>
                      <input
                        type="text"
                        placeholder="Fornavn Efternavn"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData((p) => ({ ...p, displayName: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Privat Telefon</label>
                    <div className="relative group/input">
                      <div className={iconWrap}><Phone size={20} /></div>
                      <input
                        type="tel"
                        placeholder="12 34 56 78"
                        value={profileData.phone}
                        onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={labelClass}>Login Email</label>
                    <div className="relative group/input">
                      <div className={iconWrap}><Mail size={20} /></div>
                      <input
                        type="email"
                        value={authEmail}
                        disabled
                        className={`${inputClass} opacity-50 cursor-not-allowed`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic ml-2">Email skiftes under Sikkerhed</p>
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" disabled={isSaving} className={submitBtn}>
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <>GEM PROFIL <ChevronRight size={18} /></>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─── TAB: MIN BUTIK ─── */}
            {activeTab === 'business' && (
              <div className="space-y-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg text-[#ea580c]"><Store size={20} /></div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Forretningsinfo</h2>
                </div>
                <form onSubmit={handleSaveBusiness} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className={labelClass}>Pizzaria Navn</label>
                      <div className="relative group/input">
                        <div className={iconWrap}><Building2 size={20} /></div>
                        <input
                          type="text"
                          value={businessData.name}
                          onChange={(e) => setBusinessData((b) => ({ ...b, name: e.target.value }))}
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>CVR Nummer</label>
                      <div className="relative group/input">
                        <div className={iconWrap}><Hash size={20} /></div>
                        <input
                          type="text"
                          placeholder="12345678"
                          value={businessData.cvr}
                          onChange={(e) => setBusinessData((b) => ({ ...b, cvr: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Vej & Nr.</label>
                      <div className="relative group/input">
                        <div className={iconWrap}><MapPin size={20} /></div>
                        <input
                          type="text"
                          placeholder="Hovedgaden 1"
                          value={businessData.address}
                          onChange={(e) => setBusinessData((b) => ({ ...b, address: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Postnr. & By</label>
                      <div className="relative group/input">
                        <div className={iconWrap}><MapPin size={20} /></div>
                        <input
                          type="text"
                          placeholder="1234 København"
                          value={businessData.zipCity}
                          onChange={(e) => setBusinessData((b) => ({ ...b, zipCity: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Åbningstider */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-[#ea580c]" />
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Åbningstider</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                      {Object.entries(openingHours).map(([dag, tid], i, arr) => (
                        <div
                          key={dag}
                          className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                        >
                          <span className="text-[10px] font-black uppercase text-slate-400 italic capitalize">{dag}</span>
                          <input
                            type="text"
                            value={tid}
                            onChange={(e) => setOpeningHours((h) => ({ ...h, [dag]: e.target.value }))}
                            className="bg-transparent text-right text-xs font-bold text-slate-700 focus:text-[#ea580c] outline-none w-32"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={isSaving} className={submitBtn}>
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <>GEM BUTIKSINFO <ChevronRight size={18} /></>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─── TAB: SIKKERHED ─── */}
            {activeTab === 'security' && (
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-50 rounded-2xl text-[#ea580c]"><KeyRound size={24} /></div>
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Sikkerhed</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Skift din adgangskode herunder</p>
                  </div>
                </div>
                <form onSubmit={handleSavePassword} className="max-w-md space-y-8">
                  <div className="space-y-2">
                    <label className={labelClass}>Nuværende adgangskode</label>
                    <div className="relative group/input">
                      <div className={iconWrap}><Lock size={20} /></div>
                      <input
                        required
                        type="password"
                        placeholder="••••••••"
                        value={passwords.current}
                        onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Ny adgangskode</label>
                    <div className="relative group/input">
                      <div className={iconWrap}><Lock size={20} /></div>
                      <input
                        required
                        type="password"
                        placeholder="Min. 8 tegn"
                        value={passwords.new}
                        onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Bekræft ny adgangskode</label>
                    <div className="relative group/input">
                      <div className={iconWrap}><Lock size={20} /></div>
                      <input
                        required
                        type="password"
                        placeholder="Gentag ny kode"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="pt-2 space-y-6">
                    <button type="submit" disabled={isSaving} className={`${submitBtn} min-w-[260px]`}>
                      {isSaving ? <Loader2 className="animate-spin" size={20} /> : <>OPDATER ADGANGSKODE <ChevronRight size={20} /></>}
                    </button>
                    <div className="p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100 flex items-start gap-4 max-w-lg">
                      <AlertCircle size={20} className="text-[#ea580c] shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                        Når du skifter din adgangskode, vil du blive logget ud af alle andre aktive enheder.
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Toast feedback */}
            {saveStatus && (
              <div
                className={`absolute bottom-8 right-8 flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] border shadow-2xl z-30 ${
                  saveStatus === 'success'
                    ? 'bg-white border-green-100 shadow-green-100/50'
                    : 'bg-white border-red-100 shadow-red-100/50'
                }`}
              >
                {saveStatus === 'success' ? (
                  <div className="bg-green-500 text-white p-1 rounded-full"><CheckCircle2 size={14} /></div>
                ) : (
                  <AlertCircle size={18} className="text-red-500" />
                )}
                <span
                  className={`text-[11px] font-black uppercase italic tracking-widest leading-none ${
                    saveStatus === 'success' ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {saveMessage}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 flex flex-col items-center space-y-4 text-center opacity-30">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#ea580c]" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Sikker datahåndtering</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest italic">Support: help@getmait.dk</span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-black uppercase tracking-widest italic">+45 21 74 98 72</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-[0.5em] italic">GetMait Partner Portal</span>
          <Sparkles size={9} className="text-[#ea580c]" />
        </div>
      </footer>
    </div>
  )
}
