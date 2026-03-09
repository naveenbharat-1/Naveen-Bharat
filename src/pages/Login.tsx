import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import logo from "@/assets/branding/logo_primary_web.png";
import { validateEmailDomain } from "@/lib/emailBlocklist";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const probeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    return () => { if (probeTimerRef.current) clearTimeout(probeTimerRef.current); };
  }, []);

  const mapError = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes("email not confirmed")) return "Please verify your email before signing in. Check your inbox.";
    if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials") || lower.includes("invalid email or password")) return "Invalid email or password.";
    if (lower.includes("too many requests")) return "Too many attempts. Please wait a moment.";
    if (lower.includes("abort") || lower.includes("timeout") || lower.includes("timed out")) return "Connection timed out. Your internet may be slow — please try again.";
    if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch") || lower.includes("err_connection")) return "Network error — check your internet connection and try again.";
    return msg || "Login failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsNetworkError(false);
    setStatusText(null);
    navigatedRef.current = false;

    if (!email || !password) { setErrorMessage("Please fill in all fields"); return; }
    if (!navigator.onLine) { setErrorMessage("You appear to be offline. Please check your internet connection."); setIsNetworkError(true); return; }

    const emailError = validateEmailDomain(email.trim());
    if (emailError) { setErrorMessage(emailError); return; }

    try {
      setIsLoading(true);
      setStatusText("Signing in…");

      probeTimerRef.current = setTimeout(async () => {
        if (navigatedRef.current) return;
        setStatusText("Still connecting… checking session…");
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            navigatedRef.current = true;
            toast.success("Welcome back!");
            const destination = location.state?.from;
            navigate(destination || "/dashboard", { replace: true });
          } else {
            setStatusText(null);
            setErrorMessage("Connection is very slow. Please try again.");
            setIsNetworkError(true);
            setIsLoading(false);
          }
        } catch {
          setStatusText(null);
          setErrorMessage("Connection is very slow. Please check your internet and try again.");
          setIsNetworkError(true);
          setIsLoading(false);
        }
      }, 30000);

      const { error } = await login(email.trim(), password);

      if (probeTimerRef.current) { clearTimeout(probeTimerRef.current); probeTimerRef.current = null; }

      if (error) {
        const errorMsg = mapError(error.message || "");
        const isNetwork = /network|fetch|timeout|abort|timed|connection/i.test(error.message || "");
        setErrorMessage(errorMsg);
        setIsNetworkError(isNetwork);
        toast.error(errorMsg);
        return;
      }

      navigatedRef.current = true;
      toast.success("Welcome back!");
      const destination = location.state?.from;
      navigate(destination || "/dashboard", { replace: true });

    } catch (err: any) {
      if (probeTimerRef.current) { clearTimeout(probeTimerRef.current); probeTimerRef.current = null; }
      const errorMsg = mapError(err.message || "Something went wrong");
      const isNetwork = /network|fetch|timeout|abort|timed|connection/i.test(err.message || "");
      setErrorMessage(errorMsg);
      setIsNetworkError(isNetwork);
      toast.error(errorMsg);
    } finally {
      if (!navigatedRef.current) {
        setIsLoading(false);
        setStatusText(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-8">
            <img src={logo} alt="Sadguru Coaching Classes" className="h-14 w-14 rounded-full object-contain" width={56} height={56} />
            <span className="font-bold text-2xl text-foreground">Sadguru Coaching Classes</span>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">Sign in to access your courses</p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              {isNetworkError ? <WifiOff className="h-5 w-5 text-destructive shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="text-sm text-destructive">{errorMessage}</p>
                {isNetworkError && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={handleSubmit as any}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrorMessage(null); }} className="bg-background border-border h-12" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }} className="bg-background border-border h-12 pr-12" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={isLoading}>
              {isLoading ? (statusText || "Signing in...") : <><LogIn className="h-5 w-5" /> Sign In</>}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
      
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Empowering Young Minds</h2>
          <p className="text-primary-foreground/80 text-lg">Join Sadguru Coaching Classes today.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
