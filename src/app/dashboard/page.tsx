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
import { useRouter } from "navigation";

const reasons = ["Reading", "Researching", "Use of Computer", "Group Study", "Meeting", "Borrowing Books", "Other"];

export default function Dashboard() {
  const { user, profile, profileComplete, loading } = useAuth();
  const router = useRouter();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user && !showSuccess) router.replace("/");
    if (!loading && user && profileComplete === false) router.replace("/complete-profile");
  }, [user, profileComplete, loading, router, showSuccess]);

  const handleToggleReason = (reason: string) => {
    setSelectedReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]);
  };

  const handleConfirmCheckIn = async () => {
    if (!user || !db || selectedReasons.length === 0) return;
    setIsSubmitting(true);
    try {
      const finalReasons = selectedReasons.map(r => r === "Other" ? `Other: ${otherReason}` : r).join(", ");
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
      setTimeout(async () => { await signOut(auth); router.replace("/"); }, 2000);
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  if (loading || (!user && !showSuccess)) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#006600]" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f8f5] items-center justify-center md:p-8">
      {showSuccess && (
        <div className="fixed inset-0 bg-[#006600] flex flex-col items-center justify-center z-50 text-white px-8">
          {/* NEU Seal */}
          <img 
            src="/neu-seal.png" 
            alt="NEU Seal"
            className="w-20 h-20 object-contain mb-6 animate-bounce"
          />

          {/* Welcome Message */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2">
            Welcome to NEU Library!
          </h1>

          {/* Gold divider */}
          <div className="w-24 h-1 bg-[#D4AF37] rounded mb-6"/>

          {/* Checkmark */}
          <div className="text-6xl mb-4">✅</div>

          {/* Visit Logged */}
          <h2 className="text-xl font-bold mb-2">
            Visit Logged Successfully!
          </h2>

          {/* User name */}
          <p className="text-green-200 text-lg text-center">
            Thank you, {user?.displayName}!
          </p>

          {/* Program */}
          <p className="text-green-300 text-sm text-center mt-1">
            {profile?.program}
          </p>

          {/* Divider */}
          <div className="w-32 h-px bg-green-500 my-6"/>

          {/* Date and Time */}
          <p className="text-green-200 text-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric", 
              month: "long", 
              day: "numeric"
            })}
          </p>
          <p className="text-green-300 text-xs mt-1">
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>

          {/* Returning to login */}
          <div className="flex items-center gap-2 mt-8">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#D4AF37] border-t-transparent">
            </div>
            <p className="text-[#D4AF37] text-xs uppercase tracking-widest font-semibold">
              Signing out...
            </p>
          </div>

          {/* Footer */}
          <p className="absolute bottom-6 text-green-400 text-[10px] uppercase tracking-widest">
            NEU Library Management System • 2024
          </p>
        </div>
      )}

      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white md:rounded-3xl md:shadow-2xl overflow-hidden relative pb-32 md:pb-8">
        <header className="p-4 md:p-6 flex items-center justify-between bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="font-bold text-base md:text-xl text-slate-800">Hi, {user?.displayName?.split(' ')[0]}!</h1>
              <p className="text-[10px] md:text-xs font-bold text-[#006600] uppercase">{profile?.program || 'User'}</p>
            </div>
          </div>
          <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-[#D4AF37]"><AvatarImage src={user?.photoURL || ""} /><AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback></Avatar>
        </header>

        <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl border-4 border-[#D4AF37]/10">
              <Image src={PlaceHolderImages.find(img => img.id === 'library-hero')?.imageUrl || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800'} alt="NEU Library" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                 <h2 className="text-xl md:text-2xl font-bold text-white">NEU Library</h2>
                 <p className="text-green-100 text-xs md:text-sm">Main Academic Portal</p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
               <h3 className="text-2xl font-bold text-[#006600]">Check-in Form</h3>
               <p className="text-muted-foreground text-sm">Please select the purpose of your visit to help us improve library services.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-5 w-5 text-[#D4AF37]" /><h3 className="font-bold text-xs uppercase tracking-widest text-slate-700">Reason for visit</h3></div>
            <div className="space-y-3">
              {reasons.map((reason) => {
                const isSelected = selectedReasons.includes(reason);
                return (
                  <div key={reason} className="space-y-3">
                    <div onClick={() => handleToggleReason(reason)} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[#006600] bg-[#006600]/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <Label className="font-bold text-sm text-slate-700 cursor-pointer">{reason}</Label>
                      <Checkbox checked={isSelected} className={`h-6 w-6 rounded-lg ${isSelected ? 'bg-[#006600] border-[#006600]' : ''}`} />
                    </div>
                    {reason === "Other" && isSelected && <Input placeholder="Specify..." className="h-12 border-2 border-[#006600]/20 rounded-xl" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="fixed bottom-0 md:relative left-0 right-0 p-4 md:p-8 bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none z-50">
          <Button onClick={handleConfirmCheckIn} disabled={isSubmitting || selectedReasons.length === 0} className="w-full h-14 bg-[#006600] text-white font-bold md:text-lg rounded-xl shadow-2xl flex items-center justify-center gap-2 uppercase transition-transform active:scale-95">
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirm Check-in"}
            {!isSubmitting && <ArrowRight className="h-5 w-5" />}
          </Button>
          <p className="text-center text-[8px] md:text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.2em]">NEU Library Management System • 2024</p>
        </footer>
      </div>
    </div>
  );
}
