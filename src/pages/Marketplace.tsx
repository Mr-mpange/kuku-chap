import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ShoppingCart, 
  Star,
  MapPin,
  Package
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "Fresh Farm Eggs - Grade A",
    seller: "Green Valley Farm",
    location: "County A",
    price: "$3.50",
    unit: "per dozen",
    rating: 4.8,
    reviews: 24,
    image: "🥚",
    category: "Eggs",
    inStock: true,
    description: "Premium quality eggs from free-range chickens"
  },
  {
    id: 2,
    name: "Organic Chicken Feed",
    seller: "Farm Supply Co.",
    location: "County B", 
    price: "$25.00",
    unit: "per 50kg bag",
    rating: 4.6,
    reviews: 18,
    image: "🌾",
    category: "Feed",
    inStock: true,
    description: "High-protein organic feed mix for optimal chicken health"
  },
  {
    id: 3,
    name: "Live Chickens - Rhode Island Red",
    seller: "Heritage Poultry",
    location: "County C",
    price: "$15.00",
    unit: "per bird",
    rating: 4.9,
    reviews: 31,
    image: "🐔",
    category: "Live Birds",
    inStock: true,
    description: "Healthy, vaccinated Rhode Island Red hens"
  },
  {
    id: 4,
    name: "Chicken Coop Equipment",
    seller: "Farm Tech Solutions",
    location: "County A",
    price: "$120.00",
    unit: "per set",
    rating: 4.5,
    reviews: 12,
    image: "🏠",
    category: "Equipment", 
    inStock: false,
    description: "Complete coop setup with feeders and waterers"
  }
];

const categories = ["All", "Eggs", "Feed", "Live Birds", "Equipment", "Supplies"];

export default function Marketplace() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground">Buy and sell poultry products and supplies</p>
          </div>
          <Button className="bg-gradient-primary hover:shadow-glow transition-smooth">
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
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={category === "All" ? "default" : "outline"}
                    size="sm"
                    className="transition-smooth"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-medium transition-smooth">
              <CardHeader className="pb-3">
                <div className="text-center">
                  <div className="text-4xl mb-3">{product.image}</div>
                  <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
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
                  <p className="text-2xl font-bold text-primary">{product.price}</p>
                  <p className="text-sm text-muted-foreground">{product.unit}</p>
                </div>

                {/* Seller Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seller:</span>
                    <span className="font-medium">{product.seller}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{product.location}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-sm text-muted-foreground">({product.reviews})</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{product.description}</p>

                {/* Action Button */}
                <Button 
                  className="w-full bg-gradient-primary hover:shadow-glow transition-smooth"
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.inStock ? "Order Now" : "Out of Stock"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
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
    </MainLayout>
  );
}