import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

// TODO: Replace with your actual Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Debug environment variables
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key exists:", !!supabaseAnonKey);

// Create a single Supabase client instance at module scope
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on mount
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    checkUser();
  }, [supabase]);

  const signInWithGoogle = async () => {
    try {
      // Log where we're redirecting to
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error: error };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error during sign in"),
      };
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    try {
      // Validate email and password before sending to Supabase
      if (!email || !email.includes("@")) {
        return { error: new Error("Please enter a valid email address") };
      }

      if (!password || password.length < 6) {
        return { error: new Error("Password must be at least 6 characters") };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Supabase signup error:", error);
        return { error: error };
      }

      // Check if we need email confirmation
      if (data?.user?.identities?.length === 0) {
        console.log("User already exists, needs to sign in instead");
        return {
          error: new Error(
            "An account with this email already exists. Please sign in instead."
          ),
        };
      }

      if (data?.user?.id) {
        console.log("Signup successful for user:", data.user.id);
        return { error: null };
      } else {
        console.error("Signup response had no user ID:", data);
        return {
          error: new Error("Registration incomplete. Please try again."),
        };
      }
    } catch (error) {
      console.error("Error signing up with password:", error);
      return {
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error during sign up"),
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      return { error: error };
    } catch (error) {
      console.error("Error resetting password:", error);
      return {
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error during password reset"),
      };
    }
  };

  const signOut = async () => {
    try {
      console.log("SupabaseContext: Signing out user");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }
      // Clear user from context immediately after successful sign out
      setUser(null);
      console.log("SupabaseContext: User signed out successfully");
      return { error: null };
    } catch (error) {
      console.error("Error signing out:", error);
      // Ensure user state is cleared even if sign out throws an error
      setUser(null);
      return {
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error during sign out"),
      };
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        user,
        loading,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};
