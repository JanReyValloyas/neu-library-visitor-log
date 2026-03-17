
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
    if (!auth || !db) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State:", firebaseUser ? `Logged in as ${firebaseUser.email}` : "Logged out");
      
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
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
            if (data.isBlocked) {
              await signOut(auth);
              toast({
                title: "Account Blocked",
                description: "Access denied. Contact administrator.",
                variant: "destructive",
              });
              setUser(null);
              setProfile(null);
            } else {
              setProfile(data);
            }
          }
        } catch (err) {
          console.error("Profile Fetch Error:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [auth, db]);

  // Real-time updates for blocked status or role changes
  useEffect(() => {
    if (user && db && auth) {
      const unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserProfile;
          setProfile(data);
          if (data.isBlocked) {
            signOut(auth);
            router.push("/");
          }
        }
      }, (error) => {
        console.error("Profile Real-time Error:", error);
      });
      return () => unsubscribeProfile();
    }
  }, [user, db, auth, router]);

  // Route guarding
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = pathname === "/";
      const isAdminRoute = pathname.startsWith("/admin");
      const isDashboardRoute = pathname.startsWith("/dashboard");
      const isProfileRoute = pathname.startsWith("/complete-profile");

      if (!user) {
        if (!isPublicRoute) router.push("/");
      } else if (profile) {
        // Force profile completion if basic info is missing
        if (!profile.program && !isProfileRoute && !isAdminRoute) {
          router.push("/complete-profile");
        } else if (profile.role === "admin") {
          // Admins on user dashboard or login are sent to admin dashboard
          if (isDashboardRoute || isPublicRoute) router.push("/admin");
        } else {
          // Regular users on admin routes or login are sent to user dashboard
          if (isAdminRoute || isPublicRoute) router.push("/dashboard");
        }
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
