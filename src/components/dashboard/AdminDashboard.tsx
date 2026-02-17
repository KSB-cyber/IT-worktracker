import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle, Clock, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalInvoices: 0, pendingInvoices: 0, overdueInvoices: 0, openIssues: 0, resolvedIssues: 0, urgentInvoices: 0, totalAmount: 0 });
  const [recentInvoices, setRecentInvoices] = useState<Array<Record<string, unknown>>>([]);
  const [recentIssues, setRecentIssues] = useState<Array<Record<string, unknown>>>([]);

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
    const totalAmount = invoices.reduce((sum, i) => sum + Number(i.amount), 0);

    setStats({
      totalInvoices: invoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      openIssues: issues.filter(i => i.status !== 'resolved').length,
      resolvedIssues: issues.filter(i => i.status === 'resolved').length,
      urgentInvoices: urgentInvoices.length,
      totalAmount,
    });

    setRecentInvoices(invoices.slice(0, 5));
    setRecentIssues(issues.slice(0, 5));
  };

  const getDaysLeft = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'text-red-600 dark:text-red-400' };
    if (days <= 5) return { text: `${days}d left`, color: 'text-amber-600 dark:text-amber-400' };
    return { text: `${days}d left`, color: 'text-emerald-600 dark:text-emerald-400' };
  };

  const statCards = [
    { title: 'Total Invoices', value: stats.totalInvoices, icon: FileText, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900', iconBg: 'bg-blue-500', link: '/invoices' },
    { title: 'Pending', value: stats.pendingInvoices, icon: Clock, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900', iconBg: 'bg-amber-500', link: '/invoices' },
    { title: 'Overdue', value: stats.overdueInvoices, icon: AlertCircle, color: 'text-red-600', bg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900', iconBg: 'bg-red-500', link: '/invoices' },
    { title: 'Open Issues', value: stats.openIssues, icon: AlertCircle, color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900', iconBg: 'bg-purple-500', link: '/issues' },
    { title: 'Due Soon (≤5d)', value: stats.urgentInvoices, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900', iconBg: 'bg-orange-500', link: '/invoices' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient title-glow tracking-tight">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-3 font-medium">Overview of invoices, issues, and activities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer" onClick={() => navigate('/invoices')}>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-base text-muted-foreground">No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentInvoices.map(inv => {
                  const dl = getDaysLeft(inv.due_date as string);
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="text-base font-bold text-foreground">{inv.vendor_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{inv.invoice_number} • {format(parseISO(inv.due_date as string), 'MMM dd')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-foreground">GH₵{Number(inv.amount).toLocaleString()}</p>
                        <p className={`text-sm font-bold ${dl.color}`}>{dl.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer" onClick={() => navigate('/issues')}>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentIssues.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-base text-muted-foreground">No issues reported</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentIssues.map(issue => (
                  <div key={issue.id} className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="text-base font-bold text-foreground">{issue.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="capitalize">{issue.category}</span> • 
                        <span className="capitalize ml-1">{issue.priority} priority</span>
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
    </div>
  );
}
