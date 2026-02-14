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
import { Plus, StickyNote, Bell, ClipboardList, FileText, Trash2, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const categoryIcons: Record<string, any> = {
  note: StickyNote,
  reminder: Bell,
  plan: ClipboardList,
  document: FileText,
};

const categoryColors: Record<string, string> = {
  note: 'bg-primary/10 text-primary',
  reminder: 'bg-warning/10 text-warning',
  plan: 'bg-accent/10 text-accent',
  document: 'bg-info/10 text-info',
};

export default function LedgerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', content: '', category: 'note', reminder_date: '' });

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    const { data } = await supabase.from('ledger_notes').select('*').order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('ledger_notes').insert({
      title: form.title,
      content: form.content,
      category: form.category,
      reminder_date: form.reminder_date || null,
      created_by: user!.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Note added' });
      setForm({ title: '', content: '', category: 'note', reminder_date: '' });
      setOpen(false);
      fetchNotes();
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    await supabase.from('ledger_notes').update({ is_completed: !current }).eq('id', id);
    fetchNotes();
  };

  const deleteNote = async (id: string) => {
    await supabase.from('ledger_notes').delete().eq('id', id);
    fetchNotes();
  };

  const filtered = notes.filter(n => filter === 'all' || n.category === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Digital Ledger</h1>
          <p className="text-muted-foreground">Notes, reminders, plans, and documents</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Ledger Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="plan">Plan</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reminder Date (optional)</Label>
                  <Input type="datetime-local" value={form.reminder_date} onChange={e => setForm(f => ({ ...f, reminder_date: e.target.value }))} />
                </div>
              </div>
              <Button type="submit" className="w-full">Save Entry</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {['all', 'note', 'reminder', 'plan', 'document'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No entries yet</CardContent></Card>
        ) : filtered.map(note => {
          const Icon = categoryIcons[note.category] || StickyNote;
          return (
            <Card key={note.id} className={`transition-all hover:shadow-md ${note.is_completed ? 'opacity-60' : ''}`}>
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start justify-between">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${categoryColors[note.category]} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleComplete(note.id, note.is_completed)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-success transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className={`font-semibold text-foreground mt-3 ${note.is_completed ? 'line-through' : ''}`}>{note.title}</h3>
                {note.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{note.content}</p>}
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>{format(parseISO(note.created_at), 'MMM dd, yyyy')}</span>
                  {note.reminder_date && (
                    <span className="text-warning">
                      <Bell className="inline w-3 h-3 mr-0.5" />
                      {format(parseISO(note.reminder_date), 'MMM dd, HH:mm')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
