import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  ShoppingCart, 
  Star,
  MapPin,
  Package
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePreferences } from "@/context/preferences";

function resolveImageUrl(url: string): string {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url)) return url; // absolute http(s)
  if (/^data:/i.test(url)) return url; // base64 data URL
  if (url.startsWith("/")) return url; // root-relative
  // treat as uploaded path under /uploads
  return `/uploads/${url}`;
}

function firstImageUrl(images?: string[]): string | null {
  if (!images || images.length === 0) return null;
  const candidate = images.find(Boolean) || images[0];
  return resolveImageUrl(candidate);
}

const categories = ["All", "Eggs", "Feed", "Live Birds", "Equipment", "Supplies"];

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
  const [listingImages, setListingImages] = useState(""); // comma-separated URLs
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  type Product = { id: number; name: string; category: string; price: number; unit: string; inStock: boolean; seller?: string; location?: string; description?: string; rating?: number; reviews?: number; type?: string; contact?: string; details?: string; images?: string[] };

  const productsQuery = useQuery({
    queryKey: ["products", { query, category }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (category) params.set("category", category);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json() as Promise<Product[]>;
    }
  });

  const filtered = useMemo(() => {
    const data = productsQuery.data || [];
    return data;
  }, [productsQuery.data, query, category]);

  function orderNow(p: typeof productsQuery.data[number]) {
    if (!p.inStock) return;
    toast({ title: "Added to cart", description: `${p.name} — $${p.price} ${p.unit}` });
  }

  async function listProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Upload selected files first (if any)
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        const form = new FormData();
        selectedFiles.forEach(f => form.append('images', f));
        const up = await fetch('/api/uploads', { method: 'POST', body: form });
        if (!up.ok) throw new Error(await up.text());
        const data = await up.json();
        uploadedUrls = Array.isArray(data.urls) ? data.urls : [];
        setUploading(false);
      }

      const manualUrls = listingImages
        ? listingImages.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const images = [...uploadedUrls, ...manualUrls];

      // Robust price parsing (accepts $ and commas)
      const priceNumber = (()=>{
        const cleaned = (listingPrice || "").replace(/[^0-9.]/g, "");
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
      })();

      const body = { 
        name: listingName, 
        price: priceNumber, 
        category: listingCategory || category || "Misc",
        unit: listingUnit || "unit", 
        inStock: true,
        type: listingType || undefined,
        contact: listingContact || undefined,
        details: listingDetails || undefined,
        images: images.length ? images : undefined
      };

      // Optimistic update for current view
      const tempId = Date.now();
      const optimisticProduct = { id: tempId, seller: "You", location: "—", rating: 5, reviews: 0, inStock: true, description: listingDetails, ...body } as Product;
      queryClient.setQueryData(["products", { query, category }], (old: Product[] | undefined) => {
        const arr = Array.isArray(old) ? old.slice() : [];
        return [optimisticProduct, ...arr];
      });

      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(errText || "Failed to create product");
      }
      const created = await r.json();
      // Reconcile optimistic item with real one
      queryClient.setQueryData(["products", { query, category }], (old: Product[] | undefined) => {
        const arr = Array.isArray(old) ? old.slice() : [];
        return [created, ...arr.filter(p => p.id !== tempId)];
      });
      toast({ title: "Product listed", description: "Your product has been listed." });
      setOpenListDialog(false);
      setListingName(""); setListingPrice(""); setListingType(""); setListingCategory("Eggs"); setListingUnit("unit"); setListingContact(""); setListingDetails(""); setListingImages("");
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Could not list product.";
      toast({ title: "Failed", description: message });
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

        {/* Search and Filters */}
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
              <div className="flex gap-2 flex-wrap">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <Card key={product.id} className="hover:shadow-medium transition-smooth">
              <CardHeader className="pb-3">
                <div className="text-center">
                  {firstImageUrl(product.images) ? (
                    <div className="mb-3">
                      <img src={firstImageUrl(product.images) as string} alt={product.name} className="w-full h-36 object-cover rounded-md border" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} />
                    </div>
                  ) : (
                    <div className="text-4xl mb-3">🛒</div>
                  )}
                  <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
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
              <Button type="button" variant="outline" onClick={()=>setOpenListDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-primary">{saving ? 'Listing...' : 'List Product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}