"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, auth } from "@/firebase/index";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, School, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const COLLEGE_PROGRAMS = [
  "Accountancy", "Accounting Information System",
  "Agriculture", "Economics", "Political Science", 
  "Biology", "Psychology", "Public Administration",
  "Financial Management", "Human Resource Development Management",
  "Legal Management", "Marketing Management", 
  "Entrepreneurship", "Real Estate Management",
  "Communication", "Computing Studies", "Criminology",
  "Secondary Education", "Elementary Education", "Teacher Education",
  "Civil Engineering", "Electronics Engineering", 
  "Electrical Engineering", "Industrial Engineering",
  "Mechanical Engineering", "Architecture", "BS Astronomy",
  "Law", "Medical Technology", "Medicine", "Midwifery",
  "Music", "Nursing", "Physical Therapy", 
  "Respiratory Therapy", "International Relations",
  "Graduate Studies"
];

const IS_PROGRAMS = [
  "GAS", "STEM", "ABM", "HUMSS",
  "ICT", "Home Economics",
  "Media/Visual Arts", "Literary/Theater Arts", "Music"
];

const FACULTY_TYPES = [
  "Teacher", "Staff", "Administrator", "Librarian"
];

const YEAR_LEVELS = ["1st", "2nd", "3rd", "4th"];

type VisitorType = "College Student" | "IS Student" | "Faculty";

export default function CompleteProfile() {
  const { user, role, profileComplete, loading } = useAuth();
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [visitorType, setVisitorType] = useState<VisitorType>("College Student");
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
    if (!loading && user && profileComplete === true) {
      router.replace("/dashboard");
    }
    if (user && !fullName) {
      setFullName(user.displayName || "");
    }
  }, [user, profileComplete, loading, router, fullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!fullName || !studentId || !program) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (visitorType !== "Faculty" && !yearLevel) {
      toast({ title: "Validation Error", description: "Please select your year level.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: fullName.trim(),
        studentId: studentId.trim(),
        visitorType,
        program,
        yearLevel: visitorType !== "Faculty" ? yearLevel : "",
        profileComplete: true,
      });
      
      toast({ title: "Profile Saved", description: "Welcome to NEU Library!" });
      router.replace("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrograms = () => {
    if (visitorType === "College Student") return COLLEGE_PROGRAMS;
    if (visitorType === "IS Student") return IS_PROGRAMS;
    return FACULTY_TYPES;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-[#006600]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]">
      <Card className="w-full max-w-lg shadow-2xl border-t-8 border-t-[#006600] rounded-xl overflow-hidden">
        <CardHeader className="bg-white/50 space-y-4 pb-2">
          <div className="flex justify-center mb-2">
            <img src="/neu-seal.png" alt="NEU Seal" className="w-20 h-20 object-contain" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-[#006600]">Complete Your Profile</CardTitle>
            <CardDescription className="text-sm font-medium mt-1">Help us personalize your library experience</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Visitor Type <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "College Student", icon: GraduationCap, label: "College" },
                  { id: "IS Student", icon: School, label: "IS" },
                  { id: "Faculty", icon: Briefcase, label: "Faculty" }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setVisitorType(type.id as VisitorType);
                      setProgram("");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1",
                      visitorType === type.id 
                        ? "bg-[#006600] border-[#006600] text-white shadow-lg" 
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                    )}
                  >
                    <type.icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-600">Full Name <span className="text-red-500">*</span></Label>
              <Input 
                id="fullName"
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 border-slate-200 focus-visible:ring-[#006600] rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {visitorType === "Faculty" ? "Employee ID" : "Student ID"} <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="studentId"
                placeholder="e.g. 24-12377-943"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-12 border-slate-200 focus-visible:ring-[#006600] rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {visitorType === "Faculty" ? "Position / Role" : "Academic Program"} <span className="text-red-500">*</span>
              </Label>
              <select 
                id="program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full h-12 rounded-xl border-2 border-slate-100 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#006600] transition-colors appearance-none"
                required
              >
                <option value="">Select your {visitorType === "Faculty" ? "role" : "program"}</option>
                {getPrograms().map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {visitorType !== "Faculty" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Year Level <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-4 gap-2">
                  {YEAR_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setYearLevel(level)}
                      className={cn(
                        "h-10 rounded-xl border-2 font-bold text-xs transition-all",
                        yearLevel === level 
                          ? "bg-[#006600] border-[#006600] text-white shadow-md" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#006600] hover:bg-[#004d00] text-white font-bold h-14 rounded-xl transition-all shadow-lg mt-4 uppercase tracking-widest text-sm" 
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Profile & Continue →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}