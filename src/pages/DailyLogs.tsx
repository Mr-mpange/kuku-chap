import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar,
  Plus,
  Search,
  Egg,
  Utensils,
  AlertTriangle,
  DollarSign,
  FileText,
  Clock
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePreferences } from "@/context/preferences";

type LogItem = { id: number; batchCode: string; date: string; eggs: number; feedKg: number; deaths: number; expenses: number; notes?: string };
type Batch = { id: number; code: string; name: string };

function useLogs(batchCode?: string) {
  return useQuery({
    queryKey: ["logs", batchCode ?? "all"],
    queryFn: async () => {
      const qs = batchCode ? `?batchCode=${encodeURIComponent(batchCode)}` : "";
      const res = await fetch(`/api/logs${qs}`);
      if (!res.ok) throw new Error("Failed to load logs");
      return res.json() as Promise<LogItem[]>;
    }
  });
}

function useBatches() {
  return useQuery({
    queryKey: ["batches-min"],
    queryFn: async () => {
      const res = await fetch("/api/batches");
      if (!res.ok) throw new Error("Failed to load batches");
      const data = await res.json() as Array<Batch & { breed?: string; ageWeeks?: number; chickens?: number; status?: string }>;
      return data.map(b => ({ id: b.id, code: b.code, name: b.name })) as Batch[];
    }
  });
}

export default function DailyLogs() {
  const { formatCurrency } = usePreferences();
  const [selectedBatch, setSelectedBatch] = useState("");
  const [eggs, setEggs] = useState<number | ''>("");
  const [feed, setFeed] = useState<number | ''>("");
  const [deaths, setDeaths] = useState<number | ''>("");
  const [expenses, setExpenses] = useState<number | ''>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [editLog, setEditLog] = useState<LogItem | null>(null);
  const [editEggs, setEditEggs] = useState<number | ''>("");
  const [editFeed, setEditFeed] = useState<number | ''>("");
  const queryClient = useQueryClient();

  const { data: logs } = useLogs();
  const { data: batches } = useBatches();
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json() as Promise<{ totalChickens: number; dailyEggs: number; monthlyRevenue: number; mortalityRate: number; changes: any }>;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { batchCode: string; date: string; eggs: number; feedKg: number; deaths: number; expenses: number; notes?: string }) => {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logs"] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, eggs, feedKg }: { id: number; eggs: number; feedKg: number }) => {
      const res = await fetch(`/api/logs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eggs, feedKg })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logs"] })
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Logs</h1>
            <p className="text-muted-foreground">Track daily farm activities and performance</p>
          </div>
          <Button onClick={()=>formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="bg-gradient-primary hover:shadow-glow transition-smooth">
            <Plus className="h-4 w-4 mr-2" />
            New Log Entry
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Log Entry Form */}
          <Card className="lg:col-span-1" ref={formRef as any}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Today's Log Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch">Select Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose batch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(batches ?? []).map(b => (
                      <SelectItem key={b.id} value={b.code}>{b.name} ({b.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eggs">Eggs Collected</Label>
                  <Input id="eggs" type="number" placeholder="0" value={eggs} onChange={(e)=>setEggs(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feed">Feed Used (kg)</Label>
                  <Input id="feed" type="number" placeholder="0" value={feed} onChange={(e)=>setFeed(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deaths">Deaths</Label>
                  <Input id="deaths" type="number" placeholder="0" value={deaths} onChange={(e)=>setDeaths(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenses">Expenses ($)</Label>
                  <Input id="expenses" type="number" step="0.01" placeholder="0.00" value={expenses} onChange={(e)=>setExpenses(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Daily observations, health notes, special events..."
                  rows={3}
                  value={notes}
                  onChange={(e)=>setNotes(e.target.value)}
                />
              </div>

              <Button onClick={async () => {
                if (!selectedBatch) { toast({ title: 'Select a batch', description: 'Please choose a batch before saving.' }); return; }
                setSaving(true);
                try {
                  await createMutation.mutateAsync({
                    batchCode: selectedBatch,
                    date: new Date().toISOString(),
                    eggs: Number(eggs || 0),
                    feedKg: Number(feed || 0),
                    deaths: Number(deaths || 0),
                    expenses: Number(expenses || 0),
                    notes: notes || undefined
                  });
                  toast({ title: 'Log saved', description: 'Your daily log entry has been saved.' });
                  setSelectedBatch(""); setEggs(""); setFeed(""); setDeaths(""); setExpenses(""); setNotes("");
                } catch (_e) {
                  toast({ title: 'Save failed', description: 'Could not save log.' });
                } finally {
                  setSaving(false);
                }
              }} className="w-full bg-gradient-primary hover:shadow-glow transition-smooth" disabled={saving}>
                {saving ? 'Saving...' : 'Save Log Entry'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Log Entries
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search logs..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(logs ?? []).map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-smooth">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">{new Date(log.date).toLocaleDateString()}</div>
                        <Badge variant="outline">{log.batchCode}</Badge>
                        {log.deaths > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {log.deaths} deaths
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={()=>{ setEditLog(log); setEditEggs(log.eggs); setEditFeed(log.feedKg); }}>Edit</Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Egg className="h-4 w-4 text-accent" />
                        <span className="text-muted-foreground">Eggs:</span>
                        <span className="font-medium">{log.eggs}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Feed:</span>
                        <span className="font-medium">{log.feedKg}kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium">{formatCurrency(log.expenses)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-muted-foreground">Deaths:</span>
                        <span className="font-medium">{log.deaths}</span>
                      </div>
                    </div>

                    {log.notes && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {log.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline">Load More Entries</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats (live) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Egg className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '…' : (stats?.dailyEggs ?? 0)}</p>
                  <p className="text-sm text-muted-foreground">Eggs Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '…' : `${(stats?.feedKgToday ?? 0)}kg`}</p>
                  <p className="text-sm text-muted-foreground">Feed Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '…' : formatCurrency(stats?.monthlyRevenue ?? 0)}</p>
                  <p className="text-sm text-muted-foreground">Revenue (Month)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '…' : (stats?.deathsToday ?? 0)}</p>
                  <p className="text-sm text-muted-foreground">Deaths Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={!!editLog} onOpenChange={(o)=>!o && setEditLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Log Entry</DialogTitle>
          </DialogHeader>
          {editLog && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input value={new Date(editLog.date).toLocaleDateString()} readOnly />
              </div>
              <div>
                <Label>Batch</Label>
                <Input value={editLog.batchCode} readOnly />
              </div>
              <div>
                <Label>Eggs</Label>
                <Input type="number" value={editEggs} onChange={(e)=>setEditEggs(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div>
                <Label>Feed (kg)</Label>
                <Input type="number" value={editFeed} onChange={(e)=>setEditFeed(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setEditLog(null)}>Close</Button>
            <Button className="bg-gradient-primary" onClick={async ()=>{
              if (!editLog) return;
              try {
                await updateMutation.mutateAsync({ id: editLog.id, eggs: Number(editEggs || 0), feedKg: Number(editFeed || 0) });
                toast({ title: 'Updated', description: 'Log updated.' });
              } catch (_e) {
                toast({ title: 'Update failed', description: 'Could not update log.' });
              } finally {
                setEditLog(null);
              }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}