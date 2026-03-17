
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthInstance, useFirestore } from "@/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "user" | "admin";
  isBlocked: boolean;
  program?: string;
  college?: string;
  isEmployee?: boolean;
  employeeType?: string;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuthInstance();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (!auth || !db) {
      console.log("Auth or DB not initialized yet");
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email || "No user");
      
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            console.log("Creating new user profile...");
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || "",
              role: "user",
              isBlocked: false,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          } else {
            const data = userDoc.data() as UserProfile;
            console.log("Existing profile loaded. Role:", data.role);
            
            if (data.isBlocked) {
              console.warn("User is blocked, signing out...");
              await signOut(auth);
              toast({
                title: "Access Denied",
                description: "Your account has been blocked. Please contact the administrator.",
                variant: "destructive",
              });
              setUser(null);
              setProfile(null);
              router.push("/");
              setLoading(false);
              return;
            }
            setProfile(data);
          }
        } catch (err) {
          console.error("Error fetching/creating profile:", err);
          toast({ title: "Auth Error", description: "Failed to load user profile.", variant: "destructive" });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [auth, db, router]);

  // Real-time profile updates (essential for role changes or blocks)
  useEffect(() => {
    if (user && db && auth) {
      const unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserProfile;
          if (data.isBlocked) {
            signOut(auth);
            router.push("/");
          }
          setProfile(data);
        }
      }, (error) => {
        console.error("Profile snapshot error:", error);
      });
      return () => unsubscribeProfile();
    }
  }, [user, db, auth, router]);

  // Route protection and redirection logic
  useEffect(() => {
    if (!loading) {
      const isAdminRoute = pathname.startsWith("/admin");
      const isDashboardRoute = pathname.startsWith("/dashboard");
      const isProfileRoute = pathname.startsWith("/complete-profile");
      const isLoginRoute = pathname === "/";

      if (user && profile) {
        // 1. Force profile completion
        if (!profile.program && !isProfileRoute && !isAdminRoute) {
          console.log("Redirecting to complete-profile");
          router.push("/complete-profile");
          return;
        }

        // 2. Role-based redirection
        if (profile.role === "admin") {
          if (isDashboardRoute || isLoginRoute) {
            console.log("Admin logged in, redirecting to /admin");
            router.push("/admin");
          }
        } else {
          // Regular user
          if (isAdminRoute || isLoginRoute) {
            console.log("User logged in, redirecting to /dashboard");
            router.push("/dashboard");
          }
        }
      } else if (!isLoginRoute) {
        // Not logged in, and not on login page
        console.log("Not logged in, redirecting to /");
        router.push("/");
      }
    }
  }, [user, profile, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
