
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/firebase/index";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Loader2, UserCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { user, role, profileComplete, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [idLoading, setIdLoading] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return; // Wait for auth + firestore
    if (!user) return;   // Not logged in, stay on page
    
    if (profileComplete === false) {
      router.replace("/complete-profile");
    } else if (role === "admin") {
      router.replace("/admin");
    } else if (role === "user") {
      router.replace("/dashboard");
    }
  }, [user, role, profileComplete, loading, router]);

  const handleIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) {
      toast({ title: "ID Required", description: "Please enter your Student or Employee ID.", variant: "destructive" });
      return;
    }

    setIdLoading(true);
    setError("");

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("studentId", "==", studentIdInput.trim()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("ID not registered. Please sign in with Google first.");
        setIdLoading(false);
        return;
      }

      const userData = querySnapshot.docs[0].data();

      if (userData.isBlocked) {
        setError("You are not allowed to use the library. Please contact the administrator.");
        setIdLoading(false);
        return;
      }

      if (!userData.profileComplete) {
        setError("Please complete your profile first by signing in with Google.");
        setIdLoading(false);
        return;
      }

      sessionStorage.setItem("quickVisitUser", JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        program: userData.program,
        college: userData.college || "N/A",
        visitorType: userData.visitorType,
        yearLevel: userData.yearLevel || "N/A",
        studentId: userData.studentId,
        photoURL: userData.photoURL,
      }));

      router.push("/checkin");
    } catch (err: any) {
      console.error("ID Login Error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIdLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      setSigningIn(false);
    }
  };

  if (loading || (user && !role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#006600] border-t-transparent"></div>
          <p className="text-[#006600] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5] p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-xl overflow-hidden">
        <div className="bg-[#006600] p-8 flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl p-3">
            <img src="/neu-seal.png" alt="NEU Seal" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-white text-2xl font-bold uppercase tracking-tight">NEU Library</h1>
          <div className="w-16 h-1 bg-[#D4AF37] rounded"></div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Library Visitor Log</h2>
            <p className="text-slate-500 text-sm mt-1">Welcome back, Eagle! Please record your visit.</p>
          </div>
          <form onSubmit={handleIdLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#006600] uppercase tracking-widest">
                Institutional ID Access
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="RFID or Student ID Number"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#006600] transition-colors"
                />
              </div>
              <button 
                type="submit"
                disabled={idLoading}
                className="w-full bg-[#006600] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-green-800 transition shadow-lg flex items-center justify-center gap-2"
              >
                {idLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Visit →"}
              </button>
            </div>
          </form>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="mx-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl animate-in shake duration-300">
              <p className="text-red-600 text-[10px] text-center font-bold uppercase tracking-wide">{error}</p>
            </div>
          )}
          
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full border-2 border-slate-100 rounded-xl py-3.5 flex items-center justify-center gap-3 hover:border-[#006600]/30 hover:bg-slate-50 transition font-bold text-slate-600 text-xs uppercase tracking-wide"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {signingIn ? "Signing in..." : "Sign in with Google"}
          </button>
          
          <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
            Restricted to <span className="text-[#006600] font-bold">@neu.edu.ph</span> accounts
          </p>
        </div>
        <div className="bg-[#f5f8f5] p-5 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">🛡️ Secure Academic Portal © 2024 NEU</p>
        </div>
      </div>
    </div>
  );
}
