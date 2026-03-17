"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/firebase/index";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, role, loading, router]);

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

  if (loading || (user && role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#006600] border-t-transparent"></div>
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
          <h1 className="text-white text-2xl font-bold">NEU Library</h1>
          <div className="w-16 h-1 bg-[#FFD700] rounded"></div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Library Visitor Log</h2>
            <p className="text-slate-500 text-sm mt-1">Welcome back, Eagle! Please record your visit.</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#006600] uppercase tracking-wider">
              Institutional ID Access
            </label>
            <input
              type="text"
              placeholder="RFID or Institutional ID Number"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#006600]"
            />
            <button className="w-full bg-[#006600] text-white py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-green-800 transition">
              Log Visit →
            </button>
          </div>
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-4 text-xs text-gray-400 uppercase">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full border-2 border-gray-100 rounded-lg py-3 flex items-center justify-center gap-3 hover:border-[#006600]/30 transition font-medium text-slate-700"
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
            Access restricted to <span className="text-[#006600] font-bold">@neu.edu.ph</span> accounts only
          </p>
        </div>
        <div className="bg-[#f5f8f5] p-4 text-center">
          <p className="text-xs text-gray-400">🛡️ Secure Academic Portal © 2024 NEU</p>
        </div>
      </div>
    </div>
  );
}
