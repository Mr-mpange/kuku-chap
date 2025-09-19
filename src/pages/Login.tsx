import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import chickenIcon from "@/assets/chicken-icon.png";

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-large">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            <img src={chickenIcon} alt="ChickTrack" className="w-10 h-10" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your ChickTrack account</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="farmer@example.com"
                className="transition-smooth focus:shadow-soft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="transition-smooth focus:shadow-soft"
              />
            </div>
            <Link to="/dashboard">
              <Button className="w-full bg-gradient-primary hover:shadow-glow transition-smooth">
                Sign In
              </Button>
            </Link>
          </form>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}