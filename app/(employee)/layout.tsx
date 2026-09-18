import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'EMPLOYEE') {
    redirect('/login')
  }

  return (
    <AppLayout role="EMPLOYEE" user={session.user}>
      {children}
    </AppLayout>
  )
}