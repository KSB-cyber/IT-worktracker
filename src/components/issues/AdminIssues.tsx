import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Ticket } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AdminIssues() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [resolveDialog, setResolveDialog] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => { fetchIssues(); }, []);

  const fetchIssues = async () => {
    const { data: issueData } = await supabase.from('issue_reports').select('*')
      .order('created_at', { ascending: false });
    
    if (issueData && issueData.length > 0) {
      const userIds = [...new Set(issueData.map(i => i.reported_by))];
      const { data: profileData } = await supabase.from('profiles').select('user_id, full_name, email')
        .in('user_id', userIds);
      
      const profileMap = new Map((profileData || []).map(p => [p.user_id, p]));
      setIssues(issueData.map(i => ({ ...i, reporter: profileMap.get(i.reported_by) })));
    } else {
      setIssues([]);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      updates.resolution_notes = resolutionNotes;
    }
    await supabase.from('issue_reports').update(updates).eq('id', id);
    setResolveDialog(null);
    setResolutionNotes('');
    toast({ title: `Issue marked as ${status.replace('_', ' ')}` });
    fetchIssues();
  };

  const downloadReport = () => {
    const header = 'Ticket,Title,Category,Priority,Status,Reported By,Created,Resolved\n';
    const rows = issues.map(i => {
      const reporter = i.reporter ? `${i.reporter.full_name || i.reporter.email}` : 'Unknown';
      return `"${i.ticket_number}","${i.title}","${i.category}","${i.priority}","${i.status}","${reporter}","${i.created_at}","${i.resolved_at || ''}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'issue-reports.csv'; a.click();
  };

  const filtered = issues.filter(i => filter === 'all' || i.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Issue Reports</h1>
          <p className="text-muted-foreground">Manage user-reported IT issues</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadReport}>
          <Download className="w-4 h-4 mr-2" /> Download Report
        </Button>
      </div>

      <div className="flex gap-2">
        {['all', 'not_started', 'in_progress', 'resolved'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No issues found</CardContent></Card>
        ) : filtered.map(issue => (
          <Card key={issue.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4 px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{issue.title}</h3>
                    <span className={`status-badge ${
                      issue.priority === 'critical' ? 'bg-destructive/10 text-destructive' :
                      issue.priority === 'high' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>{issue.priority}</span>
                    <span className={`status-badge ${
                      issue.status === 'resolved' ? 'bg-success/10 text-success' :
                      issue.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>{issue.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Ticket className="inline w-3 h-3 mr-1" />{issue.ticket_number} •
                    {' '}{issue.category} •
                    {' '}Reported by: {issue.reporter?.full_name || issue.reporter?.email || 'Unknown'} •
                    {' '}{format(parseISO(issue.created_at), 'MMM dd, yyyy')}
                  </p>
                  {issue.resolution_notes && (
                    <p className="text-sm text-success mt-2">Resolution: {issue.resolution_notes}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {issue.status !== 'in_progress' && issue.status !== 'resolved' && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(issue.id, 'in_progress')}>
                      Start
                    </Button>
                  )}
                  {issue.status !== 'resolved' && (
                    <Button variant="default" size="sm" onClick={() => setResolveDialog(issue.id)}>
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Issue</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} placeholder="Describe the resolution..." />
            </div>
            <Button className="w-full" onClick={() => resolveDialog && updateStatus(resolveDialog, 'resolved')}>
              Mark as Resolved & Issue E-Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
