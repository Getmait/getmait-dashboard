export interface Tenant {
  id: string
  slug: string
  name: string
  phone: string | null
  email: string | null
  plan: 'starter' | 'pro' | 'enterprise'
  is_active: boolean
  cvr: string | null
  address: string | null
  zip_city: string | null
  opening_hours: Record<string, string>
  is_online: boolean
  wait_time: number
  delivery_enabled: boolean
  delivery_price: number
  delivery_time: number
  store_id: number | null
  created_at: string
}

export interface Ordrer {
  id: number
  kunde_tlf: string | null
  ordre_detaljer: string
  total_pris: number | null
  status: string
  oprettet_at: string
  kunde_navn: string | null
  store_id: number | null
  session_id: string | null
  levering: boolean | null
  pris_levering: number | null
  from_number: string | null
  delivery_address: string | null
}

export interface MenuItem {
  id: string
  tenant_id: string
  name: string
  category: string
  description: string
  price: number
  is_active: boolean
  created_at: string
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: 'owner' | 'staff'
  display_name: string | null
  phone: string | null
  created_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type OrderChannel = 'voice' | 'chat'

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  tenant_id: string
  customer_name: string
  customer_phone: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  channel: OrderChannel
  created_at: string
}

export interface SmsCampaign {
  id: string
  tenant_id: string
  message: string
  sent_to_count: number
  sent_at: string | null
  created_at: string
}

export interface Customer {
  id: string
  tenant_id: string
  name: string
  phone: string
  order_count: number
  last_order_at: string | null
  opted_in_sms: boolean
  created_at: string
}
