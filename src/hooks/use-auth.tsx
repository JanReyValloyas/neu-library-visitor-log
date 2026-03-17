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
  studentId?: string;
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
      localStorage.removeItem('userRole');
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
            localStorage.setItem('userRole', 'user');
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
              localStorage.removeItem('userRole');
            } else {
              setProfile(data);
              localStorage.setItem('userRole', data.role);
            }
          }
        } catch (err) {
          console.error("Profile Fetch Error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
        localStorage.removeItem('userRole');
      }
    });

    return () => unsubscribeAuth();
  }, [auth, db]);

  // Real-time listener for profile updates (blocking/role changes)
  useEffect(() => {
    if (user && db && auth) {
      const unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserProfile;
          setProfile(data);
          localStorage.setItem('userRole', data.role);
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
