import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Calendar, 
  Activity, 
  Egg,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const res = await fetch("/api/batches");
      if (!res.ok) throw new Error("Failed to load batches");
      return res.json() as Promise<Array<{ id: number; code: string; name: string; breed?: string; ageWeeks: number; chickens: number; status: string }>>;
    }
  });
}

export default function Batches() {
  const navigate = useNavigate();
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [showDetails, setShowDetails] = useState<null | { id: number; code: string; name: string; breed?: string; ageWeeks: number; chickens: number; status: string }>(null);
  // simple form state for demo purposes
  const [newName, setNewName] = useState("");
  const [newBreed, setNewBreed] = useState("");
  const [newChickens, setNewChickens] = useState<number | ''>("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: batches } = useBatches();

  const createMutation = useMutation({
    mutationFn: async (payload: { code: string; name: string; breed?: string; chickens: number }) => {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: payload.code, name: payload.name, breed: payload.breed, chickens: payload.chickens, ageWeeks: 0, status: "Healthy" })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    }
  });

  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // simple unique code
      const code = `B${Date.now()}`;
      await createMutation.mutateAsync({ code, name: newName, breed: newBreed || undefined, chickens: Number(newChickens || 0) });
      setShowNewBatch(false);
      setNewName(""); setNewBreed(""); setNewChickens("");
    } catch (_e) {
      // optionally show toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Batch Management</h1>
            <p className="text-muted-foreground">Monitor and manage your chicken batches</p>
          </div>
          <Button onClick={() => setShowNewBatch(true)} className="bg-gradient-primary hover:shadow-glow transition-smooth">
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search batches..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">All Status</Button>
                <Button variant="outline" size="sm">Active</Button>
                <Button variant="outline" size="sm">Monitoring</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {(batches ?? []).map((batch) => (
            <Card key={batch.id} className="hover:shadow-medium transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{batch.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{batch.breed || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={batch.status === "Healthy" ? "default" : "secondary"}>
                      {batch.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Chickens</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{batch.chickens}</p>
                    <p className="text-xs text-muted-foreground">code {batch.code}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Egg className="h-4 w-4 text-accent" />
                      <span className="text-sm text-muted-foreground">Age Weeks</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{batch.ageWeeks}</p>
                  </div>
                </div>

                {/* Mortality Alert (not available in model) */}

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{batch.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-medium">{batch.code}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => navigate('/logs')} variant="outline" size="sm" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Log Entry
                  </Button>
                  <Button onClick={() => setShowDetails(batch)} variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State for New Users */}
        {(!batches || batches.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Batches Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first chicken batch to start tracking production and health.
              </p>
              <Button onClick={() => setShowNewBatch(true)} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create First Batch
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Batch Dialog */}
      <Dialog open={showNewBatch} onOpenChange={setShowNewBatch}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBatch} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nb-name">Batch name</Label>
              <Input id="nb-name" value={newName} onChange={(e)=>setNewName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nb-breed">Breed</Label>
              <Input id="nb-breed" value={newBreed} onChange={(e)=>setNewBreed(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nb-count">Number of chickens</Label>
              <Input id="nb-count" type="number" value={newChickens} onChange={(e)=>setNewChickens(e.target.value === '' ? '' : Number(e.target.value))} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setShowNewBatch(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-primary">{saving ? 'Creating...' : 'Create Batch'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!showDetails} onOpenChange={(o)=>!o && setShowDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
          </DialogHeader>
          {showDetails && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="font-medium">{showDetails.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Breed:</span><span className="font-medium">{showDetails.breed || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Age Weeks:</span><span className="font-medium">{showDetails.ageWeeks}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Chickens:</span><span className="font-medium">{showDetails.chickens}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="font-medium">{showDetails.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Code:</span><span className="font-medium">{showDetails.code}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowDetails(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}