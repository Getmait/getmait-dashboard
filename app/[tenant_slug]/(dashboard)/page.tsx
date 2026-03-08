import { redirect } from 'next/navigation'

export default async function TenantRoot({
  params,
}: {
  params: Promise<{ tenant_slug: string }>
}) {
  const { tenant_slug } = await params
  redirect(`/${tenant_slug}/orders`)
}
