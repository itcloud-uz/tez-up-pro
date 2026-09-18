import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role as string

  switch (role) {
    case 'ADMIN':
      redirect('/admin')
    case 'EMPLOYEE':
      redirect('/employee')
    case 'COURIER':
      redirect('/courier')
    case 'CUSTOMER':
      redirect('/market')
    default:
      redirect('/login')
  }
}