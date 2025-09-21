import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ProductionChart } from "@/components/dashboard/production-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useNavigate } from "react-router-dom";
import { usePreferences } from "@/context/preferences";

function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json() as Promise<{ totalChickens: number; dailyEggs: number; monthlyRevenue: number; mortalityRate: number; changes: Record<string,string> }>
    }
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
    </MainLayout>
  );
}