import RequireAuth from '@/routes/require-auth'
import { ROLES } from '@/constants/roles'

export default function AdminGuard() {
  return <RequireAuth role={ROLES.ADMIN} />
}
