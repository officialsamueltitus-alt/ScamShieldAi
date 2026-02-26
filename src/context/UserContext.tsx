import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  email: string;
  name: string;
  profile_photo: string;
  credits: number;
  searches_remaining: number;
  referral_code: string;
  is_premium: number;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  verify: (email: string, passcode: string, referralCode?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (name?: string, profile_photo?: string) => Promise<boolean>;
  applyReferral: (referralCode: string) => Promise<{ success: boolean; error?: string }>;
  subscribePremium: () => Promise<boolean>;
  useSearch: () => Promise<boolean>;
  addCredits: (credits: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async (retries = 3) => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    } catch (e) {
      if (retries > 0) {
        console.log(`Retrying refreshUser... (${retries} left)`);
        setTimeout(() => refreshUser(retries - 1), 2000);
      } else {
        console.error("Failed to refresh user", e);
        setUser(null);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        refreshUser();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const verify = async (email: string, passcode: string, referralCode?: string) => {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passcode, referralCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error };
    } catch (e) {
      console.error("Verification failed", e);
      return { success: false, error: "Network error" };
    }
  };

  const applyReferral = async (referralCode: string) => {
    try {
      const res = await fetch("/api/user/apply-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e) {
      console.error("Apply referral failed", e);
      return { success: false, error: "Network error" };
    }
  };

  const subscribePremium = async () => {
    try {
      const res = await fetch("/api/user/subscribe-premium", {
        method: "POST",
      });
      if (res.ok) {
        await refreshUser();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Subscribe premium failed", e);
      return false;
    }
  };

  const updateProfile = async (name?: string, profile_photo?: string) => {
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, profile_photo }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Update profile failed", e);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const res = await fetch("/api/auth/google/url");
      const { url } = await res.json();
      window.open(url, "google_oauth", "width=600,height=700");
    } catch (e) {
      console.error("Google login failed", e);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const useSearch = async () => {
    if (!user) return false;
    try {
      const res = await fetch("/api/user/use-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to use search", e);
      return false;
    }
  };

  const addCredits = async (credits: number) => {
    if (!user) return;
    try {
      await fetch("/api/user/add-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, credits }),
      });
      await refreshUser();
    } catch (e) {
      console.error("Failed to add credits", e);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading, 
      verify, 
      loginWithGoogle, 
      logout, 
      refreshUser, 
      updateProfile,
      applyReferral,
      subscribePremium,
      useSearch, 
      addCredits 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
