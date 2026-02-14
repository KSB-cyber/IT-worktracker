import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, AlertCircle } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';

export default function InvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    vendor_name: '', invoice_number: '', amount: '', description: '', issue_date: '', due_date: '', notes: ''
  });

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*').order('due_date', { ascending: true });
    setInvoices(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issueDate = form.issue_date || new Date().toISOString().split('T')[0];
    const dueDate = form.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const { error } = await supabase.from('invoices').insert({
      vendor_name: form.vendor_name,
      invoice_number: form.invoice_number,
      amount: parseFloat(form.amount),
      description: form.description,
      issue_date: issueDate,
      due_date: dueDate,
      notes: form.notes,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invoice added' });
      setForm({ vendor_name: '', invoice_number: '', amount: '', description: '', issue_date: '', due_date: '', notes: '' });
      setOpen(false);
      fetchInvoices();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('invoices').update({ status }).eq('id', id);
    fetchInvoices();
  };

  const getDaysInfo = (dueDate: string, status: string) => {
    if (status === 'paid') return { text: 'Paid', color: 'text-success', bg: 'bg-success/10' };
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'text-destructive', bg: 'bg-destructive/10' };
    if (days <= 5) return { text: `${days}d left`, color: 'text-warning', bg: 'bg-warning/10' };
    return { text: `${days}d left`, color: 'text-success', bg: 'bg-success/10' };
  };

  const filtered = invoices.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return differenceInDays(parseISO(i.due_date), new Date()) < 0 && i.status !== 'paid';
    return i.status === filter;
  });

  const downloadCSV = () => {
    const header = 'Vendor,Invoice #,Amount,Status,Issue Date,Due Date,Days Left\n';
    const rows = invoices.map(i => {
      const days = differenceInDays(parseISO(i.due_date), new Date());
      return `"${i.vendor_name}","${i.invoice_number}",${i.amount},${i.status},${i.issue_date},${i.due_date},${days}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'invoices.csv'; a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoice Tracker</h1>
          <p className="text-muted-foreground">Manage vendor invoices and payment deadlines</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendor Name</Label>
                    <Input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date (default: 30 days)</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full">Create Invoice</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'paid', 'overdue'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No invoices found</CardContent></Card>
        ) : filtered.map(inv => {
          const info = getDaysInfo(inv.due_date, inv.status);
          return (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{inv.vendor_name}</h3>
                      <span className={`status-badge ${info.bg} ${info.color}`}>{info.text}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {inv.invoice_number} • ${Number(inv.amount).toLocaleString()} • Due: {format(parseISO(inv.due_date), 'MMM dd, yyyy')}
                    </p>
                    {inv.description && <p className="text-sm text-muted-foreground mt-1">{inv.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    {inv.status !== 'paid' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(inv.id, 'paid')}>
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
