import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

export default function AdminReportIssue({ onIssueReported }: { onIssueReported?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    category: 'general', 
    priority: 'medium',
    department: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { error } = await supabase.from('issue_reports').insert({
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      department: form.department,
      reported_by: user!.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Issue reported successfully', description: 'The issue has been added to the system.' });
      setForm({ title: '', description: '', category: 'general', priority: 'medium', department: '' });
      onIssueReported?.();
    }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Report Issue on Behalf of User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Issue Title</Label>
            <Input 
              value={form.title} 
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
              placeholder="Brief description of the issue" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Detailed Description</Label>
            <Textarea 
              value={form.description} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
              placeholder="Describe the issue in detail..." 
              rows={4} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))} required>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Human Resource">Human Resource</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Ntafrewaso Division">Ntafrewaso Division</SelectItem>
                <SelectItem value="Mampong Division">Mampong Division</SelectItem>
                <SelectItem value="Clinic">Clinic</SelectItem>
                <SelectItem value="TSOPP">TSOPP</SelectItem>
                <SelectItem value="Outgrower">Outgrower</SelectItem>
                <SelectItem value="Club House">Club House</SelectItem>
                <SelectItem value="School">School</SelectItem>
              </SelectContent>
            </Select>
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
  );
}
