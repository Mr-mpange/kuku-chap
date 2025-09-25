import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Order = {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  buyerContact?: string | null;
  status: string;
  createdAt?: string;
};

function useOrders(filterStatus: string) {
  return useQuery({
    queryKey: ["orders", { status: filterStatus }],
    queryFn: async () => {
      const res = await fetch(`/api/orders?limit=100&offset=0`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = (await res.json()) as Order[];
      return filterStatus && filterStatus !== 'all' ? data.filter(o => o.status === filterStatus) : data;
    }
  });
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: orders } = useOrders(statusFilter);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, buyerContact }: { id: number; status?: string; buyerContact?: string | null }) => {
      const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, buyerContact }) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] })
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">Qty</th>
                    <th className="py-2 pr-4">Unit Price</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders || []).map(o => (
                    <tr key={o.id} className="border-t">
                      <td className="py-2 pr-4">{o.id}</td>
                      <td className="py-2 pr-4">#{o.productId}</td>
                      <td className="py-2 pr-4">{o.quantity}</td>
                      <td className="py-2 pr-4">{o.unitPrice.toFixed(2)}</td>
                      <td className="py-2 pr-4">
                        <Input defaultValue={o.buyerContact || ''} onBlur={(e)=>updateMutation.mutate({ id: o.id, buyerContact: e.target.value || null })} placeholder="Phone or email" />
                      </td>
                      <td className="py-2 pr-4">{o.status}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={()=>updateMutation.mutate({ id: o.id, status: 'confirmed' })}>Confirm</Button>
                          <Button variant="outline" size="sm" onClick={()=>updateMutation.mutate({ id: o.id, status: 'fulfilled' })}>Fulfill</Button>
                          <Button variant="destructive" size="sm" onClick={()=>updateMutation.mutate({ id: o.id, status: 'cancelled' })}>Cancel</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
