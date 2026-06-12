import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { loadUserSubscription, type Subscription } from "@/lib/subscription";

export type Profile = {
  id: string;
  display_name: string;
  avatar: string;
  vestibular: string;
  target_score: number;
  study_styles: string[];
  onboarded: boolean;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<Subscription | null>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (data) setProfile(data as Profile);
  };

  const loadSubscription = async (uid: string) => {
    const stored = await loadUserSubscription(uid);
    setSubscription(stored);
    return stored;
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        const uid = sess.user.id;
        setTimeout(() => {
          loadProfile(uid);
          loadSubscription(uid);
          useAppStore
            .getState()
            .hydrateFromCloud(uid)
            .catch(() => {});
        }, 0);
      } else {
        setProfile(null);
        setSubscription(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const uid = data.session.user.id;
        loadProfile(uid);
        loadSubscription(uid);
        useAppStore
          .getState()
          .hydrateFromCloud(uid)
          .catch(() => {});
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const refreshSubscription = async () => {
    if (user) return loadSubscription(user.id);
    return null;
  };

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!user) return;
    const { id: _ignoredId, ...safePatch } = patch;

    const { data, error } = await supabase
      .from("profiles")
      .update(safePatch)
      .eq("id", user.id)
      .select()
      .maybeSingle();

    if (error) throw new Error(getErrorMessage(error, "Nao foi possivel salvar o perfil."));

    if (data) {
      setProfile(data as Profile);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, ...safePatch })
      .select()
      .maybeSingle();

    if (insertError) {
      throw new Error(getErrorMessage(insertError, "Nao foi possivel criar o perfil."));
    }
    if (!inserted) throw new Error("Nao foi possivel salvar o perfil.");

    setProfile(inserted as Profile);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        loading,
        refreshProfile,
        refreshSubscription,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
