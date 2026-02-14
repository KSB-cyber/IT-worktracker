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
import { Plus, ChevronLeft, ChevronRight, Clock, Target, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
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
      toast({ title: 'Event added' });
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

  const typeIcons: Record<string, any> = { reminder: Clock, deadline: Target, meeting: Users };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Reminders, deadlines, and invoice due dates</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Calendar Event</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
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
                    className={`p-2 text-sm rounded-lg transition-colors text-center relative ${
                      isToday(day) ? 'bg-primary/10 text-primary font-bold' :
                      isSelected ? 'bg-accent/10 text-accent-foreground ring-1 ring-accent' :
                      'hover:bg-muted text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                    {hasItems && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {dayEvents.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        {dayInvoices.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-warning" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">Click a date to see events</p>
            ) : (
              <>
                {dayInfo.events.length === 0 && dayInfo.invoices.length === 0 && (
                  <p className="text-sm text-muted-foreground">No events on this day</p>
                )}
                {dayInfo.events.map(evt => {
                  const Icon = typeIcons[evt.event_type] || Clock;
                  return (
                    <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{evt.title}</p>
                        {evt.description && <p className="text-xs text-muted-foreground">{evt.description}</p>}
                        <span className="text-xs text-muted-foreground">{evt.event_type}</span>
                      </div>
                    </div>
                  );
                })}
                {dayInfo.invoices.map(inv => (
                  <div key={inv.id} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <Target className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Invoice Due: {inv.vendor_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.invoice_number} • ${Number(inv.amount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
