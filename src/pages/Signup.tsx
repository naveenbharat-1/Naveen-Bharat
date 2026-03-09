import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Loader2, AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import logo from "@/assets/logo.png";
import { validateEmailDomain } from "@/lib/emailBlocklist";
import { checkPasswordStrength, type PasswordStrength } from "@/lib/passwordStrength";

const strengthColors: Record<PasswordStrength, string> = {
  weak: "bg-destructive",
  fair: "bg-yellow-500",
  strong: "bg-green-500",
};

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const passwordCheck = password.length > 0 ? checkPasswordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsNetworkError(false);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (!navigator.onLine) {
      setErrorMessage("You appear to be offline. Please check your internet connection.");
      setIsNetworkError(true);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (passwordCheck && passwordCheck.errors.length > 0 && passwordCheck.strength === "weak") {
      setErrorMessage(passwordCheck.errors[0]);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const emailError = validateEmailDomain(email.trim());
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await signup(email.trim(), password, name);
      if (error) {
        const msg = error.message?.toLowerCase() || "";
        const isNetwork = /network|fetch|timeout|abort|timed|connection/i.test(error.message || "");
        setIsNetworkError(isNetwork);

        if (msg.includes("already registered") || msg.includes("already been registered")) {
          setErrorMessage("This email is already registered. Please sign in instead.");
        } else if (isNetwork) {
          setErrorMessage("Network error — check your internet connection and try again.");
        } else if (msg.includes("password") && msg.includes("characters")) {
          setErrorMessage("Password must be at least 6 characters long.");
        } else {
          setErrorMessage(error.message || "Failed to create account");
        }
        return;
      }
      
      toast.success("Account created successfully! You can now sign in.", { duration: 5000 });
      navigate("/login", { replace: true });
      
    } catch (error: any) {
      console.error("Signup error:", error);
      const isNetwork = /network|fetch|timeout|abort|timed|connection/i.test(error.message || "");
      setIsNetworkError(isNetwork);
      setErrorMessage(isNetwork
        ? "Network error — check your internet connection and try again."
        : (error.message || "Failed to create account"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-lg text-center text-secondary-foreground">
          <div className="w-24 h-24 mx-auto mb-8 bg-secondary-foreground/20 rounded-3xl flex items-center justify-center">
            <img src={logo} alt="Sadguru Coaching Classes" className="h-16 w-16 rounded-xl" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Start Your Journey</h2>
          <p className="text-secondary-foreground/80 text-lg">
            Create an account to access personalized learning experiences and connect with our educational community.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logo} alt="Sadguru Coaching Classes" className="h-12 w-12 rounded-xl" />
            <span className="font-bold text-2xl text-foreground">Sadguru Coaching Classes</span>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground mb-8">
            Join Sadguru Coaching Classes today - Get instant access to free courses!
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              {isNetworkError ? <WifiOff className="h-5 w-5 text-destructive shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="text-sm text-destructive">{errorMessage}</p>
                {isNetworkError && (
                  <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5" onClick={handleSubmit as any}>
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Enter your full name" value={name} onChange={(e) => { setName(e.target.value); setErrorMessage(null); }} className="bg-background border-border h-12" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrorMessage(null); }} className="bg-background border-border h-12" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                  className="bg-background border-border h-12 pr-12"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {passwordCheck && (
                <div className="space-y-1.5">
                  <div className="flex gap-1 h-1.5">
                    {["weak", "fair", "strong"].map((level, i) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-colors ${
                          i === 0 ? strengthColors[passwordCheck.strength] :
                          i === 1 && (passwordCheck.strength === "fair" || passwordCheck.strength === "strong") ? strengthColors[passwordCheck.strength] :
                          i === 2 && passwordCheck.strength === "strong" ? strengthColors[passwordCheck.strength] :
                          "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{passwordCheck.strength} password</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(null); }} className="bg-background border-border h-12" />
            </div>

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Creating account...</>
              ) : (
                <><UserPlus className="h-5 w-5" /> Create Account</>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
