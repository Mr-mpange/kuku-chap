import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Egg,
  DollarSign,
  Activity,
  AlertTriangle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

type Summary = { revenue: number; eggsTotal: number; expensesTotal: number };
type ProdPoint = { date: string; eggs: number; feed: number; revenue: number; name: string };
type ExpenseSlice = { name: string; value: number; color: string };
type PerfItem = { batch: string; eggs: number; efficiency: number; health: string };

function useReportSummary() {
  return useQuery<Summary>({
    queryKey: ["report-summary"],
    queryFn: async () => {
      const r = await fetch("/api/reports/summary");
      if (!r.ok) throw new Error("Failed to load summary");
      return r.json();
    }
  });
}

function useProduction(days = 6) {
  return useQuery<ProdPoint[]>({
    queryKey: ["report-production", days],
    queryFn: async () => {
      const r = await fetch(`/api/reports/production?days=${days}`);
      if (!r.ok) throw new Error("Failed to load production data");
      return r.json();
    }
  });
}

function useExpenseBreakdown() {
  return useQuery<ExpenseSlice[]>({
    queryKey: ["report-expense-breakdown"],
    queryFn: async () => {
      const r = await fetch("/api/reports/expense-breakdown");
      if (!r.ok) throw new Error("Failed to load expense breakdown");
      return r.json();
    }
  });
}

function useBatchPerformance() {
  return useQuery<PerfItem[]>({
    queryKey: ["report-batch-performance"],
    queryFn: async () => {
      const r = await fetch("/api/reports/batch-performance");
      if (!r.ok) throw new Error("Failed to load batch performance");
      return r.json();
    }
  });
}

export default function Reports() {
  const [openDetails, setOpenDetails] = useState<null | PerfItem>(null);
  const { data: summary } = useReportSummary();
  const { data: production } = useProduction(6);
  const { data: expenses } = useExpenseBreakdown();
  const { data: performance } = useBatchPerformance();
  // Provide safe data for charts to avoid runtime errors and blank screens
  const productionData = production ?? [];
  const expenseBreakdown = expenses ?? [];
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive farm performance insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="week">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={()=>toast({ title: 'Export started', description: 'Generating report (demo)...' })} className="bg-gradient-primary hover:shadow-glow transition-smooth">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">${summary ? summary.revenue.toLocaleString() : "—"}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue (est.)</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +18% vs last month
                  </Badge>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{summary ? summary.eggsTotal.toLocaleString() : "—"}</p>
                  <p className="text-sm text-muted-foreground">Total Eggs</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% vs last month
                  </Badge>
                </div>
                <Egg className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">89.2%</p>
                  <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +3% vs last month
                  </Badge>
                </div>
                <Activity className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">1.8%</p>
                  <p className="text-sm text-muted-foreground">Mortality Rate</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    -0.4% improvement
                  </Badge>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Production Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="eggs"
                    stroke="hsl(142 76% 36%)"
                    fill="hsl(142 76% 36%)"
                    fillOpacity={0.6}
                    name="Eggs"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(24 93% 56%)"
                    fill="hsl(24 93% 56%)"
                    fillOpacity={0.6}
                    name="Revenue ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Batch Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Batch Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Batch</th>
                    <th className="text-left p-3 font-medium">Total Eggs</th>
                    <th className="text-left p-3 font-medium">Efficiency</th>
                    <th className="text-left p-3 font-medium">Health Status</th>
                    <th className="text-left p-3 font-medium">Revenue</th>
                    <th className="text-left p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(performance ?? []).map((batch, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30 transition-smooth">
                      <td className="p-3 font-medium">Batch {batch.batch}</td>
                      <td className="p-3">{batch.eggs.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${batch.efficiency}%` }}
                            />
                          </div>
                          <span className="text-sm">{batch.efficiency}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={batch.health === "Excellent" ? "default" : "secondary"}>
                          {batch.health}
                        </Badge>
                      </td>
                      <td className="p-3">${(Number(batch.eggs) * 0.15).toFixed(2)}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" onClick={()=>setOpenDetails(batch)}>View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start" onClick={()=>toast({ title: 'Exporting', description: 'Monthly Summary (PDF) — demo' })}>
                <Calendar className="h-4 w-4 mr-2" />
                Monthly Summary (PDF)
              </Button>
              <Button variant="outline" className="justify-start" onClick={()=>toast({ title: 'Exporting', description: 'Production Data (CSV) — demo' })}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Production Data (CSV)
              </Button>
              <Button variant="outline" className="justify-start" onClick={()=>toast({ title: 'Exporting', description: 'Financial Report (Excel) — demo' })}>
                <DollarSign className="h-4 w-4 mr-2" />
                Financial Report (Excel)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!openDetails} onOpenChange={(o)=>!o && setOpenDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Report Details</DialogTitle>
          </DialogHeader>
          {openDetails && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Batch:</span><span className="font-medium">{openDetails.batch}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Eggs:</span><span className="font-medium">{openDetails.eggs}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Efficiency:</span><span className="font-medium">{openDetails.efficiency}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Health:</span><span className="font-medium">{openDetails.health}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenDetails(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}