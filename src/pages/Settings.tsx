import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { 
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Smartphone,
  Mail,
  Key,
  Database,
  Download
} from "lucide-react";
import { usePreferences } from "@/context/preferences";

export default function SettingsPage() {
  const { language: prefLanguage, currency: prefCurrency, timezone: prefTimezone, dateFormat: prefDateFormat, setLanguage: setPrefLanguage, setCurrency: setPrefCurrency, setTimezone: setPrefTimezone, setDateFormat: setPrefDateFormat } = usePreferences();
  // 2FA demo state (persisted locally)
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("twofa_enabled") === "1"; } catch { return false; }
  });
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const otpauth = useMemo(() => `otpauth://totp/ChickTrack:you@example.com?secret=${twoFASecret}&issuer=ChickTrack&period=30&digits=6`, [twoFASecret]);
  const [smsPhone, setSmsPhone] = useState("");

  // Profile state (demo defaults)
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Farmer");
  const [email, setEmail] = useState("john@farm.com");
  const [farmName, setFarmName] = useState("Sunshine Poultry Farm");
  const [location, setLocation] = useState("Rural County, State");

  // Notification state
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifLowFeed, setNotifLowFeed] = useState(true);
  const [notifHealth, setNotifHealth] = useState(true);
  const [notifReports, setNotifReports] = useState(false);
  const [notifMarketplace, setNotifMarketplace] = useState(true);

  // Preferences are managed by context (values above)

  function randomBase32(len = 16) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let s = "";
    for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
    return s;
  }

  async function downloadExport(path: string, filename: string) {
    try {
      const res = await fetch(path, { method: 'GET' });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Export started', description: `Downloading ${filename}` });
    } catch (e) {
      toast({ title: 'Export failed', description: 'Could not export file.' });
    }
  }

  function openEnable2FA() {
    setTwoFASecret(randomBase32(20));
    setTwoFACode("");
    setTwoFAOpen(true);
  }

  function verifyAndEnable2FA(e: React.FormEvent) {
    e.preventDefault();
    // Demo verification: accept any 6-digit code
    if (!/^\d{6}$/.test(twoFACode)) {
      toast({ title: "Invalid code", description: "Enter the 6-digit code from your authenticator app." });
      return;
    }
    setTwoFAEnabled(true);
    try { localStorage.setItem("twofa_enabled", "1"); } catch {}
    setTwoFAOpen(false);
    toast({ title: "Two-factor enabled", description: "2FA is now active for your account (demo)." });
  }

  function disable2FA() {
    setTwoFAEnabled(false);
    try { localStorage.removeItem("twofa_enabled"); } catch {}
    toast({ title: "Two-factor disabled", description: "2FA has been turned off (demo)." });
  }

  const [selectedTab, setSelectedTab] = useState<'profile'|'security'|'notifications'|'preferences'|'data'>('profile');

  // Load current settings from backend and hydrate UI (with fallback to localStorage)
  // This assumes an endpoint GET /api/settings that returns { profile, notifications, preferences }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.profile) {
            setFirstName(data.profile.firstName ?? firstName);
            setLastName(data.profile.lastName ?? lastName);
            setEmail(data.profile.email ?? email);
            setFarmName(data.profile.farmName ?? farmName);
            setLocation(data.profile.location ?? location);
          }
          if (data.notifications) {
            setNotifEmail(!!data.notifications.email);
            setNotifLowFeed(!!data.notifications.lowFeed);
            setNotifHealth(!!data.notifications.health);
            setNotifReports(!!data.notifications.reports);
            setNotifMarketplace(!!data.notifications.marketplace);
          }
          if (data.preferences) {
            if (data.preferences.language) setPrefLanguage(data.preferences.language);
            if (data.preferences.currency) setPrefCurrency(data.preferences.currency);
            if (data.preferences.timezone) setPrefTimezone(data.preferences.timezone);
            if (data.preferences.dateFormat) setPrefDateFormat(data.preferences.dateFormat);
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, farmName, location })
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Profile saved', description: 'Your profile has been updated.' });
      try { localStorage.setItem('profile', JSON.stringify({ firstName, lastName, email, farmName, location })); } catch {}
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save profile. Changes kept locally.' });
      try { localStorage.setItem('profile', JSON.stringify({ firstName, lastName, email, farmName, location })); } catch {}
    }
  }

  async function saveNotifications() {
    const payload = { email: notifEmail, lowFeed: notifLowFeed, health: notifHealth, reports: notifReports, marketplace: notifMarketplace };
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Notifications saved', description: 'Your notification preferences were updated.' });
      try { localStorage.setItem('notifications', JSON.stringify(payload)); } catch {}
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save notifications. Changes kept locally.' });
      try { localStorage.setItem('notifications', JSON.stringify(payload)); } catch {}
    }
  }

  async function savePreferences() {
    const payload = { language: prefLanguage, timezone: prefTimezone, currency: prefCurrency, dateFormat: prefDateFormat };
    try {
      const res = await fetch('/api/settings/preferences', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Preferences saved', description: 'Your preferences were updated.' });
      try { localStorage.setItem('preferences', JSON.stringify(payload)); } catch {}
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save preferences. Changes kept locally.' });
      try { localStorage.setItem('preferences', JSON.stringify(payload)); } catch {}
    }
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and farm preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Navigation */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Settings Menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant={selectedTab==='profile'? 'default':'ghost'} className="w-full justify-start" onClick={()=>setSelectedTab('profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant={selectedTab==='security'? 'default':'ghost'} className="w-full justify-start" onClick={()=>setSelectedTab('security')}>
                <Shield className="h-4 w-4 mr-2" />
                Security
              </Button>
              <Button variant={selectedTab==='notifications'? 'default':'ghost'} className="w-full justify-start" onClick={()=>setSelectedTab('notifications')}>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant={selectedTab==='preferences'? 'default':'ghost'} className="w-full justify-start" onClick={()=>setSelectedTab('preferences')}>
                <Globe className="h-4 w-4 mr-2" />
                Preferences
              </Button>
              <Button variant={selectedTab==='data'? 'default':'ghost'} className="w-full justify-start" onClick={()=>setSelectedTab('data')}>
                <Database className="h-4 w-4 mr-2" />
                Data & Backup
              </Button>
            </CardContent>
          </Card>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            {selectedTab==='profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmName">Farm Name</Label>
                  <Input id="farmName" value={farmName} onChange={(e)=>setFarmName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Farm Location</Label>
                  <Input id="location" value={location} onChange={(e)=>setLocation(e.target.value)} />
                </div>

                <Button onClick={saveProfile} className="bg-gradient-primary">Save Profile</Button>
              </CardContent>
            </Card>
            )}

            {/* Security Settings */}
            {selectedTab==='security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                  <div className="flex items-center gap-3 mb-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication (2FA)</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account using an authenticator app.</p>
                    </div>
                  </div>
                  {!twoFAEnabled ? (
                    <Button variant="outline" onClick={openEnable2FA}>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Enabled</Badge>
                      <Button variant="outline" onClick={disable2FA}>Disable 2FA</Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    This is a demo implementation without server-side verification.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" />
                  </div>
                  <Button variant="outline" onClick={()=>toast({ title: 'Password updated', description: 'Your password has been changed (demo).' })}>Change Password</Button>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Notification Settings */}
            {selectedTab==='notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Feed Alerts</Label>
                    <p className="text-sm text-muted-foreground">Alert when feed levels are low</p>
                  </div>
                  <Switch checked={notifLowFeed} onCheckedChange={setNotifLowFeed} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Health Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notifications for health issues</p>
                  </div>
                  <Switch checked={notifHealth} onCheckedChange={setNotifHealth} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Production Reports</Label>
                    <p className="text-sm text-muted-foreground">Weekly production summaries</p>
                  </div>
                  <Switch checked={notifReports} onCheckedChange={setNotifReports} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketplace Updates</Label>
                    <p className="text-sm text-muted-foreground">New orders and messages</p>
                  </div>
                  <Switch checked={notifMarketplace} onCheckedChange={setNotifMarketplace} />
                </div>

                <Button variant="outline" onClick={saveNotifications}>Save Notifications</Button>
              </CardContent>
            </Card>
            )}

            {/* App Preferences */}
            {selectedTab==='preferences' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  App Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={prefLanguage} onValueChange={setPrefLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={prefTimezone} onValueChange={setPrefTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="est">Eastern Time</SelectItem>
                        <SelectItem value="pst">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={prefCurrency} onValueChange={setPrefCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="kes">KES (KSh)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select value={prefDateFormat} onValueChange={setPrefDateFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button variant="outline" onClick={savePreferences}>Save Preferences</Button>
              </CardContent>
            </Card>
            )}

            {/* Data & Backup */}
            {selectedTab==='data' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Export Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button variant="outline" onClick={()=>downloadExport('/api/export/batches', 'batches.csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Batches
                    </Button>
                    <Button variant="outline" onClick={()=>downloadExport('/api/export/logs', 'logs.csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Logs
                    </Button>
                    <Button variant="outline" onClick={()=>downloadExport('/api/export/reports', 'reports.csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Reports
                    </Button>
                    <Button variant="outline" onClick={()=>downloadExport('/api/export/backup', 'backup.zip')}>
                      <Download className="h-4 w-4 mr-2" />
                      Full Backup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Enable Dialog */}
      <Dialog open={twoFAOpen} onOpenChange={setTwoFAOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Scan the code below with Google Authenticator, Authy, or any TOTP app. Then enter the 6‑digit code to verify.
            </p>
            <div className="flex items-center gap-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(otpauth)}`}
                alt="2FA QR Code"
                className="w-28 h-28 rounded-md border bg-white"
              />
              <div className="text-xs break-all">
                <div className="font-mono">Secret: {twoFASecret}</div>
                <div className="font-mono">{otpauth}</div>
              </div>
            </div>
            <div className="p-3 rounded-md bg-muted/30 border">
              <div className="text-sm font-medium mb-2">No smartphone?</div>
              <div className="text-xs text-muted-foreground mb-2">Enter your phone number to receive login codes by SMS (demo).</div>
              <div className="flex gap-2">
                <Input placeholder="e.g., +1 555 555 0123" value={smsPhone} onChange={(e)=>setSmsPhone(e.target.value)} />
                <Button type="button" variant="outline" onClick={async ()=>{
                  if (!smsPhone.trim()) { toast({ title: 'Phone required', description: 'Please enter a phone number.' }); return; }
                  try {
                    const res = await fetch('/api/sms/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'briq', to: smsPhone.trim(), message: 'Your ChickTrack code is 123456' }) });
                    if (!res.ok) throw new Error(await res.text());
                    toast({ title: 'SMS sent', description: `A 6-digit code was sent to ${smsPhone}` });
                  } catch (e) {
                    toast({ title: 'SMS failed', description: 'Could not send SMS. Please try again.' });
                  }
                }}>Send SMS code</Button>
              </div>
            </div>
            <form onSubmit={verifyAndEnable2FA} className="space-y-2">
              <Label htmlFor="otp">6-digit code</Label>
              <Input id="otp" inputMode="numeric" maxLength={6} placeholder="000000" value={twoFACode} onChange={(e)=>setTwoFACode(e.target.value.replace(/\D/g, '').slice(0,6))} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={()=>setTwoFAOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-gradient-primary">Verify & Enable</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}