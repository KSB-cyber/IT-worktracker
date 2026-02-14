import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('issue_reports').select('*').eq('reported_by', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setIssues(data || []));
  }, [user]);

  const open = issues.filter(i => i.status !== 'resolved').length;
  const resolved = issues.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground">Track your submitted IT issues</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <AlertCircle className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{issues.length}</p>
            <p className="text-xs text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <Clock className="w-5 h-5 text-warning mb-2" />
            <p className="text-2xl font-bold text-foreground">{open}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <CheckCircle className="w-5 h-5 text-success mb-2" />
            <p className="text-2xl font-bold text-foreground">{resolved}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">My Issues</CardTitle></CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't reported any issues yet.</p>
          ) : (
            <div className="space-y-3">
              {issues.map(issue => (
                <div key={issue.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{issue.ticket_number} • {issue.category}</p>
                  </div>
                  <span className={`status-badge ${
                    issue.status === 'resolved' ? 'bg-success/10 text-success' :
                    issue.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
