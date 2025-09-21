import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

function useWeeklyProduction() {
  return useQuery({
    queryKey: ["weekly-production"],
    queryFn: async () => {
      const res = await fetch("/api/production/weekly");
      if (!res.ok) throw new Error("Failed to load weekly production");
      return res.json() as Promise<Array<{ name: string; eggs: number; feed: number }>>;
    },
  });
}

export function ProductionChart() {
  const { data, isLoading, isError } = useWeeklyProduction();
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Weekly Production</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-sm text-muted-foreground">Loading chart...</div>}
        {isError && <div className="text-sm text-destructive">Failed to load production data.</div>}
        {!!data && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
              />
              <Area
                type="monotone"
                dataKey="eggs"
                stackId="1"
                stroke="hsl(142 76% 36%)"
                fill="hsl(142 76% 36%)"
                fillOpacity={0.6}
                name="Eggs"
              />
              <Area
                type="monotone"
                dataKey="feed"
                stackId="2"
                stroke="hsl(24 93% 56%)"
                fill="hsl(24 93% 56%)"
                fillOpacity={0.6}
                name="Feed (kg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}