import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Shield, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroFarm from "@/assets/hero-farm.jpg";
import chickenIcon from "@/assets/chicken-icon.png";

const features = [
  {
    icon: BarChart3,
    title: "Production Analytics",
    description: "Track egg production, feed consumption, and mortality rates with detailed charts and reports."
  },
  {
    icon: Shield,
    title: "Batch Management",
    description: "Organize and monitor your chicken batches with comprehensive health and performance tracking."
  },
  {
    icon: Users,
    title: "Marketplace Integration",
    description: "Connect with buyers and manage orders through our integrated marketplace platform."
  },
  {
    icon: Zap,
    title: "Real-time Monitoring",
    description: "Get instant alerts for critical events like low feed levels or health concerns."
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={chickenIcon} alt="ChickTrack" className="h-8 w-8" />
              <span className="text-xl font-bold text-primary">ChickTrack</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/dashboard">
                <Button className="bg-gradient-primary hover:shadow-glow transition-smooth">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0">
          <img 
            src={heroFarm} 
            alt="Modern chicken farm" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="lg:w-1/2">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Modern Farm
              <span className="block text-accent">Management</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Streamline your chicken farm operations with our comprehensive management system. 
              Track production, manage batches, and maximize profitability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/dashboard">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow transition-bounce">
                  Start Managing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary transition-smooth">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your Farm
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for modern chicken farm operations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-medium hover:shadow-large transition-smooth">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Farm Management?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of farmers who trust ChickTrack for their daily operations
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow transition-bounce">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={chickenIcon} alt="ChickTrack" className="h-6 w-6" />
              <span className="font-semibold text-primary">ChickTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ChickTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}