
"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/index";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.isBlocked) {
              await auth.signOut();
              setUser(null);
              setRole(null);
              setProfile(null);
              setProfileComplete(null);
              setLoading(false);
              return;
            }
            setProfile(data);
            setRole(data.role ?? "user");
            setProfileComplete(data.profileComplete === true);
          } else {
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: "user",
              isBlocked: false,
              profileComplete: false,
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
            setRole("user");
            setProfileComplete(false);
          }
        } catch (e) {
          console.error("Auth Hook Error:", e);
          setRole("user");
          setProfileComplete(false);
        }
      } else {
        setUser(null);
        setRole(null);
        setProfile(null);
        setProfileComplete(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, role, profile, profileComplete, loading };
}
