import { useAuth } from '@/hooks/useAuth';
import AdminIssues from '@/components/issues/AdminIssues';
import UserIssueForm from '@/components/issues/UserIssueForm';

export default function IssuesPage() {
  const { role } = useAuth();
  return role === 'admin' ? <AdminIssues /> : <UserIssueForm />;
}
