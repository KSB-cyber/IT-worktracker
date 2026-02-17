import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Ticket, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminReportIssue from './AdminReportIssue';

export default function AdminIssues() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<Array<Record<string, unknown>>>([]);
  const [filter, setFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [resolveDialog, setResolveDialog] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [exportDialog, setExportDialog] = useState(false);

  useEffect(() => { fetchIssues(); }, []);

  const fetchIssues = async () => {
    const { data: issueData } = await supabase.from('issue_reports').select('*')
      .order('created_at', { ascending: false });
    
    if (issueData && issueData.length > 0) {
      const userIds = [...new Set(issueData.map(i => i.reported_by))];
      const { data: profileData } = await supabase.from('profiles').select('user_id, full_name, email, department')
        .in('user_id', userIds);
      
      const profileMap = new Map((profileData || []).map(p => [p.user_id, p]));
      setIssues(issueData.map(i => ({ ...i, reporter: profileMap.get(i.reported_by) })));
    } else {
      setIssues([]);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
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
    let dataToExport = filtered;
    
    if (dateRange.start || dateRange.end) {
      dataToExport = filtered.filter(i => {
        const createdDate = new Date(i.created_at as string);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;
        
        if (start && end) return createdDate >= start && createdDate <= end;
        if (start) return createdDate >= start;
        if (end) return createdDate <= end;
        return true;
      });
    }

    const header = 'Ticket,Title,Category,Priority,Status,Reported By,Created,Resolved\n';
    const rows = dataToExport.map(i => {
      const reporter = i.reporter ? `${(i.reporter as any).full_name || (i.reporter as any).email}` : 'Unknown';
      return `"${i.ticket_number}","${i.title}","${i.category}","${i.priority}","${i.status}","${reporter}","${i.created_at}","${i.resolved_at || ''}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `issues_${filter}_${dateRange.start || 'all'}_to_${dateRange.end || 'all'}.csv`; 
    a.click();
  };

  const downloadPDF = () => {
    let dataToExport = filtered;
    
    if (dateRange.start || dateRange.end) {
      dataToExport = filtered.filter(i => {
        const createdDate = new Date(i.created_at as string);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;
        
        if (start && end) return createdDate >= start && createdDate <= end;
        if (start) return createdDate >= start;
        if (end) return createdDate <= end;
        return true;
      });
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Issue Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Filter: ${filter === 'all' ? 'All' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 14, 28);
    
    const tableData = dataToExport.map(i => {
      const reporter = i.reporter ? `${(i.reporter as any).full_name || (i.reporter as any).email}` : 'Unknown';
      return [
        i.ticket_number,
        i.title,
        i.category,
        i.priority,
        i.status.replace('_', ' '),
        reporter,
        format(parseISO(i.created_at as string), 'MMM dd, yyyy'),
        i.resolved_at ? format(parseISO(i.resolved_at as string), 'MMM dd, yyyy') : '-'
      ];
    });

    autoTable(doc, {
      head: [['Ticket', 'Title', 'Category', 'Priority', 'Status', 'Reported By', 'Created', 'Resolved']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
    });

    doc.save(`issues_${filter}_${dateRange.start || 'all'}_to_${dateRange.end || 'all'}.pdf`);
  };

  const filtered = issues.filter(i => {
    const statusMatch = filter === 'all' || i.status === filter;
    const department = i.reporter?.department || i.department;
    const departmentMatch = departmentFilter === 'all' || department === departmentFilter;
    return statusMatch && departmentMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient title-glow tracking-tight">Issue Reports</h1>
        <p className="text-lg text-muted-foreground mt-3 font-medium">Manage and report IT issues</p>
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList>
          <TabsTrigger value="view">View Issues</TabsTrigger>
          <TabsTrigger value="report">Report Issue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" /> Download Report
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">Filter by Status</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'not_started', 'in_progress', 'resolved'].map(f => (
                  <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="whitespace-nowrap">
                    {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Filter by Department</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'Commercial', 'Human Resource', 'Security', 'Transport', 'Processing', 'Ntafrewaso Division', 'Mampong Division', 'Clinic', 'TSOPP', 'Outgrower', 'Club House', 'School'].map(d => (
                  <Button key={d} variant={departmentFilter === d ? 'default' : 'outline'} size="sm" onClick={() => setDepartmentFilter(d)} className="whitespace-nowrap">
                    {d === 'all' ? 'All Departments' : d}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No issues found</p>
                </CardContent>
              </Card>
            ) : filtered.map(issue => (
              <Card key={issue.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
                <CardContent className="py-4 px-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <h3 className="font-bold text-lg text-foreground">{issue.title}</h3>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                          issue.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                          issue.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>{issue.priority}</span>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                          issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          issue.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>{issue.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-base text-muted-foreground mb-3 break-words">{issue.description}</p>
                      <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 shadow-sm">
                        <p className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          Reported by:
                        </p>
                        <div className="space-y-1.5 ml-4">
                          <p className="text-base font-bold text-foreground">{issue.reporter?.full_name || 'Unknown User'}</p>
                          {issue.reporter?.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="text-primary">✉</span> {issue.reporter.email}
                            </p>
                          )}
                          {(issue.reporter?.department || issue.department) && (
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                              <span className="text-primary">•</span> Department: <span className="text-primary">{issue.reporter?.department || issue.department}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 flex flex-wrap items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        <span className="font-semibold">{issue.ticket_number}</span>
                        <span>•</span>
                        <span className="capitalize font-medium">{issue.category}</span>
                        <span>•</span>
                        <span>{format(parseISO(issue.created_at), 'MMM dd, yyyy')}</span>
                      </p>
                      {issue.resolution_notes && (
                        <p className="text-base text-emerald-600 dark:text-emerald-400 mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 break-words font-medium">Resolution: {issue.resolution_notes}</p>
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
        </TabsContent>
        
        <TabsContent value="report" className="mt-6">
          <AdminReportIssue onIssueReported={fetchIssues} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Issue</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} placeholder="Describe the resolution..." rows={4} />
            </div>
            <Button className="w-full" onClick={() => resolveDialog && updateStatus(resolveDialog, 'resolved')}>
              Mark as Resolved & Issue E-Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Download Issue Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'not_started', 'in_progress', 'resolved'].map(f => (
                  <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                    {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
            <Button className="w-full" onClick={() => { downloadReport(); setExportDialog(false); }}>
              <Download className="w-4 h-4 mr-2" /> Download CSV
            </Button>
            <Button className="w-full" variant="outline" onClick={() => { downloadPDF(); setExportDialog(false); }}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
