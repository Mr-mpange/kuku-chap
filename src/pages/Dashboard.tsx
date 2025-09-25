import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ProductionChart } from "@/components/dashboard/production-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Egg, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Plus,
  Calendar,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "@/context/preferences";
import { AspectRatio } from "@/components/ui/aspect-ratio";

function useDashboardStats() {
  return useQuery<{
    totalChickens: number;
    dailyEggs: number;
    monthlyRevenue: number;
    mortalityRate: number;
    changes: Record<string, string>;
  }>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });
}

function usePostedProductsPreview() {
  return useQuery({
    queryKey: ["posted-products-preview"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=4&offset=0");
      if (!res.ok) throw new Error("Failed to load products");
      return res.json() as Promise<Array<{ id: number; name: string; price: number; category: string; images?: string[] }>>;
    },
  });
}

function useRecentOrders() {
  return useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=8&offset=0");
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json() as Promise<Array<{ id: number; productId: number; quantity: number; unitPrice: number; buyerContact?: string | null; status: string; createdAt?: string }>>;
    },
  });
}

function useRecentBatches() {
  return useQuery({
    queryKey: ["recent-batches"],
    queryFn: async () => {
      const res = await fetch("/api/batches/recent");
      if (!res.ok) throw new Error("Failed to load batches");
      return res.json() as Promise<Array<{ id: number; code: string; name: string; ageWeeks: number; chickens: number; status: string }>>
    }
  });
}

function useRecentAlerts() {
  return useQuery({
    queryKey: ["recent-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/alerts/recent");
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json() as Promise<Array<{ id: number; type: "info" | "warning" | "error"; message: string; time: string }>>
    }
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { formatCurrency } = usePreferences();
  const { data: stats } = useDashboardStats();
  const { data: recentBatches } = useRecentBatches();
  const { data: alerts } = useRecentAlerts();
  const { data: recentOrders } = useRecentOrders();
  const { data: postedPreview } = usePostedProductsPreview();
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<null | { id: number; name: string; price: number }>(null);
  const [orderQty, setOrderQty] = useState("1");
  const [orderContact, setOrderContact] = useState("");
  return (
    <MainLayout showFooter={false}>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Farm Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your farm overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/marketplace')}>
              Browse Posted Products
            </Button>
            <Button onClick={() => navigate('/batches')} className="bg-gradient-primary hover:shadow-glow transition-smooth">
              <Plus className="h-4 w-4 mr-2" />
              New Batch
            </Button>
            <Button variant="outline" onClick={() => navigate('/logs')}>
              <Calendar className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Chickens"
            value={stats?.totalChickens ?? "—"}
            change={stats ? `${stats.changes.totalChickens} from last month` : undefined}
            changeType="positive"
            icon={Activity}
          />
          <StatsCard
            title="Daily Eggs"
            value={stats?.dailyEggs ?? "—"}
            change={stats ? `${stats.changes.dailyEggs} from yesterday` : undefined}
            changeType="positive"
            icon={Egg}
          />
          <StatsCard
            title="Monthly Revenue"
            value={stats ? `${formatCurrency(stats.monthlyRevenue)}` : "—"}
            change={stats ? `${stats.changes.monthlyRevenue} from last month` : undefined}
            changeType="positive"
            icon={DollarSign}
          />
          <StatsCard
            title="Mortality Rate"
            value={stats ? `${stats.mortalityRate}%` : "—"}
            change={stats ? `${stats.changes.mortalityRate} improvement` : undefined}
            changeType="positive"
            icon={TrendingUp}
          />
        </div>

        {/* Charts and Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Production Chart */}
          <ProductionChart />

          {/* Recent Batches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Active Batches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentBatches?.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{batch.name}</span>
                      <Badge variant={batch.status === "Healthy" ? "default" : "secondary"} className="text-xs">
                        {batch.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {batch.chickens} chickens • {batch.ageWeeks} weeks
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Posted Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Posted Orders</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>See Posted Products</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(recentOrders || []).map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                  <div className="w-16 h-10 rounded overflow-hidden border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    #{o.productId}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">Order #{o.id}</span>
                      <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Qty {o.quantity} • {formatCurrency(o.unitPrice)}</div>
                    {o.buyerContact && (
                      <div className="text-xs text-muted-foreground truncate">{o.buyerContact}</div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={()=>navigate('/orders')}>View</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Posted Products (Preview) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Posted Products</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(postedPreview || []).map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                  <div className="w-16 h-16 rounded-full overflow-hidden border bg-muted">
                    <AspectRatio ratio={1}>
                      {Array.isArray(p.images) && p.images.length > 0 ? (
                        <img
                          src={(p.images[0] || '').startsWith('http') || (p.images[0] || '').startsWith('/') ? (p.images[0] as string) : `/uploads/${p.images[0]}`}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">🖼️</div>
                      )}
                    </AspectRatio>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{p.name}</span>
                      <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(p.price)}</div>
                  </div>
                  <Button size="sm" className="bg-gradient-primary" onClick={()=>navigate('/marketplace')}>Order</Button>
                </div>
              ))}
              {(!postedPreview || postedPreview.length === 0) && (
                <div className="text-sm text-muted-foreground">No posted products yet.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Recent Alerts
              </CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts?.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === "warning" ? "bg-warning" : alert.type === "error" ? "bg-destructive" : "bg-primary"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Quick Order Dialog */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
          </DialogHeader>
          {orderProduct && (
            <form className="space-y-3" onSubmit={async (e)=>{
              e.preventDefault();
              try {
                const qty = Math.max(1, parseInt(orderQty || '1', 10) || 1);
                const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: orderProduct.id, quantity: qty, buyerContact: orderContact || undefined }) });
                if (!res.ok) throw new Error(await res.text());
                toast({ title: 'Order placed', description: `${orderProduct.name} x${qty}` });
                setOrderOpen(false);
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Could not place order';
                toast({ title: 'Order failed', description: msg });
              }
            }}>
              <div>
                <div className="text-sm text-muted-foreground">Product</div>
                <div className="font-medium">{orderProduct.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-muted-foreground">Quantity</label>
                  <Input type="number" min={1} value={orderQty} onChange={(e)=>setOrderQty(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Contact (optional)</label>
                  <Input value={orderContact} onChange={(e)=>setOrderContact(e.target.value)} placeholder="Phone or email" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={()=>setOrderOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-gradient-primary">Confirm Order</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}