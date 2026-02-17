import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, StickyNote, Bell, ClipboardList, FileText, Trash2, CheckCircle, Download, Upload, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
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
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Array<Record<string, unknown>>>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [editingNote, setEditingNote] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'note', reminder_date: '', file: null as File | null });

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    const { data } = await supabase.from('ledger_notes').select('*').order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm(f => ({ ...f, file: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let fileUrl = editingNote?.file_url || null;
    let fileName = editingNote?.file_name || null;

    if (form.file && form.category === 'document') {
      const fileExt = form.file.name.split('.').pop();
      const filePath = `${user!.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, form.file);

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
      fileUrl = publicUrl;
      fileName = form.file.name;
    }

    const noteData = {
      title: form.title,
      content: form.content,
      category: form.category,
      reminder_date: form.reminder_date || null,
      file_url: fileUrl,
      file_name: fileName,
    };

    const { error } = editingNote
      ? await supabase.from('ledger_notes').update(noteData).eq('id', editingNote.id)
      : await supabase.from('ledger_notes').insert({ ...noteData, created_by: user!.id });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingNote ? 'Entry updated successfully!' : 'Entry added successfully!' });
      setForm({ title: '', content: '', category: 'note', reminder_date: '', file: null });
      setEditingNote(null);
      setOpen(false);
      fetchNotes();
    }
    setUploading(false);
  };

  const editNote = (note: Record<string, unknown>) => {
    setEditingNote(note);
    setForm({
      title: note.title as string,
      content: note.content as string || '',
      category: note.category as string,
      reminder_date: note.reminder_date ? (note.reminder_date as string).slice(0, 16) : '',
      file: null,
    });
    setOpen(true);
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
  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient title-glow tracking-tight">Digital Ledger</h1>
          <p className="text-lg text-muted-foreground mt-3 font-medium">Notes, reminders, plans, and documents</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingNote(null); setForm({ title: '', content: '', category: 'note', reminder_date: '', file: null }); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Entry</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingNote ? 'Edit Ledger Entry' : 'New Ledger Entry'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
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
                {form.category === 'document' && (
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <div className="flex items-center gap-2">
                      <Input type="file" onChange={handleFileChange} />
                      {form.file && <span className="text-sm text-muted-foreground">{form.file.name}</span>}
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? 'Uploading...' : editingNote ? 'Update Entry' : 'Save Entry'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'note', 'reminder', 'plan', 'document'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="whitespace-nowrap">
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <StickyNote className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No entries yet</p>
            </CardContent>
          </Card>
        ) : filtered.map(note => {
          const Icon = categoryIcons[note.category as string] || StickyNote;
          return (
            <Card key={note.id} className={`transition-all hover:shadow-lg border-0 shadow-sm ${note.is_completed ? 'opacity-60' : ''}`}>
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start justify-between">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${categoryColors[note.category as string]} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    {isAdmin && (
                      <>
                        <button onClick={() => editNote(note)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleComplete(note.id as string, note.is_completed as boolean)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-success transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteNote(note.id as string)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <h3 className={`font-semibold text-foreground mt-3 ${note.is_completed ? 'line-through' : ''}`}>{note.title}</h3>
                {note.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{note.content}</p>}
                {note.file_url && (
                  <a href={note.file_url as string} download={note.file_name as string} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 text-sm text-primary hover:underline">
                    <Download className="w-4 h-4" />
                    {note.file_name || 'Download File'}
                  </a>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>{format(parseISO(note.created_at as string), 'MMM dd, yyyy')}</span>
                  {note.reminder_date && (
                    <span className="text-warning flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      {format(parseISO(note.reminder_date as string), 'MMM dd, HH:mm')}
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
