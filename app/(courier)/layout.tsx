import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COURIER') {
    redirect('/login')
  }

  return (
    <AppLayout role="COURIER" user={session.user}>
      {children}
    </AppLayout>
  )
}