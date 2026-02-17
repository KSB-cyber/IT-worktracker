import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, FileText, CheckCircle2, Edit, FileDown } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exportDialog, setExportDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Record<string, unknown> | null>(null);
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

    const invoiceData = {
      vendor_name: form.vendor_name,
      invoice_number: form.invoice_number,
      amount: parseFloat(form.amount),
      description: form.description,
      issue_date: issueDate,
      due_date: dueDate,
      notes: form.notes,
    };

    const { error } = editingInvoice
      ? await supabase.from('invoices').update(invoiceData).eq('id', editingInvoice.id)
      : await supabase.from('invoices').insert({ ...invoiceData, created_by: user?.id });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingInvoice ? 'Invoice updated successfully!' : 'Invoice added successfully!' });
      setForm({ vendor_name: '', invoice_number: '', amount: '', description: '', issue_date: '', due_date: '', notes: '' });
      setEditingInvoice(null);
      setOpen(false);
      fetchInvoices();
    }
  };

  const editInvoice = (invoice: Record<string, unknown>) => {
    setEditingInvoice(invoice);
    setForm({
      vendor_name: invoice.vendor_name as string,
      invoice_number: invoice.invoice_number as string,
      amount: String(invoice.amount),
      description: invoice.description as string || '',
      issue_date: invoice.issue_date as string,
      due_date: invoice.due_date as string,
      notes: invoice.notes as string || '',
    });
    setOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('invoices').update({ status }).eq('id', id);
    toast({ title: 'Invoice marked as paid' });
    fetchInvoices();
  };

  const getDaysInfo = (dueDate: string, status: string) => {
    if (status === 'paid') return { text: 'Paid', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950' };
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950' };
    if (days <= 5) return { text: `${days}d left`, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950' };
    return { text: `${days}d left`, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950' };
  };

  const filtered = invoices.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return differenceInDays(parseISO(i.due_date as string), new Date()) < 0 && i.status !== 'paid';
    return i.status === filter;
  });

  const downloadCSV = () => {
    let dataToExport = filtered;
    
    if (dateRange.start || dateRange.end) {
      dataToExport = filtered.filter(i => {
        const dueDate = new Date(i.due_date as string);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;
        
        if (start && end) return dueDate >= start && dueDate <= end;
        if (start) return dueDate >= start;
        if (end) return dueDate <= end;
        return true;
      });
    }

    const header = 'Vendor,Invoice #,Amount,Status,Issue Date,Due Date,Days Left\n';
    const rows = dataToExport.map(i => {
      const days = differenceInDays(parseISO(i.due_date as string), new Date());
      return `"${i.vendor_name}","${i.invoice_number}",${i.amount},${i.status},${i.issue_date},${i.due_date},${days}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `invoices_${filter}_${dateRange.start || 'all'}_to_${dateRange.end || 'all'}.csv`; 
    a.click();
  };

  const downloadPDF = () => {
    let dataToExport = filtered;
    
    if (dateRange.start || dateRange.end) {
      dataToExport = filtered.filter(i => {
        const dueDate = new Date(i.due_date as string);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;
        
        if (start && end) return dueDate >= start && dueDate <= end;
        if (start) return dueDate >= start;
        if (end) return dueDate <= end;
        return true;
      });
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Invoice Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Filter: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`, 14, 28);
    
    const tableData = dataToExport.map(i => {
      const days = differenceInDays(parseISO(i.due_date as string), new Date());
      return [
        i.vendor_name,
        i.invoice_number,
        `GH₵${Number(i.amount).toLocaleString()}`,
        i.status,
        format(parseISO(i.issue_date as string), 'MMM dd, yyyy'),
        format(parseISO(i.due_date as string), 'MMM dd, yyyy'),
        days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`
      ];
    });

    autoTable(doc, {
      head: [['Vendor', 'Invoice #', 'Amount', 'Status', 'Issue Date', 'Due Date', 'Days Left']],
      body: tableData,
      startY: 35,
    });

    doc.save(`invoices_${filter}_${dateRange.start || 'all'}_to_${dateRange.end || 'all'}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient title-glow tracking-tight">Invoice Tracker</h1>
          <p className="text-lg text-muted-foreground mt-3 font-medium">Manage vendor invoices and payment deadlines</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportDialog(true)}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingInvoice(null); setForm({ vendor_name: '', invoice_number: '', amount: '', description: '', issue_date: '', due_date: '', notes: '' }); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
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
                  <Label>Amount (GH₵)</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
                <Button type="submit" className="w-full">{editingInvoice ? 'Update Invoice' : 'Create Invoice'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'paid', 'overdue'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="whitespace-nowrap">
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <FileText className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No invoices found</p>
            </CardContent>
          </Card>
        ) : filtered.map(inv => {
          const info = getDaysInfo(inv.due_date as string, inv.status as string);
          return (
            <Card key={inv.id} className="hover:shadow-xl transition-all duration-200 border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-xl text-foreground">{inv.vendor_name}</h3>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${info.bg} ${info.color}`}>
                        {info.text}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-base text-muted-foreground mb-2">
                      <span className="font-semibold">#{inv.invoice_number}</span>
                      <span>•</span>
                      <span className="font-bold text-lg text-foreground">GH₵{Number(inv.amount).toLocaleString()}</span>
                      <span>•</span>
                      <span>Due: {format(parseISO(inv.due_date as string), 'MMM dd, yyyy')}</span>
                    </div>
                    {inv.description && (
                      <p className="text-base text-muted-foreground mt-2 break-words">{inv.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => editInvoice(inv)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    {inv.status !== 'paid' && (
                      <Button variant="default" size="default" onClick={() => updateStatus(inv.id as string, 'paid')} className="whitespace-nowrap">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
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

      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export Invoices</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'paid', 'overdue'].map(f => (
                  <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Start Date (Optional)</Label>
              <Input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={() => { downloadCSV(); setExportDialog(false); }}>
              <Download className="w-4 h-4 mr-2" /> Download CSV
            </Button>
            <Button className="w-full" variant="outline" onClick={() => { downloadPDF(); setExportDialog(false); }}>
              <FileDown className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
