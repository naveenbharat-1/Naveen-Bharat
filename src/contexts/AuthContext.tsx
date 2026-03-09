import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export type AppRole = "admin" | "student" | "teacher";

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
}

export interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  mobile: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Session helpers ──────────────────────────────────────────────────────────
const SESSION_TOKEN_KEY = "sg_session_token";
const SESSION_ID_KEY = "sg_session_id";

function detectDeviceType(): "web" | "mobile" {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent;
  const isMobileUA = /android|iphone|ipad|ipod|mobile/i.test(ua);
  if (!isMobileUA) return "web";
  // PWA / standalone mode → mobile
  const isStandalone =
    ("standalone" in navigator && (navigator as any).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches;
  return isStandalone || isMobileUA ? "mobile" : "web";
}

async function callManageSession(
  payload: Record<string, unknown>,
  accessToken: string
): Promise<Record<string, unknown> | null> {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/manage-session`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── User data fetch ──────────────────────────────────────────────────────────
async function fetchUserData(
  supabaseUser: SupabaseUser,
  isSignup = false
): Promise<{ user: User; profile: UserProfile; role: AppRole }> {
  const email = supabaseUser.email ?? "";
  const metaName = supabaseUser.user_metadata?.full_name ?? null;

  const defaults = (): { user: User; profile: UserProfile; role: AppRole } => ({
    user: { id: supabaseUser.id, email, fullName: metaName, role: "student" },
    profile: { id: supabaseUser.id, email, fullName: metaName, avatarUrl: null, mobile: null },
    role: "student",
  });

  try {
    const [profileResult, roleResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, avatar_url, mobile").eq("id", supabaseUser.id).single(),
      supabase.rpc("get_user_role", { _user_id: supabaseUser.id }),
    ]);

    let profileData = profileResult.data;

    if (profileResult.error) console.warn("[AuthContext] Profile fetch failed:", profileResult.error.message);
    if (roleResult.error) console.warn("[AuthContext] Role fetch failed:", roleResult.error.message);

    if (!profileData && isSignup) {
      await new Promise(r => setTimeout(r, 1000));
      const retry = await supabase.from("profiles").select("id, full_name, email, avatar_url, mobile").eq("id", supabaseUser.id).single();
      profileData = retry.data;
    }

    const role: AppRole = (roleResult.data as AppRole) ?? "student";
    const fullName = profileData?.full_name ?? metaName;

    return {
      user: { id: supabaseUser.id, email: profileData?.email ?? email, fullName, role },
      profile: {
        id: supabaseUser.id,
        email: profileData?.email ?? email,
        fullName,
        avatarUrl: profileData?.avatar_url ?? null,
        mobile: profileData?.mobile ?? null,
      },
      role,
    };
  } catch (err) {
    console.warn("[AuthContext] fetchUserData error:", err);
    return defaults();
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const fetchInProgress = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadUser = useCallback(async (supabaseUser: SupabaseUser | null, isSignup = false) => {
    if (!supabaseUser) {
      if (isMounted.current) { setUser(null); setProfile(null); setRole(null); }
      return;
    }

    if (fetchInProgress.current === supabaseUser.id) return;
    fetchInProgress.current = supabaseUser.id;

    try {
      const data = await fetchUserData(supabaseUser, isSignup);
      if (isMounted.current) { setUser(data.user); setProfile(data.profile); setRole(data.role); }
    } catch {
      if (isMounted.current) { setUser(null); setProfile(null); setRole(null); }
    } finally {
      fetchInProgress.current = null;
    }
  }, []);

  // Validate custom session token on mount (detects force-logout while offline)
  const validateStoredSession = useCallback(async (accessToken: string, userId: string) => {
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!storedToken) return; // no custom session yet — first login from new code

    const result = await callManageSession({ action: "validate", session_token: storedToken }, accessToken);
    if (result && result.valid === false) {
      // Session was revoked while we were offline
      toast.error("Your session was terminated because another device logged in.", { duration: 6000 });
      await supabase.auth.signOut();
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_ID_KEY);
      if (isMounted.current) { setUser(null); setProfile(null); setRole(null); }
    }
  }, []);

  // Subscribe to force_logout broadcasts for this user
  const setupRealtimeListener = useCallback((userId: string) => {
    // Clean up old channel if any
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const channel = supabase
      .channel(`session:${userId}`)
      .on("broadcast", { event: "force_logout" }, async (msg) => {
        const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
        if (msg.payload?.sessionToken && storedToken && msg.payload.sessionToken === storedToken) {
          toast.error("You were signed out because a new device logged in with your account.", { duration: 8000 });
          localStorage.removeItem(SESSION_TOKEN_KEY);
          localStorage.removeItem(SESSION_ID_KEY);
          await supabase.auth.signOut();
          if (isMounted.current) { setUser(null); setProfile(null); setRole(null); }
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;
  }, []);

  // Heartbeat: update last_active_at every 5 minutes
  const startHeartbeat = useCallback((accessToken: string) => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    heartbeatRef.current = setInterval(async () => {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!storedToken) return;
      await callManageSession({ action: "heartbeat", session_token: storedToken }, accessToken);
    }, 5 * 60 * 1000); // every 5 minutes
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    let initialLoadDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      initialLoadDone = true;
      if (session?.user) {
        const isSignup = _event === "SIGNED_IN" && !session.user.last_sign_in_at;
        await loadUser(session.user, isSignup);
        if (isMounted.current) setIsLoading(false);

        // Validate our custom session & set up realtime
        await validateStoredSession(session.access_token, session.user.id);
        setupRealtimeListener(session.user.id);
        startHeartbeat(session.access_token);
      } else {
        stopHeartbeat();
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
        if (isMounted.current) { setUser(null); setProfile(null); setRole(null); setIsLoading(false); }
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!initialLoadDone) {
        if (session?.user) {
          await loadUser(session.user);
          if (isMounted.current) setIsLoading(false);
          await validateStoredSession(session.access_token, session.user.id);
          setupRealtimeListener(session.user.id);
          startHeartbeat(session.access_token);
        } else {
          if (isMounted.current) setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      stopHeartbeat();
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [loadUser, validateStoredSession, setupRealtimeListener, startHeartbeat, stopHeartbeat]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { error };

      // Create a custom session record (enforces the 2-device limit)
      if (data.session) {
        const result = await callManageSession(
          {
            action: "create",
            device_type: detectDeviceType(),
            user_agent: navigator.userAgent,
          },
          data.session.access_token
        );

        if (result?.session_token) {
          localStorage.setItem(SESSION_TOKEN_KEY, result.session_token as string);
          localStorage.setItem(SESSION_ID_KEY, result.session_id as string);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName },
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    // Terminate our custom session record
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (storedToken) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await callManageSession({ action: "terminate", session_token: storedToken }, session.access_token);
      }
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_ID_KEY);
    }

    stopHeartbeat();
    await supabase.auth.signOut();
    if (isMounted.current) { setUser(null); setProfile(null); setRole(null); }
  };

  const refetchUserData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await loadUser(session?.user ?? null);
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: role === "admin",
        isStudent: role === "student",
        isTeacher: role === "teacher",
        login,
        signup,
        logout,
        refetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
