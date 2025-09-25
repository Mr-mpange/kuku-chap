import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ShoppingCart } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { usePreferences } from "@/context/preferences";
import { toast } from "@/hooks/use-toast";

export default function Posted() {
  type Product = { id: number; name: string; price: number; category: string; unit?: string; images?: string[]; seller?: string; contact?: string; createdAt?: string };
  const categories = ["All", "Eggs", "Feed", "Live Birds", "Equipment", "Supplies"] as const;

  const { formatCurrency } = usePreferences();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Current user info to exclude own posts
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.name) setUserName(String(u.name));
        if (u?.email) setUserEmail(String(u.email));
        if (u?.phone) setUserPhone(String(u.phone));
      }
    } catch {}
  }, []);

  function resolveImageUrl(url?: string) {
    if (!url) return "";
    if (/^(https?:)?\/\//i.test(url)) return url;
    if (url.startsWith("/")) return url;
    return `/uploads/${url}`;
  }

  const productsQuery = useQuery({
    queryKey: ["posted-products", { query, category, offset, limit, userName, userEmail, userPhone }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (category) params.set("category", category);
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      // Always exclude my posts
      const sellers: string[] = [];
      if (userName) sellers.push(userName);
      sellers.push('You');
      if (sellers.length) params.set('excludeSeller', sellers.join(','));
      const needles: string[] = [];
      if (userEmail) needles.push(userEmail);
      if (userPhone) needles.push(userPhone);
      if (needles.length) params.set('excludeContactContains', needles.join(','));
      const res = await apiFetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json() as Promise<Product[]>;
    },
  });

  useEffect(() => {
    setOffset(0);
    setProducts([]);
    setHasMore(true);
  }, [query, category, userName, userEmail, userPhone]);

  useEffect(() => {
    if (productsQuery.data) {
      setProducts((prev) => (offset === 0 ? productsQuery.data! : [...prev, ...productsQuery.data!]));
      setHasMore((productsQuery.data || []).length === limit);
    }
  }, [productsQuery.data]);

  // Order dialog
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState<string>("1");
  const [orderContact, setOrderContact] = useState<string>("");

  const filtered = useMemo(() => {
    const meName = (userName || '').toLowerCase().trim();
    const meEmail = (userEmail || '').toLowerCase().trim();
    const digits = (s: string) => s.replace(/\D+/g, '');
    const mePhone = digits(userPhone || '');
    const isMine = (p: Product) => {
      const seller = (p.seller || '').toLowerCase();
      const contact = (p.contact || '').toLowerCase();
      const contactDigits = digits(p.contact || '');
      return (
        seller === 'you' ||
        (meName && seller.includes(meName)) ||
        (meEmail && (seller.includes(meEmail) || contact.includes(meEmail))) ||
        (mePhone && (digits(seller).includes(mePhone) || contactDigits.includes(mePhone)))
      );
    };
    return products.filter(p => !isMine(p));
  }, [products, userName, userEmail, userPhone]);

  function openOrder(p: Product) {
    setOrderProduct(p);
    setOrderQty("1");
    setOrderContact("");
    setOrderOpen(true);
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Posted</h1>
            <p className="text-muted-foreground">Browse products posted by others</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((c) => (
                  <Button key={c} size="sm" variant={c===category?"default":"outline"} onClick={()=>setCategory(c)}>
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <Card key={p.id} className="hover:shadow-medium transition-smooth">
              <CardHeader className="pb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border mx-auto">
                  <AspectRatio ratio={1}>
                    {Array.isArray(p.images) && p.images[0] ? (
                      <img src={resolveImageUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">🖼️</div>
                    )}
                  </AspectRatio>
                </div>
                <CardTitle className="text-center text-base mt-2">{p.name}</CardTitle>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-lg font-semibold">{formatCurrency(p.price)}</div>
                  <div className="text-xs text-muted-foreground">{p.unit || 'unit'}</div>
                </div>
                <Button className="w-full mt-3 bg-gradient-primary" onClick={()=>openOrder(p)}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Order
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <Button variant="outline" onClick={()=>setOffset(o=>o+limit)} disabled={productsQuery.isFetching}>
              {productsQuery.isFetching ? 'Loading…' : 'Load More'}
            </Button>
          </div>
        )}
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
                const res = await apiFetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: orderProduct.id, quantity: qty, buyerContact: orderContact || undefined })});
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
