import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Ticket, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function UserIssueForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category: 'general', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchIssues();
  }, [user]);

  const fetchIssues = async () => {
    const { data } = await supabase.from('issue_reports').select('*')
      .eq('reported_by', user!.id)
      .order('created_at', { ascending: false });
    setIssues(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('issue_reports').insert({
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      reported_by: user!.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Issue reported successfully', description: 'The IT team will review your request.' });
      setForm({ title: '', description: '', category: 'general', priority: 'medium' });
      fetchIssues();
    }
    setSubmitting(false);
  };

  const downloadTicket = (issue: any) => {
    const content = `
═══════════════════════════════════════
        E-TICKET - ISSUE RESOLVED
═══════════════════════════════════════

Ticket Number: ${issue.ticket_number}
Title: ${issue.title}
Category: ${issue.category}
Priority: ${issue.priority}
Status: ${issue.status.replace('_', ' ')}

Reported: ${format(parseISO(issue.created_at), 'MMM dd, yyyy HH:mm')}
${issue.resolved_at ? `Resolved: ${format(parseISO(issue.resolved_at), 'MMM dd, yyyy HH:mm')}` : ''}

Description:
${issue.description}

${issue.resolution_notes ? `Resolution:\n${issue.resolution_notes}` : ''}

═══════════════════════════════════════
    IT Department - Work Tracker
═══════════════════════════════════════
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${issue.ticket_number}.txt`; a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Report an IT Issue</h1>
        <p className="text-muted-foreground">Submit a computer or IT issue to the IT department</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New Issue Report</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Issue Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of the issue" required />
            </div>
            <div className="space-y-2">
              <Label>Detailed Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue in detail..." rows={4} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={submitting}>
              <Send className="w-4 h-4 mr-2" /> {submitting ? 'Submitting...' : 'Submit Issue'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">My Submitted Issues</CardTitle></CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {issues.map(issue => (
                <div key={issue.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{issue.title}</p>
                      <span className={`status-badge ${
                        issue.status === 'resolved' ? 'bg-success/10 text-success' :
                        issue.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>{issue.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Ticket className="inline w-3 h-3 mr-1" />{issue.ticket_number} • {issue.category} • {format(parseISO(issue.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {issue.status === 'resolved' && (
                    <Button variant="outline" size="sm" onClick={() => downloadTicket(issue)}>
                      <Download className="w-3 h-3 mr-1" /> E-Ticket
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
