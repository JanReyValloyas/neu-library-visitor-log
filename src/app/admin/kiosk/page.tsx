"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/firebase/index";
import { collection, query, where, getDocs, limit, GoogleAuthProvider, signInWithPopup, doc, getDoc, setDoc, serverTimestamp, signOut } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserCircle, LogOut, Clock, Monitor } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function KioskMode() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("studentId", "==", studentId.trim()), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast({ title: "ID not registered", description: "Please sign in with Google first.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const userData = snap.docs[0].data();
      if (userData.isBlocked) {
        toast({ title: "Access Denied", description: "You are not allowed to use the library.", variant: "destructive" });
        setLoading(false);
        return;
      }

      sessionStorage.setItem("quickVisitUser", JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        program: userData.program,
        college: userData.college,
        visitorType: userData.visitorType,
        yearLevel: userData.yearLevel,
        studentId: userData.studentId,
        photoURL: userData.photoURL,
      }));

      router.push("/checkin");
    } catch (error) {
      console.error("Kiosk ID error:", error);
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: "neu.edu.ph" });
      const result = await (await import("firebase/auth")).signInWithPopup(auth, provider);
      
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: "user",
          isBlocked: false,
          profileComplete: false,
          createdAt: serverTimestamp(),
        });
        router.push("/complete-profile");
        return;
      }
      
      const data = userSnap.data();
      if (!data.profileComplete) {
        router.push("/complete-profile");
        return;
      }
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Kiosk Google error:", error);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8f5] flex flex-col overflow-hidden">
      <header className="bg-white border-b p-6 md:p-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <img src="/neu-seal.png" alt="NEU Seal" className="w-16 h-16 md:w-20 md:h-20" />
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#006600]">NEU Library Kiosk</h1>
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold mt-1">
              <Clock className="h-5 w-5" />
              <span className="text-xl">{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              <span className="ml-2 text-sm uppercase tracking-widest">{time.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push("/admin")}
          className="h-14 px-8 border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-sm rounded-xl"
        >
          <LogOut className="h-5 w-5 mr-2" /> Exit Kiosk
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl p-10 md:p-20 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-slate-800 uppercase tracking-tighter">Enter Student ID</h2>
            <p className="text-slate-400 text-xl font-medium">Scan your RFID or type your ID number below</p>
          </div>

          <form onSubmit={handleIdSubmit} className="space-y-6">
            <div className="relative">
              <UserCircle className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 text-[#006600]" />
              <input
                type="text"
                autoFocus
                placeholder="00-00000-000"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full border-4 border-slate-100 rounded-[1.5rem] pl-20 pr-8 py-8 md:py-10 text-3xl md:text-5xl font-bold focus:outline-none focus:border-[#006600] transition-all text-center tracking-widest text-slate-800"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-24 md:h-32 bg-[#006600] hover:bg-green-800 text-white rounded-[1.5rem] text-2xl md:text-4xl font-black uppercase tracking-[0.2em] shadow-xl transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="h-10 w-10 animate-spin" /> : "Log Visit →"}
            </Button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t-2 border-slate-100"></div>
            <span className="mx-8 text-xl font-bold text-slate-300 uppercase tracking-[0.3em]">OR</span>
            <div className="flex-grow border-t-2 border-slate-100"></div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            variant="outline"
            className="w-full h-20 md:h-24 border-2 border-slate-100 rounded-[1.25rem] text-xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-4"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            First Time? Sign in with Google
          </Button>
        </div>
      </main>

      <footer className="p-8 text-center bg-white/50 border-t">
        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">New Era University • Library Management System • 2024</p>
      </footer>
    </div>
  );
}
