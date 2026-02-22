export interface Tenant {
  id: string
  slug: string
  name: string
  phone: string | null
  email: string | null
  plan: 'starter' | 'pro' | 'enterprise'
  is_active: boolean
  created_at: string
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: 'owner' | 'staff'
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
