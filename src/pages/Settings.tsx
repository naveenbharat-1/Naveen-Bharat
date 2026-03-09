/**
 * Settings.tsx
 * =============
 * User settings and preferences page.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, Bell, Moon, Lock, Shield, 
  Monitor, Smartphone, Trash2, LogOut, Save,
  RefreshCw, WifiOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SESSION_TOKEN_KEY = "sg_session_token";

interface SessionRow {
  id: string;
  session_token: string;
  device_type: "web" | "mobile";
  user_agent: string | null;
  last_active_at: string;
  logged_in_at: string;
  is_active: boolean;
}

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, profile, user, logout, isLoading: authLoading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [terminatingToken, setTerminatingToken] = useState<string | null>(null);

  const currentToken = localStorage.getItem(SESSION_TOKEN_KEY);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setSessionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("id, session_token, device_type, user_agent, last_active_at, logged_in_at, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("logged_in_at", { ascending: false });

      if (!error && data) setSessions(data as SessionRow[]);
    } finally {
      setSessionsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) fetchSessions();
  }, [isAuthenticated, user, fetchSessions]);

  const handleTerminateSession = async (sessionToken: string) => {
    if (sessionToken === currentToken) return; // can't kill own current session here
    setTerminatingToken(sessionToken);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/manage-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "terminate", session_token: sessionToken }),
      });

      if (res.ok) {
        toast.success("Session terminated");
        setSessions(prev => prev.filter(s => s.session_token !== sessionToken));
      } else {
        toast.error("Failed to terminate session");
      }
    } finally {
      setTerminatingToken(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDeleteAccount = () => {
    toast.info("Please contact support to delete your account");
  };

  if (!authLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Page Header */}
      <div className="bg-primary px-4 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-primary-foreground">Settings</h1>
      </div>

      <main className="flex-1 p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="flex-1">
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates via email</div>
              </Label>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="flex-1">
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">Receive browser notifications</div>
              </Label>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex-1">
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">Use dark theme</div>
              </Label>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Devices currently logged into your account (max 2)</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchSessions} disabled={sessionsLoading}>
                <RefreshCw className={`h-4 w-4 ${sessionsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-6">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <WifiOff className="h-8 w-8" />
                <p className="text-sm">No active sessions found</p>
                <p className="text-xs">Sessions are tracked when you log in via the app</p>
              </div>
            ) : (
              sessions.map((s) => {
                const isCurrent = s.session_token === currentToken;
                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${isCurrent ? "border-primary/30 bg-primary/5" : "border-border"}`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${s.device_type === "mobile" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {s.device_type === "mobile" ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm capitalize">{s.device_type}</span>
                        {isCurrent && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">This device</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {s.user_agent ? s.user_agent.substring(0, 60) + "..." : "Unknown browser"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last active {formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => handleTerminateSession(s.session_token)}
                        disabled={terminatingToken === s.session_token}
                      >
                        {terminatingToken === s.session_token ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <LogOut className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2">
              <strong>Session Limit Policy:</strong> Each account can be used on up to 2 devices simultaneously. If you log in from a third device, your oldest session will be automatically signed out.
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="two-factor" className="flex-1">
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
              </Label>
              <Switch
                id="two-factor"
                checked={twoFactor}
                onCheckedChange={setTwoFactor}
              />
            </div>
            <Separator />
            <Button variant="outline" className="w-full justify-start gap-2">
              <Lock className="h-4 w-4" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button className="w-full" onClick={() => toast.success("Settings saved!")}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </main>
    </div>
  );
};

export default Settings;
