
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthInstance, useFirestore } from "@/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
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
    await signOut(auth);
    setUser(null);
    setProfile(null);
    router.push("/");
  };

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
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
              title: "Access Denied",
              description: "You are not allowed to use the library. Please contact the administrator.",
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
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [auth, db, router]);

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
      });
      return () => unsubscribeProfile();
    }
  }, [user, db, auth, router]);

  useEffect(() => {
    if (!loading) {
      const isAdminRoute = pathname.startsWith("/admin");
      const isDashboardRoute = pathname.startsWith("/dashboard");
      const isProfileRoute = pathname.startsWith("/complete-profile");
      const isLoginRoute = pathname === "/";

      if (user && profile) {
        if (!profile.program && !isProfileRoute && !isAdminRoute) {
          router.push("/complete-profile");
          return;
        }

        if (profile.role === "admin" && isDashboardRoute) {
          router.push("/admin");
        } else if (profile.role === "user" && isAdminRoute) {
          router.push("/dashboard");
        } else if (isLoginRoute) {
          router.push(profile.role === "admin" ? "/admin" : "/dashboard");
        }
      } else if (!isLoginRoute && !loading) {
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
