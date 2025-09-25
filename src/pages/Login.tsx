import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import chickenIcon from "@/assets/chicken-icon.png";
import { useEffect, useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpMask, setOtpMask] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((v)=>v-1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }

  async function onResendOtp() {
    if (!otpUserId) return;
    if (resendCooldown > 0) return;
    try {
      setLoading(true);
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: otpUserId })
      });
      if (!res.ok) throw new Error(await res.text());
      setResendCooldown(30); // 30s cooldown
    } catch (_e) {
      setError('Could not resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  }
      const data = await res.json();
      if (data.requireOtp) {
        setRequireOtp(true);
        setOtpUserId(data.userId);
        setOtpMask(data.phoneMasked || null);
        setOtpCode("");
        return;
      }
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (_e) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) { setError("Enter the 6-digit code."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: otpUserId, code: otpCode })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'OTP verification failed');
      }
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (_e) {
      setError('Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  }

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
          {!requireOtp ? (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="farmer@example.com"
                className="transition-smooth focus:shadow-soft"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="transition-smooth focus:shadow-soft"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:shadow-glow transition-smooth">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          ) : (
          <form className="space-y-4" onSubmit={onVerifyOtp}>
            <div className="space-y-2">
              <Label htmlFor="otp">Enter 6-digit code {otpMask ? `(sent to ${otpMask})` : ''}</Label>
              <Input id="otp" inputMode="numeric" maxLength={6} placeholder="000000" value={otpCode} onChange={(e)=>setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6))} />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">{loading ? 'Verifying...' : 'Verify & Continue'}</Button>
              <Button type="button" variant="outline" onClick={()=>{ setRequireOtp(false); setOtpUserId(null); setOtpCode(''); }}>
                Back
              </Button>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>Didn't get the code?</span>
              <Button type="button" variant="ghost" className="h-6 px-2" disabled={resendCooldown>0 || loading} onClick={onResendOtp}>
                {resendCooldown>0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </Button>
            </div>
          </form>
          )}
          
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