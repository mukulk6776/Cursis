"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
};

type AuthContextValue = {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = (await response.json()) as { user: CurrentUser | null };
        if (data.user) {
          setCurrentUser(data.user);
          setIsLoading(false);
          return;
        }
      }
      setCurrentUser(null);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: CurrentUser | null }) => {
        if (active) {
          setCurrentUser(data.user ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setCurrentUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setCurrentUser(null);
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        isLoading,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider."
    );
  }

  return context;
}