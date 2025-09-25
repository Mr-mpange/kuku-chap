import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ShoppingCart, Star, MapPin, Package, Bell } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { usePreferences } from "@/context/preferences";

function resolveImageUrl(url: string): string {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url)) return url; 
  if (/^data:/i.test(url)) return url; 
  if (url.startsWith("/")) return url; 
  return `/uploads/${url}`;
}

function firstImageUrl(images?: string[]): string | null {
  if (!images || images.length === 0) return null;
  const candidate = images.find(Boolean) || images[0];
  return resolveImageUrl(candidate);
}

const categories = ["All", "Eggs", "Feed", "Live Birds", "Equipment", "Supplies"];

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  inStock: boolean;
  seller?: string;
  location?: string;
  description?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  contact?: string;
  details?: string;
  images?: string[];
};

export default function Marketplace() {
  const { formatCurrency } = usePreferences();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openListDialog, setOpenListDialog] = useState(false);
  const [listingName, setListingName] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [listingType, setListingType] = useState("");
  const [listingCategory, setListingCategory] = useState<string>("Eggs");
  const [listingUnit, setListingUnit] = useState<string>("unit");
  const [listingContact, setListingContact] = useState("");
  const [listingDetails, setListingDetails] = useState("");
  const [listingImages, setListingImages] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState<string>("1");
  const [orderContact, setOrderContact] = useState<string>("");

  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);

  // Current user info from localStorage to filter out own posts
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id != null) setUserId(Number(u.id));
        if (u?.name) setUserName(String(u.name));
        if (u?.email) setUserEmail(String(u.email));
        if (u?.phone) setUserPhone(String(u.phone));
      }
    } catch {}
  }, []);

  // Alerts/news
  const alertsQuery = useQuery({
    queryKey: ["recent-alerts"],
    queryFn: async () => {
      const res = await apiFetch("/api/alerts/recent");
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json() as Promise<Array<{ id: number; type: "info" | "warning" | "error"; message: string; time: string }>>;
    },
  });

  const productsQuery = useQuery({
    queryKey: ["products", { query, category, offset, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (category) params.set("category", category);
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      const res = await apiFetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json() as Promise<Product[]>;
    },
  });

  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setOffset(0);
    setProducts([]);
    setHasMore(true);
  }, [query, category]);

  useEffect(() => {
    if (productsQuery.data) {
      setProducts((prev) => (offset === 0 ? productsQuery.data! : [...prev, ...productsQuery.data!]));
      setHasMore((productsQuery.data || []).length === limit);
    }
  }, [productsQuery.data]);

  // (Removed image download helpers per request)

  // Export CSV of current filtered products – moved outside useEffect
  function exportCSV() {
    const rows = [
      ['id','name','category','price','unit','inStock','seller','location','contact'],
      ...filtered.map(p => [p.id, p.name, p.category, String(p.price), p.unit, String(!!p.inStock), p.seller || '', p.location || '', p.contact || ''])
    ];
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = 'marketplace-export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  const filtered = useMemo(() => products, [products]);

  const [featuredIndex, setFeaturedIndex] = useState<Record<number, number>>({});
  const getImageByIndex = (p: Product) => {
    const idx = featuredIndex[p.id] ?? 0;
    const urls = Array.isArray(p.images) ? p.images : [];
    const url = urls[idx] ?? urls[0];
    return url ? resolveImageUrl(url) : null;
  };

  // Image viewer (lightbox) state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerProduct, setViewerProduct] = useState<Product | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const openViewer = (p: Product, index: number) => {
    setViewerProduct(p);
    setViewerIndex(index);
    setViewerOpen(true);
  };
  const viewerImages = viewerProduct && Array.isArray(viewerProduct.images) ? viewerProduct.images : [];
  const nextImage = () => {
    if (!viewerProduct) return;
    const total = viewerImages.length;
    if (total === 0) return;
    setViewerIndex((i) => (i + 1) % total);
  };
  const prevImage = () => {
    if (!viewerProduct) return;
    const total = viewerImages.length;
    if (total === 0) return;
    setViewerIndex((i) => (i - 1 + total) % total);
  };

  // Keyboard controls for lightbox
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!viewerOpen) return;
      if (e.key === 'Escape') { setViewerOpen(false); }
      if (e.key === 'ArrowRight') { nextImage(); }
      if (e.key === 'ArrowLeft') { prevImage(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerOpen, viewerImages.length]);

  // Touch swipe for lightbox
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 40; // px
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    // ignore mostly-vertical swipes
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) nextImage(); else prevImage();
    }
    touchStartX.current = null; touchStartY.current = null;
  }

  function orderNow(p: Product) {
    if (!p.inStock) return;
    setOrderProduct(p);
    setOrderQty("1");
    setOrderContact("");
    setOrderOpen(true);
  }

  async function listProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        const form = new FormData();
        selectedFiles.forEach(f => form.append("images", f));
        const up = await apiFetch("/api/uploads", { method: "POST", body: form });
        if (!up.ok) throw new Error(await up.text());
        const data = await up.json();
        uploadedUrls = Array.isArray(data.urls) ? data.urls : [];
        setUploading(false);
      }

      const manualUrls = listingImages ? listingImages.split(",").map(s => s.trim()).filter(Boolean) : [];
      const images = [...uploadedUrls, ...manualUrls];

      const priceNumber = (() => {
        const cleaned = (listingPrice || "").replace(/[^0-9.]/g, "");
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
      })();

      const combinedContact = [listingContact, userEmail, userPhone].filter(Boolean).join(' ').trim() || undefined;

      const body = {
        name: listingName,
        price: priceNumber,
        category: listingCategory || category || "Misc",
        unit: listingUnit || "unit",
        inStock: true,
        type: listingType || undefined,
        contact: combinedContact,
        details: listingDetails || undefined,
        images: images.length ? images : undefined,
        seller: 'You',
        userId: userId ?? undefined,
      };

      const tempId = Date.now();
      const optimisticProduct = { id: tempId, seller: "You", location: "—", rating: 5, reviews: 0, inStock: true, description: listingDetails, ...body } as Product;
      queryClient.setQueryData(["products", { query, category }], (old: Product[] | undefined) => {
        const arr = Array.isArray(old) ? old.slice() : [];
        return [optimisticProduct, ...arr];
      });

      const r = await apiFetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text());
      const created = await r.json();

      queryClient.setQueryData(["products", { query, category }], (old: Product[] | undefined) => {
        const arr = Array.isArray(old) ? old.slice() : [];
        return [created, ...arr.filter(p => p.id !== tempId)];
      });

      toast({ title: "Product listed", description: "Your product has been listed." });
      setOpenListDialog(false);
      setListingName(""); setListingPrice(""); setListingType(""); setListingCategory("Eggs"); setListingUnit("unit");
      setListingContact(""); setListingDetails(""); setListingImages(""); setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Could not list product." });
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground">Buy and sell poultry products and supplies</p>
          </div>
          <Button onClick={()=>setOpenListDialog(true)} className="bg-gradient-primary hover:shadow-glow transition-smooth">
            <Package className="h-4 w-4 mr-2" />
            List Product
          </Button>
        </div>

        {/* Search and Filters + Notifications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..."
                  className="pl-10"
                  value={query}
                  onChange={(e)=>setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {categories.map((c) => (
                  <Button
                    key={c}
                    variant={c === category ? "default" : "outline"}
                    size="sm"
                    className="transition-smooth"
                    onClick={()=>setCategory(c)}
                  >
                    {c}
                  </Button>
                ))}
                {/* Marketplace shows all posts (including yours). */}
                <div className="ml-auto flex items-center gap-2">
                  <div className="relative">
                    <Bell className="h-5 w-5 text-foreground" />
                    {!!(alertsQuery.data?.length) && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-white text-[10px]">
                        {Math.min(9, alertsQuery.data.length)}{alertsQuery.data.length > 9 ? '+' : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground hidden sm:inline">News</span>
                </div>
              </div>
            </div>
            {!!(alertsQuery.data?.length) && (
              <div className="mt-4 p-3 rounded-md border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground truncate">{alertsQuery.data[0].message}</div>
                  <span className="text-xs text-muted-foreground ml-3 shrink-0">{alertsQuery.data[0].time}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <Card key={product.id} className="hover:shadow-medium transition-smooth">
              <CardHeader className="pb-3">
                <div>
                  <AspectRatio ratio={1} className="mb-3 overflow-hidden rounded-full border bg-muted">
                    {getImageByIndex(product) ? (
                      <img
                        src={getImageByIndex(product) as string}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-[1.03] cursor-zoom-in"
                        onClick={() => openViewer(product, featuredIndex[product.id] ?? 0)}
                        onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-muted-foreground">🖼️</div>
                    )}
                  </AspectRatio>
                  {/* Thumbnails */}
                  {Array.isArray(product.images) && product.images.length > 1 && (
                    <div className="flex gap-2 mb-2">
                      {product.images.slice(0,4).map((u, idx) => (
                        <div key={idx} className="w-12 h-12 rounded-full border overflow-hidden bg-background cursor-pointer ring-0 hover:ring-2 hover:ring-primary/50 transition" onClick={()=>setFeaturedIndex((m)=>({ ...m, [product.id]: idx }))}>
                          <img src={resolveImageUrl(u)} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <CardTitle className="text-lg leading-tight text-center">{product.name}</CardTitle>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    {product.type && (
                      <Badge variant="outline" className="text-xs">
                        {product.type}
                      </Badge>
                    )}
                    {!product.inStock && (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</p>
                  <p className="text-sm text-muted-foreground">{product.unit || 'unit'}</p>
                </div>

                {/* Seller Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seller:</span>
                    <span className="font-medium">{product.seller || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{product.location || '—'}</span>
                  </div>
                  {product.contact && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{product.contact}</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-medium">{product.rating ?? 4.5}</span>
                    <span className="text-sm text-muted-foreground">({product.reviews ?? 0})</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{product.description}</p>
                {product.details && (
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {product.details}
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  className="w-full bg-gradient-primary hover:shadow-glow transition-smooth"
                  disabled={!product.inStock}
                  onClick={()=>orderNow(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.inStock ? "Order Now" : "Out of Stock"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                No products match your current search criteria.
              </p>
              <Button variant="outline">Clear Filters</Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {hasMore && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={()=>setOffset(o=>o+limit)} disabled={productsQuery.isFetching}>
              {productsQuery.isFetching ? 'Loading…' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* List Product Dialog */}
      <Dialog open={openListDialog} onOpenChange={setOpenListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List a Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={listProduct} className="space-y-3">
            <div>
              <Input placeholder="Product name" value={listingName} onChange={(e)=>setListingName(e.target.value)} required />
            </div>
            <div>
              <Input placeholder="Price (e.g. $10.00)" value={listingPrice} onChange={(e)=>setListingPrice(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-muted-foreground">Category</label>
                <select className="mt-1 w-full border rounded-md h-9 bg-background px-2" value={listingCategory} onChange={(e)=>setListingCategory(e.target.value)}>
                  {categories.filter(c=>c!=="All").map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Unit</label>
                <select className="mt-1 w-full border rounded-md h-9 bg-background px-2" value={listingUnit} onChange={(e)=>setListingUnit(e.target.value)}>
                  <option value="unit">unit</option>
                  <option value="kg">kg</option>
                  <option value="dozen">dozen</option>
                  <option value="bag">bag</option>
                </select>
              </div>
            </div>
            <div>
              <Input placeholder="Type (e.g., Organic eggs, Layer feed)" value={listingType} onChange={(e)=>setListingType(e.target.value)} />
            </div>
            <div>
              <Input placeholder="Contact (phone/email)" value={listingContact} onChange={(e)=>setListingContact(e.target.value)} />
            </div>
            <div>
              <Textarea placeholder="Details (any extra info, pickup, delivery, etc.)" value={listingDetails} onChange={(e)=>setListingDetails(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Images</label>
              <Input type="file" accept="image/*" multiple onChange={(e)=>{
                const files = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
                setSelectedFiles(files);
              }} />
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedFiles.map((f, idx) => (
                    <div key={idx} className="h-20 border rounded overflow-hidden">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            </div>
            <div>
              <Textarea placeholder="Image URLs (comma-separated)" value={listingImages} onChange={(e)=>setListingImages(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving} className="bg-gradient-primary">{saving ? 'Listing...' : 'List Product'}</Button>
              <Button type="button" variant="outline" onClick={()=>setOpenListDialog(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
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
                const message = err instanceof Error ? err.message : 'Could not place order';
                toast({ title: 'Order failed', description: message });
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

      {/* Image Viewer (Lightbox) */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewerProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <div className="overflow-hidden rounded-xl border bg-black">
              {viewerImages.length > 0 ? (
                <img
                  src={resolveImageUrl(viewerImages[viewerIndex])}
                  alt={`image-${viewerIndex}`}
                  className="w-full max-h-[70vh] object-contain bg-black"
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                />
              ) : (
                <div className="w-full h-[60vh] flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            {viewerImages.length > 1 && (
              <>
                <button type="button" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow">
                  ‹
                </button>
                <button type="button" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow">
                  ›
                </button>
              </>
            )}
            {viewerImages.length > 0 && (
              <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {viewerImages.map((u, i) => (
                  <div
                    key={i}
                    className={`h-16 border rounded-md overflow-hidden cursor-pointer ${i===viewerIndex ? 'ring-2 ring-primary' : ''}`}
                    onClick={()=>setViewerIndex(i)}
                  >
                    <img src={resolveImageUrl(u)} alt={`mini-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
