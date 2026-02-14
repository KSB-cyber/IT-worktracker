import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalInvoices: 0, pendingInvoices: 0, overdueInvoices: 0, openIssues: 0, resolvedIssues: 0, urgentInvoices: 0 });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [invoicesRes, issuesRes] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('issue_reports').select('*').order('created_at', { ascending: false }),
    ]);

    const invoices = invoicesRes.data || [];
    const issues = issuesRes.data || [];
    const today = new Date();

    const pendingInvoices = invoices.filter(i => i.status === 'pending');
    const overdueInvoices = invoices.filter(i => {
      const daysLeft = differenceInDays(parseISO(i.due_date), today);
      return daysLeft < 0 && i.status !== 'paid';
    });
    const urgentInvoices = invoices.filter(i => {
      const daysLeft = differenceInDays(parseISO(i.due_date), today);
      return daysLeft >= 0 && daysLeft <= 5 && i.status !== 'paid';
    });

    setStats({
      totalInvoices: invoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      openIssues: issues.filter(i => i.status !== 'resolved').length,
      resolvedIssues: issues.filter(i => i.status === 'resolved').length,
      urgentInvoices: urgentInvoices.length,
    });

    setRecentInvoices(invoices.slice(0, 5));
    setRecentIssues(issues.slice(0, 5));
  };

  const getDaysLeft = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'text-destructive' };
    if (days <= 5) return { text: `${days}d left`, color: 'text-warning' };
    return { text: `${days}d left`, color: 'text-success' };
  };

  const statCards = [
    { title: 'Total Invoices', value: stats.totalInvoices, icon: FileText, color: 'text-primary' },
    { title: 'Pending', value: stats.pendingInvoices, icon: Clock, color: 'text-warning' },
    { title: 'Overdue', value: stats.overdueInvoices, icon: AlertCircle, color: 'text-destructive' },
    { title: 'Open Issues', value: stats.openIssues, icon: AlertCircle, color: 'text-info' },
    { title: 'Resolved Issues', value: stats.resolvedIssues, icon: CheckCircle, color: 'text-success' },
    { title: 'Due Soon (≤5d)', value: stats.urgentInvoices, icon: Clock, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of invoices, issues, and activities</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(s => (
          <Card key={s.title}>
            <CardContent className="pt-5 pb-4 px-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Invoices</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            ) : recentInvoices.map(inv => {
              const dl = getDaysLeft(inv.due_date);
              return (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.vendor_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">${Number(inv.amount).toLocaleString()}</p>
                    <p className={`text-xs font-medium ${dl.color}`}>{dl.text}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Issues</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues reported</p>
            ) : recentIssues.map(issue => (
              <div key={issue.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{issue.title}</p>
                  <p className="text-xs text-muted-foreground">{issue.category} • {issue.priority}</p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
