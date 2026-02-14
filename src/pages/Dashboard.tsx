import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import UserDashboard from '@/components/dashboard/UserDashboard';

export default function Dashboard() {
  const { role } = useAuth();
  return role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
}
