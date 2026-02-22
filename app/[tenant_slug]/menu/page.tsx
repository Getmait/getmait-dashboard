'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Search,
  X,
  Trash2,
  Settings,
  UtensilsCrossed,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Truck,
  ToggleLeft,
  ToggleRight,
  Zap,
  Loader2,
} from 'lucide-react'
import type { Tenant, MenuItem } from '@/lib/types'

const CATEGORIES = ['Pizza', 'Pasta', 'Drikkevarer', 'Tilbehør', 'Dessert', 'Andet']

export default function MenuPage() {
  const { tenant_slug } = useParams<{ tenant_slug: string }>()
  const supabase = createClient()

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', category: 'Pizza' })
  const [saving, setSaving] = useState(false)

  // Operationelle indstillinger
  const [isOnline, setIsOnline] = useState(true)
  const [waitTime, setWaitTime] = useState(10)
  const [deliveryEnabled, setDeliveryEnabled] = useState(true)
  const [deliveryPrice, setDeliveryPrice] = useState(29)
  const [deliveryTime, setDeliveryTime] = useState(45)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', tenant_slug)
        .single()

      if (t) {
        setTenant(t)
        setIsOnline(t.is_online ?? true)
        setWaitTime(t.wait_time ?? 10)
        setDeliveryEnabled(t.delivery_enabled ?? true)
        setDeliveryPrice(t.delivery_price ?? 29)
        setDeliveryTime(t.delivery_time ?? 45)

        const { data: items } = await supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', t.id)
          .order('created_at', { ascending: false })

        setMenuItems(items ?? [])
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant_slug])

  const saveSettings = useCallback(async (updates: Partial<Tenant>) => {
    if (!tenant) return
    await supabase.from('tenants').update(updates).eq('id', tenant.id)
  }, [tenant, supabase])

  const filteredMenu = useMemo(() =>
    menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [menuItems, searchTerm])

  async function toggleStatus(id: string, current: boolean) {
    setMenuItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !current } : i))
    await supabase.from('menu_items').update({ is_active: !current }).eq('id', id)
  }

  async function deleteItem(id: string) {
    setMenuItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('menu_items').delete().eq('id', id)
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!tenant || !newItem.name || !newItem.price) return
    setSaving(true)
    const { data } = await supabase
      .from('menu_items')
      .insert({
        tenant_id: tenant.id,
        name: newItem.name.trim(),
        category: newItem.category,
        description: newItem.description.trim(),
        price: parseFloat(newItem.price),
        is_active: true,
      })
      .select()
      .single()

    if (data) setMenuItems(prev => [data, ...prev])
    setNewItem({ name: '', price: '', description: '', category: 'Pizza' })
    setIsAddingItem(false)
    setSaving(false)
  }

  function addStressTime() {
    const newWait = waitTime + 10
    const newDelivery = deliveryEnabled ? deliveryTime + 10 : deliveryTime
    setWaitTime(newWait)
    if (deliveryEnabled) setDeliveryTime(newDelivery)
    saveSettings({ wait_time: newWait, delivery_time: newDelivery })
  }

  function resetTimes() {
    setWaitTime(10)
    setDeliveryTime(45)
    saveSettings({ wait_time: 10, delivery_time: 45 })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">
          Menu-Optimering
        </h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic mt-1">
          Automatiseringen kender din menu – hold den skarp her.
        </p>
      </div>

      {/* Operationelle kontroller */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Ventetid */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-[#cc5533]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Live Ventetid</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-black italic tracking-tighter text-slate-800">
              {waitTime} <span className="text-sm uppercase text-slate-400">min</span>
            </div>
            <button onClick={resetTimes} className="p-2 text-slate-300 hover:text-[#cc5533] transition-colors" title="Nulstil tider">
              <RotateCcw size={16} />
            </button>
          </div>
          <button
            onClick={addStressTime}
            className="w-full bg-orange-50 hover:bg-orange-100 text-[#cc5533] py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 group leading-none"
          >
            <AlertTriangle size={14} className="group-hover:animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">+10 Min Stress</span>
          </button>
        </div>

        {/* Levering */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Levering</span>
            </div>
            <button
              onClick={() => {
                const next = !deliveryEnabled
                setDeliveryEnabled(next)
                saveSettings({ delivery_enabled: next })
              }}
              className={`transition-all ${deliveryEnabled ? 'text-blue-500' : 'text-slate-300'}`}
            >
              {deliveryEnabled ? <ToggleRight size={32} strokeWidth={1.5} /> : <ToggleLeft size={32} strokeWidth={1.5} />}
            </button>
          </div>
          <div className={`space-y-2 transition-all duration-300 ${deliveryEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
              <span className="text-[9px] font-black uppercase text-slate-400 italic">Pris (kr.)</span>
              <input
                type="number"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(parseInt(e.target.value) || 0)}
                onBlur={() => saveSettings({ delivery_price: deliveryPrice })}
                className="bg-transparent text-right text-sm font-black text-slate-800 focus:outline-none w-12"
              />
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
              <span className="text-[9px] font-black uppercase text-slate-400 italic">Tid (min.)</span>
              <input
                type="number"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(parseInt(e.target.value) || 0)}
                onBlur={() => saveSettings({ delivery_time: deliveryTime })}
                className="bg-transparent text-right text-sm font-black text-slate-800 focus:outline-none w-12"
              />
            </div>
            <p className="text-[8px] font-bold uppercase text-slate-400 text-center italic">
              {deliveryEnabled ? 'Levering tilbydes kunder nu' : 'Kun afhentning muligt'}
            </p>
          </div>
        </div>

        {/* Mait AI status */}
        <div className={`rounded-[2rem] p-6 relative overflow-hidden transition-all duration-500 ${isOnline ? 'bg-slate-900 shadow-xl' : 'bg-slate-100 border border-slate-200'}`}>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[10px] font-black italic uppercase tracking-widest ${isOnline ? 'text-white' : 'text-slate-500'}`}>
                  Mait er {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !isOnline
                  setIsOnline(next)
                  saveSettings({ is_online: next })
                }}
                className={`transition-all ${isOnline ? 'text-[#cc5533]' : 'text-slate-300'}`}
              >
                {isOnline ? <ToggleRight size={36} strokeWidth={1.5} /> : <ToggleLeft size={36} strokeWidth={1.5} />}
              </button>
            </div>
            <p className="text-[9px] font-bold uppercase leading-tight text-slate-400 italic">
              {isOnline
                ? 'AI-assistenten besvarer alle opkald og beskeder nu.'
                : 'AI er deaktiveret. Kunder kan ikke bestille digitalt.'}
            </p>
          </div>
          <UtensilsCrossed className="absolute -bottom-8 -right-8 w-32 h-32 opacity-5 -rotate-12" />
        </div>
      </div>

      {/* Tilføj ny ret */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
        {isAddingItem ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-base font-black uppercase italic text-[#cc5533] flex items-center gap-2 leading-none">
                <Plus size={20} /> Tilføj ny ret til AI-hukommelsen
              </h3>
              <button onClick={() => setIsAddingItem(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 italic block leading-none">Navn</label>
                <input
                  required
                  type="text"
                  placeholder="F.eks. Hawaii Pizza"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#cc5533]/30 outline-none italic"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 italic block leading-none">Kategori</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#cc5533]/30 outline-none appearance-none italic"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 italic block leading-none">Pris (kr.)</label>
                <input
                  required
                  type="number"
                  placeholder="85"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#cc5533]/30 outline-none italic"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic hover:bg-[#cc5533] transition-all shadow-xl leading-none disabled:opacity-60"
                >
                  {saving ? 'Gemmer...' : 'Gem Ret Nu'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingItem(true)}
            className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center gap-4 text-slate-400 hover:border-[#cc5533]/40 hover:text-[#cc5533] transition-all group"
          >
            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-orange-50 group-hover:scale-110 transition-all">
              <Plus size={24} />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.25em] italic leading-none">
              Opret nyt produkt i din menu
            </span>
          </button>
        )}
      </div>

      {/* Søgning */}
      <div className="flex gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Søg i dine produkter..."
            className="w-full bg-white border border-slate-200 rounded-[1.5rem] pl-14 pr-6 py-4 text-xs font-bold focus:ring-4 focus:ring-orange-50 outline-none uppercase tracking-widest shadow-sm italic"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Filter size={14} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Alle Kategorier</span>
        </div>
      </div>

      {/* Menu-tabel */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.25em] italic border-b border-slate-100">
                <th className="px-10 py-6">Ret / Beskrivelse</th>
                <th className="px-6 py-6">Kategori</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-6 py-6 text-right">Pris</th>
                <th className="px-10 py-6 text-right">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenu.map((item) => (
                <tr
                  key={item.id}
                  className={`group hover:bg-slate-50/50 transition-all ${!item.is_active ? 'opacity-40 grayscale' : ''}`}
                >
                  <td className="px-10 py-7">
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-black uppercase italic tracking-tighter text-slate-800 leading-none">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 italic max-w-xs truncate">
                        {item.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-7">
                    <span className="text-[10px] font-black uppercase bg-slate-100 px-3 py-1.5 rounded-xl text-slate-500 tracking-widest italic">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-7">
                    <div className="flex items-center gap-3 leading-none">
                      <button
                        onClick={() => toggleStatus(item.id, item.is_active)}
                        className={`transition-all hover:scale-110 ${item.is_active ? 'text-green-500' : 'text-slate-300'}`}
                      >
                        {item.is_active
                          ? <ToggleRight size={44} strokeWidth={1.2} />
                          : <ToggleLeft size={44} strokeWidth={1.2} />}
                      </button>
                      <span className="text-[10px] font-black uppercase italic text-slate-600 tracking-widest">
                        {item.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-7 text-right">
                    <span className="text-lg font-black italic text-[#cc5533] leading-none">
                      {item.price} kr.
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMenu.length === 0 && (
            <div className="py-24 text-center">
              <UtensilsCrossed size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-300 font-black uppercase italic tracking-[0.3em] text-xs">
                {menuItems.length === 0 ? 'Ingen retter tilføjet endnu...' : 'Ingen retter fundet...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mait AI sync-banner */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-8">
          <div className="bg-[#cc5533] p-5 rounded-[1.5rem] shadow-xl animate-pulse text-white">
            <Zap size={32} className="fill-white" />
          </div>
          <div>
            <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-[#cc5533] leading-none">
              Mait AI Opdateres Live
            </h4>
            <p className="text-slate-400 font-medium italic text-sm max-w-xl leading-relaxed">
              Når du deaktiverer en ret eller ændrer prisen her, lærer din Mait-assistent det øjeblikkeligt. Den vil automatisk informere kunderne i telefonen og på chatten – herunder også den aktuelle ventetid på {waitTime} minutter, levering til {deliveryPrice} kr. og en udbringstid på {deliveryTime} minutter.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 text-white">
          <CheckCircle2 size={180} />
        </div>
      </div>

    </div>
  )
}
