import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile, type StaffProfile } from "@/lib/account.functions";
import type { AppRole } from "@/lib/constants";

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: StaffProfile | null;
  role: AppRole | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Holds the signed-in session and the matching staff profile/role.
 * The profile is resolved server-side (see account.functions.ts) so a first
 * sign-in automatically claims the seeded staff record for that email.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const result = await ensureProfile();
      setProfile(result);
    } catch (error) {
      console.error("Could not load staff profile", error);
      setProfile(null);
    }
  }

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadProfile();
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Whenever we have a session but no profile yet, resolve it.
  useEffect(() => {
    if (session && !profile) {
      void loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const value: AuthState = {
    user: session?.user ?? null,
    session,
    profile,
    role: profile?.role ?? null,
    loading,
    refreshProfile: loadProfile,
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Convenience permission helpers used across the UI. */
export function usePermissions() {
  const { role } = useAuth();
  return {
    role,
    isAdmin: role === "admin_officer",
    isManager: role === "station_manager",
    isOfficer: role === "account_officer",
    canRegister: role === "admin_officer" || role === "station_manager",
    canManageUsers: role === "admin_officer",
    canUseDatabaseAdmin: role === "admin_officer",
  };
}
