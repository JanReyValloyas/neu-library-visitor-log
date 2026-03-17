"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
  const { user, profile, loading, logout } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleToggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleCheckIn = async () => {
    if (!profile || !db) return;
    if (selectedReasons.length === 0) {
      toast({ title: "Selection Required", description: "Please select at least one reason.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalReasons = selectedReasons.map(r => r === "Other" ? `Other: ${otherReason}` : r).join(", ");
      await addDoc(collection(db, "visits"), {
        uid: profile.uid,
        displayName: profile.displayName,
        email: profile.email,
        program: profile.program,
        college: profile.college,
        isEmployee: profile.isEmployee,
        employeeType: profile.employeeType,
        reason: finalReasons,
        timestamp: serverTimestamp(),
        date: format(new Date(), "yyyy-MM-dd"),
      });

      toast({ title: "Check-in Successful", description: "Your visit has been recorded. Enjoy the library!" });
      setSelectedReasons([]);
      setOtherReason("");
    } catch (error: any) {
      toast({ title: "Error", description: "Could not log your visit.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#006600]" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => logout()} className="h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Welcome, {profile.displayName.split(' ')[0]}!</h1>
            <p className="text-[10px] font-bold text-[#006600] tracking-wider uppercase">PROGRAM: {profile.program}</p>
          </div>
        </div>
        <Avatar className="h-10 w-10 border-2 border-[#D4AF37]">
          <AvatarImage src={profile.photoURL} />
          <AvatarFallback className="bg-[#D4AF37] text-white">{profile.displayName[0]}</AvatarFallback>
        </Avatar>
      </header>

      {/* Hero */}
      <div className="p-4">
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30 shadow-lg">
          <Image 
            src={PlaceHolderImages.find(img => img.id === 'library-hero')?.imageUrl || 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800'} 
            alt="Library"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Welcome Section */}
      <section className="px-6 py-4 space-y-1">
        <h2 className="text-2xl font-bold text-[#006600]">Welcome to NEU Library!</h2>
        <p className="text-muted-foreground text-sm">Please select the purpose of your visit today.</p>
      </section>

      {/* Reasons List */}
      <section className="px-4 py-2 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <CheckCircle2 className="h-5 w-5 text-[#D4AF37]" />
          <h3 className="font-semibold text-sm">Reason for visit</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {reasons.map((reason) => {
            const isSelected = selectedReasons.includes(reason);
            return (
              <div key={reason} className="space-y-3">
                <div 
                  onClick={() => handleToggleReason(reason)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-[#006600] bg-[#006600]/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <Label className="font-medium cursor-pointer">{reason}</Label>
                  <Checkbox 
                    checked={isSelected} 
                    className={`h-6 w-6 rounded-lg transition-colors ${isSelected ? 'bg-[#006600] border-[#006600]' : ''}`}
                  />
                </div>
                {reason === "Other" && isSelected && (
                  <Input 
                    placeholder="Specify your reason..." 
                    className="h-12 border-2 border-[#006600]/20 focus-visible:ring-[#006600]"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sticky Footer */}
      <footer className="sticky-bottom-btn">
        <Button 
          onClick={handleCheckIn}
          disabled={isSubmitting || selectedReasons.length === 0}
          className="w-full h-14 bg-[#006600] hover:bg-[#004d00] text-white font-bold text-lg rounded-xl shadow-xl flex items-center justify-center gap-2 group"
        >
          {isSubmitting ? "Processing..." : "Confirm Check-in"}
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="text-center text-[8px] font-bold text-muted-foreground mt-3 tracking-[0.2em]">
          NEU LIBRARY MANAGEMENT SYSTEM • 2024
        </p>
      </footer>
    </div>
  );
}
