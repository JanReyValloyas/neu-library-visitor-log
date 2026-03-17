"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, auth } from "@/firebase/index";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useRouter } from "next/navigation";

const reasons = [
  "Reading",
  "Researching",
  "Use of Computer",
  "Group Study",
  "Meeting",
  "Borrowing Books",
  "Other"
];

export default function Dashboard() {
  const { user, profile, profileComplete, loading } = useAuth();
  const router = useRouter();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user && !showSuccess) {
      router.replace("/");
    }
    if (!loading && user && profileComplete === false) {
      router.replace("/complete-profile");
    }
  }, [user, profileComplete, loading, router, showSuccess]);

  const handleToggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleConfirmCheckIn = async () => {
    if (!user || !db) return;
    if (selectedReasons.length === 0) {
      toast({ title: "Selection Required", description: "Please select at least one reason.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalReasons = selectedReasons.map(r => r === "Other" ? `Other: ${otherReason}` : r).join(", ");
      
      // Save visit with full profile details consistent with Quick Entry schema
      await addDoc(collection(db, "visits"), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        program: profile?.program || "N/A",
        college: profile?.college || "N/A",
        visitorType: profile?.visitorType || "College Student",
        isEmployee: profile?.visitorType === "Faculty",
        reason: finalReasons,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split("T")[0],
        studentId: profile?.studentId || "N/A",
        yearLevel: profile?.yearLevel || "N/A",
      });

      setShowSuccess(true);
      
      // Kiosk Mode: Auto sign-out and redirect after 2 seconds
      setTimeout(async () => {
        try {
          await signOut(auth);
          router.replace("/");
        } catch (err) {
          console.error("Sign out error:", err);
          router.replace("/");
        }
      }, 2000);

    } catch (error: any) {
      console.error("Check-in error:", error);
      toast({ title: "Error", description: "Could not log your visit.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  if (loading || (!user && !showSuccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#006600]" />
          <p className="text-muted-foreground animate-pulse font-bold text-xs uppercase tracking-widest">Verifying Identity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-32 animate-in fade-in duration-500 bg-[#f5f8f5]">
      {showSuccess && (
        <div className="fixed inset-0 bg-[#006600] flex flex-col items-center justify-center z-[100] text-white animate-in zoom-in duration-300">
          <div className="text-8xl mb-6">✅</div>
          <h2 className="text-3xl font-bold mb-2">Visit Logged!</h2>
          <p className="text-green-100 text-lg">Thank you, {user?.displayName}!</p>
          <div className="mt-8 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
              Signing out for next visitor...
            </p>
          </div>
        </div>
      )}

      <header className="p-4 flex items-center justify-between bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-9 w-9 text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-base leading-tight text-slate-800">Welcome, {user?.displayName?.split(' ')[0]}!</h1>
            <p className="text-[10px] font-bold text-[#006600] tracking-wider uppercase">LIBRARY PORTAL • {profile?.program?.toUpperCase() || 'USER'}</p>
          </div>
        </div>
        <Avatar className="h-10 w-10 border-2 border-[#D4AF37] shadow-sm">
          <AvatarImage src={user?.photoURL || ""} />
          <AvatarFallback className="bg-[#D4AF37] text-white font-bold">{user?.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
      </header>

      <div className="p-4">
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-[#D4AF37]/20 shadow-xl group">
          <Image 
            src={PlaceHolderImages.find(img => img.id === 'library-hero')?.imageUrl || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800'} 
            alt="NEU Library"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </div>

      <section className="px-6 py-4 space-y-1">
        <h2 className="text-2xl font-bold text-[#006600]">Welcome to NEU Library!</h2>
        <p className="text-muted-foreground text-sm font-medium">Please select the purpose of your visit today.</p>
      </section>

      <section className="px-4 py-2 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <CheckCircle2 className="h-5 w-5 text-[#D4AF37]" />
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-700">Reason for visit</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {reasons.map((reason) => {
            const isSelected = selectedReasons.includes(reason);
            return (
              <div key={reason} className="space-y-3">
                <div 
                  onClick={() => handleToggleReason(reason)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                    isSelected ? 'border-[#006600] bg-[#006600]/5' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <Label className="font-bold text-sm text-slate-700 cursor-pointer">{reason}</Label>
                  <Checkbox 
                    checked={isSelected} 
                    className={`h-6 w-6 rounded-lg transition-colors border-slate-200 ${isSelected ? 'bg-[#006600] border-[#006600]' : ''}`}
                  />
                </div>
                {reason === "Other" && isSelected && (
                  <Input 
                    placeholder="Specify your reason..." 
                    className="h-12 border-2 border-[#006600]/20 focus-visible:ring-[#006600] rounded-xl shadow-inner animate-in slide-in-from-top-2"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[28rem] p-4 bg-white/80 backdrop-blur-md z-50">
        <div className="w-full">
          <Button 
            onClick={handleConfirmCheckIn}
            disabled={isSubmitting || selectedReasons.length === 0}
            className="w-full h-14 bg-[#006600] hover:bg-[#004d00] text-white font-bold text-base rounded-xl shadow-2xl flex items-center justify-center gap-2 group uppercase tracking-widest transition-all active:scale-95"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Check-in"}
            {!isSubmitting && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
          </Button>
          <p className="text-center text-[8px] font-bold text-muted-foreground mt-4 tracking-[0.25em] uppercase">
            NEU LIBRARY MANAGEMENT SYSTEM • 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
