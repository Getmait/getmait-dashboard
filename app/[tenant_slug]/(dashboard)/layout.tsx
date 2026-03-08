import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant_slug: string }>
}) {
  const { tenant_slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${tenant_slug}/login`)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', tenant_slug)
    .single()

  if (!tenant) redirect(`/${tenant_slug}/login`)

  return (
    <div className="flex min-h-screen">
      <Sidebar tenant={tenant} />
      <div className="flex-1 flex flex-col ml-64">
        <TopBar tenant={tenant} userEmail={user.email ?? ''} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
