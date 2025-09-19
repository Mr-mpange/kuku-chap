import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Calendar, 
  Activity, 
  Egg,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";

const batches = [
  {
    id: "B001",
    name: "Batch Alpha",
    breed: "Rhode Island Red",
    startDate: "2024-01-15",
    currentAge: "12 weeks",
    totalChickens: 150,
    aliveChickens: 147,
    mortality: 2,
    dailyEggs: 89,
    status: "Healthy",
    feedConsumption: "45kg/day"
  },
  {
    id: "B002", 
    name: "Batch Beta",
    breed: "Leghorn",
    startDate: "2024-02-10",
    currentAge: "8 weeks",
    totalChickens: 200,
    aliveChickens: 195,
    mortality: 5,
    dailyEggs: 120,
    status: "Monitoring",
    feedConsumption: "52kg/day"
  },
  {
    id: "B003",
    name: "Batch Gamma", 
    breed: "Sussex",
    startDate: "2023-12-20",
    currentAge: "16 weeks",
    totalChickens: 180,
    aliveChickens: 176,
    mortality: 4,
    dailyEggs: 145,
    status: "Healthy",
    feedConsumption: "48kg/day"
  }
];

export default function Batches() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Batch Management</h1>
            <p className="text-muted-foreground">Monitor and manage your chicken batches</p>
          </div>
          <Button className="bg-gradient-primary hover:shadow-glow transition-smooth">
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
          {batches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-medium transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{batch.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{batch.breed}</p>
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
                      <span className="text-sm text-muted-foreground">Alive</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{batch.aliveChickens}</p>
                    <p className="text-xs text-muted-foreground">of {batch.totalChickens}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Egg className="h-4 w-4 text-accent" />
                      <span className="text-sm text-muted-foreground">Daily Eggs</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{batch.dailyEggs}</p>
                  </div>
                </div>

                {/* Mortality Alert */}
                {batch.mortality > 3 && (
                  <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span className="text-sm text-warning">
                      {batch.mortality} deaths recorded
                    </span>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium">{batch.currentAge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Feed/Day:</span>
                    <span className="font-medium">{batch.feedConsumption}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-medium">{new Date(batch.startDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Log Entry
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State for New Users */}
        {batches.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Batches Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first chicken batch to start tracking production and health.
              </p>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create First Batch
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}