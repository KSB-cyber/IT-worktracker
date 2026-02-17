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
import { Plus, ChevronLeft, ChevronRight, Clock, Target, Users, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isToday, parseISO } from 'date-fns';

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'reminder', event_date: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [eventsRes, invoicesRes] = await Promise.all([
      supabase.from('calendar_events').select('*').order('event_date'),
      supabase.from('invoices').select('*').neq('status', 'paid'),
    ]);
    setEvents(eventsRes.data || []);
    setInvoices(invoicesRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('calendar_events').insert({
      title: form.title,
      description: form.description,
      event_type: form.event_type,
      event_date: form.event_date,
      created_by: user!.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event added successfully!' });
      setForm({ title: '', description: '', event_type: 'reminder', event_date: '' });
      setOpen(false);
      fetchData();
    }
  };

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDay = startOfMonth(currentMonth).getDay();

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => e.event_date === dateStr);
    const dayInvoices = invoices.filter(i => i.due_date === dateStr);
    return { events: dayEvents, invoices: dayInvoices };
  };

  const dayInfo = selectedDate ? getEventsForDay(selectedDate) : { events: [], invoices: [] };

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = { reminder: Clock, deadline: Target, meeting: Users };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient title-glow tracking-tight">Calendar</h1>
          <p className="text-lg text-muted-foreground mt-3 font-medium">Reminders, deadlines, and invoice due dates</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="default"><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New Calendar Event</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} required />
                </div>
              </div>
              <Button type="submit" className="w-full">Add Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-sm font-bold text-muted-foreground py-3">{d}</div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              {days.map(day => {
                const { events: dayEvents, invoices: dayInvoices } = getEventsForDay(day);
                const hasItems = dayEvents.length > 0 || dayInvoices.length > 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`p-3 text-base font-medium rounded-xl transition-all duration-200 text-center relative ${
                      isToday(day) ? 'bg-primary text-primary-foreground font-bold shadow-md' :
                      isSelected ? 'bg-accent text-accent-foreground ring-2 ring-accent shadow-md' :
                      'hover:bg-muted text-foreground hover:shadow-sm'
                    }`}
                  >
                    {format(day, 'd')}
                    {hasItems && (
                      <div className="flex justify-center gap-1 mt-1">
                        {dayEvents.length > 0 && <span className="w-2 h-2 rounded-full bg-primary" />}
                        {dayInvoices.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!selectedDate ? (
              <div className="py-12 text-center">
                <CalendarIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-base text-muted-foreground">Click a date to see events</p>
              </div>
            ) : (
              <>
                {dayInfo.events.length === 0 && dayInfo.invoices.length === 0 && (
                  <p className="text-base text-muted-foreground py-8 text-center">No events on this day</p>
                )}
                <div className="space-y-3">
                  {dayInfo.events.map(evt => {
                    const Icon = typeIcons[evt.event_type as string] || Clock;
                    return (
                      <div key={evt.id} className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold text-foreground break-words">{evt.title}</p>
                          {evt.description && <p className="text-sm text-muted-foreground break-words mt-1">{evt.description}</p>}
                          <span className="text-xs text-muted-foreground capitalize mt-1 inline-block">{evt.event_type}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayInfo.invoices.map(inv => (
                    <div key={inv.id} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-foreground break-words">Invoice Due: {inv.vendor_name}</p>
                        <p className="text-sm text-muted-foreground break-words mt-1">{inv.invoice_number} • GH₵{Number(inv.amount).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
