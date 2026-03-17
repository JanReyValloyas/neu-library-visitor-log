
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthInstance, useFirestore } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, ArrowRight, Shield, CreditCard } from "lucide-react";
import { useAuth, UserProfile } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Home() {
  const { loading: authLoading } = useAuth();
  const auth = useAuthInstance();
  const db = useFirestore();
  const [redirecting, setRedirecting] = useState(false);
  const [rfid, setRfid] = useState("");
  const [isLoggingId, setIsLoggingId] = useState(false);

  useEffect(() => {
    if (!auth) return;

    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Successfully signed in via redirect");
        }
      } catch (error: any) {
        console.error("Error handling redirect result:", error);
        if (error.code !== 'auth/popup-closed-by-user') {
          toast({
            title: "Sign-in Error",
            description: error.message || "An error occurred during sign-in.",
            variant: "destructive",
          });
        }
      }
    };

    checkRedirectResult();
  }, [auth]);

  const handleLogin = async () => {
    if (!auth) return;
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    try {
      setRedirecting(true);
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      setRedirecting(false);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRfidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !rfid.trim()) return;

    setIsLoggingId(true);
    try {
      const q = query(collection(db, "users"), where("studentId", "==", rfid.trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast({
          title: "Access Denied",
          description: "ID not registered. Please sign in with Google first.",
          variant: "destructive",
        });
        setIsLoggingId(false);
        return;
      }

      const userData = snap.docs[0].data() as UserProfile;

      if (userData.isBlocked) {
        toast({
          title: "Account Restricted",
          description: "Your account is currently blocked. Please see the administrator.",
          variant: "destructive",
        });
        setIsLoggingId(false);
        return;
      }

      await addDoc(collection(db, "visits"), {
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        program: userData.program || "Unknown",
        college: userData.college || "Unknown",
        isEmployee: userData.isEmployee || false,
        employeeType: userData.employeeType || "",
        reason: "ID Entry (General)",
        timestamp: serverTimestamp(),
        date: format(new Date(), "yyyy-MM-dd"),
        studentId: userData.studentId
      });

      toast({
        title: `Welcome, ${userData.displayName}!`,
        description: "Your library visit has been successfully recorded.",
      });
      setRfid("");
    } catch (error: any) {
      console.error("ID Lookup Error:", error);
      toast({
        title: "System Error",
        description: "Could not process ID at this time.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingId(false);
    }
  };

  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#006600]" />
          <p className="text-muted-foreground animate-pulse font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#f5f8f5] overflow-hidden font-['Lexend']">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[#006600]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-[28rem] shadow-2xl rounded-2xl overflow-hidden border-none z-10">
        <div className="bg-[#006600] p-8 flex flex-col items-center space-y-4">
          <div className="bg-white p-3 rounded-2xl shadow-lg">
            <Image 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/4/4d/New_Era_University_seal.svg/150px-New_Era_University_seal.svg.png"
              alt="NEU Seal"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NEU Library</h1>
          <div className="w-16 h-1 bg-[#FFD700] rounded-full" />
        </div>

        <CardContent className="bg-white p-8 space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">Library Visitor Log</h2>
            <p className="text-slate-500 text-sm font-medium">Welcome back, Eagle! Please record your visit.</p>
          </div>

          <form onSubmit={handleRfidSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#006600] tracking-widest uppercase">
                INSTITUTIONAL ID ACCESS
              </Label>
              <div className="relative group">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#006600] transition-colors" />
                <Input 
                  placeholder="RFID or Institutional ID Number" 
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-[#006600] focus:ring-[#006600]/20 rounded-xl"
                  value={rfid}
                  onChange={(e) => setRfid(e.target.value)}
                  disabled={isLoggingId}
                />
              </div>
            </div>
            <Button 
              type="submit"
              className="w-full h-12 bg-[#006600] hover:bg-[#004d00] text-white font-bold tracking-widest rounded-xl transition-all shadow-md group"
              disabled={isLoggingId || !rfid.trim()}
            >
              {isLoggingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              LOG VISIT
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-12 border-slate-200 hover:border-[#006600] hover:bg-slate-50 rounded-xl transition-all font-medium flex items-center justify-center gap-3"
              onClick={handleLogin}
              disabled={redirecting || isLoggingId}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
            <p className="text-[9px] text-center font-bold text-slate-400 tracking-widest uppercase">
              ACCESS RESTRICTED TO @NEU.EDU.PH ACCOUNTS ONLY
            </p>
          </div>
        </CardContent>

        <div className="bg-[#f5f8f5] p-5 border-t border-slate-100 text-center flex items-center justify-center gap-2">
          <Shield className="h-3 w-3 text-[#006600]" />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Secure Academic Portal © 2024 NEU
          </span>
        </div>
      </Card>
    </div>
  );
}
