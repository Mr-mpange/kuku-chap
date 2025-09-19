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

const recentBatches = [
  { id: "B001", name: "Batch Alpha", age: "12 weeks", chickens: 150, status: "Healthy" },
  { id: "B002", name: "Batch Beta", age: "8 weeks", chickens: 200, status: "Monitoring" },
  { id: "B003", name: "Batch Gamma", age: "16 weeks", chickens: 180, status: "Healthy" },
];

const alerts = [
  { type: "warning", message: "Feed levels low in Coop A", time: "2 hours ago" },
  { type: "info", message: "Vaccination due for Batch Beta", time: "1 day ago" },
];

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Farm Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your farm overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-primary hover:shadow-glow transition-smooth">
              <Plus className="h-4 w-4 mr-2" />
              New Batch
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Chickens"
            value="1,247"
            change="+12% from last month"
            changeType="positive"
            icon={Activity}
          />
          <StatsCard
            title="Daily Eggs"
            value="892"
            change="+5% from yesterday"
            changeType="positive"
            icon={Egg}
          />
          <StatsCard
            title="Monthly Revenue"
            value="$4,250"
            change="+18% from last month"
            changeType="positive"
            icon={DollarSign}
          />
          <StatsCard
            title="Mortality Rate"
            value="2.1%"
            change="-0.3% improvement"
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
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{batch.name}</span>
                      <Badge variant={batch.status === "Healthy" ? "default" : "secondary"} className="text-xs">
                        {batch.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {batch.chickens} chickens • {batch.age}
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
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === "warning" ? "bg-warning" : "bg-primary"
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