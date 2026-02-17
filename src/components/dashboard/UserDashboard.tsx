import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('issue_reports').select('*').eq('reported_by', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setIssues(data || []));
  }, [user]);

  const open = issues.filter(i => i.status !== 'resolved').length;
  const inProgress = issues.filter(i => i.status === 'in_progress').length;
  const resolved = issues.filter(i => i.status === 'resolved').length;

  const statCards = [
    { title: 'Total Reports', value: issues.length, icon: FileText, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900', iconBg: 'bg-blue-500', link: '/issues' },
    { title: 'In Progress', value: inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900', iconBg: 'bg-amber-500', link: '/issues' },
    { title: 'Open', value: open, icon: AlertCircle, color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900', iconBg: 'bg-purple-500', link: '/issues' },
    { title: 'Resolved', value: resolved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900', iconBg: 'bg-emerald-500', link: '/issues' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient title-glow tracking-tight">My Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-3 font-medium">Track your submitted IT issues and their status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(s => (
          <Card key={s.title} onClick={() => navigate(s.link)} className={`hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 ${s.bg} overflow-hidden relative cursor-pointer`}>
            <CardContent className="pt-6 pb-6 px-6">
              <div className={`absolute top-0 right-0 w-24 h-24 ${s.iconBg} opacity-10 rounded-full -mr-8 -mt-8`} />
              <div className={`w-14 h-14 rounded-2xl ${s.iconBg} flex items-center justify-center mb-4 shadow-lg`}>
                <s.icon className="w-7 h-7 text-white" />
              </div>
              <p className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer" onClick={() => navigate('/issues')}>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            My Issue Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {issues.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground font-medium">You haven't reported any issues yet.</p>
              <p className="text-base text-muted-foreground mt-2">Go to Issues page to submit a new report.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map(issue => (
                <div key={issue.id} className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-base font-bold text-foreground">{issue.title}</p>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        issue.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                        issue.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' :
                        issue.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {issue.ticket_number} • <span className="capitalize">{issue.category}</span> • {format(parseISO(issue.created_at as string), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${
                    issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                    issue.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {issue.status === 'not_started' ? 'Not Started' : issue.status === 'in_progress' ? 'In Progress' : 'Resolved'}
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
