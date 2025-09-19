import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { useState } from "react";

const recentLogs = [
  {
    id: 1,
    date: "2024-01-20",
    batch: "Batch Alpha",
    eggs: 89,
    feed: 45,
    deaths: 0,
    expenses: 25.50,
    notes: "All chickens healthy, good production day"
  },
  {
    id: 2,
    date: "2024-01-19", 
    batch: "Batch Beta",
    eggs: 120,
    feed: 52,
    deaths: 1,
    expenses: 30.00,
    notes: "One chicken found sick, isolated for treatment"
  },
  {
    id: 3,
    date: "2024-01-19",
    batch: "Batch Gamma",
    eggs: 145,
    feed: 48,
    deaths: 0,
    expenses: 22.75,
    notes: "Excellent production, feed consumption normal"
  }
];

export default function DailyLogs() {
  const [selectedBatch, setSelectedBatch] = useState("");

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Logs</h1>
            <p className="text-muted-foreground">Track daily farm activities and performance</p>
          </div>
          <Button className="bg-gradient-primary hover:shadow-glow transition-smooth">
            <Plus className="h-4 w-4 mr-2" />
            New Log Entry
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Log Entry Form */}
          <Card className="lg:col-span-1">
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
                    <SelectItem value="B001">Batch Alpha</SelectItem>
                    <SelectItem value="B002">Batch Beta</SelectItem>
                    <SelectItem value="B003">Batch Gamma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eggs">Eggs Collected</Label>
                  <Input id="eggs" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feed">Feed Used (kg)</Label>
                  <Input id="feed" type="number" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deaths">Deaths</Label>
                  <Input id="deaths" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenses">Expenses ($)</Label>
                  <Input id="expenses" type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Daily observations, health notes, special events..."
                  rows={3}
                />
              </div>

              <Button className="w-full bg-gradient-primary hover:shadow-glow transition-smooth">
                Save Log Entry
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
                {recentLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-smooth">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">{log.date}</div>
                        <Badge variant="outline">{log.batch}</Badge>
                        {log.deaths > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {log.deaths} deaths
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
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
                        <span className="font-medium">{log.feed}kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium">${log.expenses}</span>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Egg className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">354</p>
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
                  <p className="text-2xl font-bold">145kg</p>
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
                  <p className="text-2xl font-bold">$78.25</p>
                  <p className="text-sm text-muted-foreground">Expenses</p>
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
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-muted-foreground">Deaths Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}