"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/index";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const reasons = ["Reading", "Researching", "Use of Computer", "Group Study", "Meeting", "Borrowing Books", "Other"];

export default function QuickCheckIn() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("quickVisitUser");
    if (!stored) { router.replace("/"); return; }
    setUserData(JSON.parse(stored));
  }, [router]);

  const handleToggleReason = (reason: string) => {
    setSelectedReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]);
  };

  const handleConfirmCheckIn = async () => {
    if (!userData || !db || selectedReasons.length === 0) return;
    setIsSubmitting(true);
    try {
      const finalReasons = selectedReasons.map(r => r === "Other" ? `Other: ${otherReason}` : r).join(", ");
      await addDoc(collection(db, "visits"), {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        program: userData.program || "N/A",
        college: userData.college || "N/A",
        visitorType: userData.visitorType || "College Student",
        isEmployee: userData.visitorType === "Faculty",
        reason: finalReasons,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split("T")[0],
        studentId: userData.studentId,
        yearLevel: userData.yearLevel || "N/A"
      });
      setShowSuccess(true);
      sessionStorage.removeItem("quickVisitUser");
      setTimeout(() => { router.replace("/"); }, 2000);
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  if (!userData && !showSuccess) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#006600]" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f8f5] items-center justify-center md:p-8">
      {showSuccess && (
        <div className="fixed inset-0 bg-[#006600] flex flex-col items-center justify-center z-[100] text-white animate-in zoom-in duration-300">
          <div className="text-8xl mb-6">✅</div>
          <h2 className="text-3xl font-bold mb-2">Visit Logged!</h2>
          <p className="text-green-100 text-lg">Thank you, {userData?.displayName}!</p>
          <div className="mt-8 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" /><p className="text-[#D4AF37] text-xs font-bold uppercase">Returning to login...</p></div>
        </div>
      )}

      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white md:rounded-3xl md:shadow-2xl overflow-hidden relative pb-32 md:pb-8">
        <header className="p-4 md:p-6 flex items-center justify-between bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="font-bold text-base md:text-xl text-slate-800">Hi, {userData?.displayName?.split(' ')[0]}!</h1>
              <p className="text-[10px] md:text-xs font-bold text-[#006600] uppercase">QUICK ENTRY • {userData?.program?.toUpperCase()}</p>
            </div>
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 bg-[#006600] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">{userData?.displayName?.charAt(0)}</div>
        </header>

        <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl border-4 border-[#D4AF37]/10">
              <Image src={PlaceHolderImages.find(img => img.id === 'library-hero')?.imageUrl || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800'} alt="NEU Library" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-6"><h2 className="text-white text-2xl md:text-3xl font-bold uppercase">Welcome Back!</h2></div>
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
        </footer>
      </div>
    </div>
  );
}