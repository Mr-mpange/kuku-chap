import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", eggs: 120, feed: 45 },
  { name: "Tue", eggs: 132, feed: 42 },
  { name: "Wed", eggs: 125, feed: 48 },
  { name: "Thu", eggs: 140, feed: 44 },
  { name: "Fri", eggs: 138, feed: 46 },
  { name: "Sat", eggs: 145, feed: 43 },
  { name: "Sun", eggs: 142, feed: 47 },
];

export function ProductionChart() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Weekly Production</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}