"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/index";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, School, Briefcase, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NEU_DATA = {
  "College Student": [
    { college: "College of Accountancy", programs: ["Accountancy", "Accounting Information System"] },
    { college: "College of Agriculture", programs: ["Agriculture"] },
    { college: "College of Arts and Sciences", programs: ["Economics", "Political Science", "Biology", "Psychology", "Public Administration"] },
    { college: "College of Business Administration", programs: ["Financial Management", "Human Resource Development Management", "Legal Management", "Marketing Management", "Entrepreneurship", "Real Estate Management"] },
    { college: "College of Communication", programs: ["Communication"] },
    { college: "College of Informatics and Computing Studies", programs: ["Computing Studies"] },
    { college: "College of Criminology", programs: ["Criminology"] },
    { college: "College of Education", programs: ["Secondary Education", "Elementary Education", "Teacher Education"] },
    { college: "College of Engineering and Architecture", programs: ["Civil Engineering", "Electronics Engineering", "Electrical Engineering", "Industrial Engineering", "Mechanical Engineering", "Architecture", "BS Astronomy"] },
    { college: "College of Law", programs: ["Law"] },
    { college: "College of Medical Technology", programs: ["Medical Technology"] },
    { college: "College of Medicine", programs: ["Medicine"] },
    { college: "College of Midwifery", programs: ["Midwifery"] },
    { college: "College of Music", programs: ["Music"] },
    { college: "College of Nursing", programs: ["Nursing"] },
    { college: "College of Physical Therapy", programs: ["Physical Therapy"] },
    { college: "College of Respiratory Therapy", programs: ["Respiratory Therapy"] },
    { college: "School of International Relations", programs: ["International Relations"] },
    { college: "School of Graduate Studies", programs: ["Graduate Studies"] },
    { college: "NEUVLE +5", programs: ["NEUVLE"] },
  ],
  "IS Student": [
    { college: "Integrated School - Academic Track", programs: ["GAS", "STEM", "ABM", "HUMSS"] },
    { college: "Integrated School - TVL Track", programs: ["ICT", "Home Economics"] },
    { college: "Integrated School - Arts and Design Track", programs: ["Media/Visual Arts", "Literary/Theater Arts", "Music"] },
  ],
  "Faculty": [
    { college: "College of Accountancy", programs: ["Teacher", "Staff"] },
    { college: "College of Agriculture", programs: ["Teacher", "Staff"] },
    { college: "College of Arts and Sciences", programs: ["Teacher", "Staff"] },
    { college: "College of Business Administration", programs: ["Teacher", "Staff"] },
    { college: "College of Communication", programs: ["Teacher", "Staff"] },
    { college: "College of Informatics and Computing Studies", programs: ["Teacher", "Staff"] },
    { college: "College of Criminology", programs: ["Teacher", "Staff"] },
    { college: "College of Education", programs: ["Teacher", "Staff"] },
    { college: "College of Engineering and Architecture", programs: ["Teacher", "Staff"] },
    { college: "College of Law", programs: ["Teacher", "Staff"] },
    { college: "College of Medical Technology", programs: ["Teacher", "Staff"] },
    { college: "College of Medicine", programs: ["Teacher", "Staff"] },
    { college: "College of Midwifery", programs: ["Teacher", "Staff"] },
    { college: "College of Music", programs: ["Teacher", "Staff"] },
    { college: "College of Nursing", programs: ["Teacher", "Staff"] },
    { college: "College of Physical Therapy", programs: ["Teacher", "Staff"] },
    { college: "College of Respiratory Therapy", programs: ["Teacher", "Staff"] },
    { college: "School of International Relations", programs: ["Teacher", "Staff"] },
    { college: "School of Graduate Studies", programs: ["Teacher", "Staff"] },
    { college: "Library", programs: ["Librarian", "Library Staff"] },
    { college: "Administration", programs: ["Administrator", "Staff"] },
  ]
} as const;

type VisitorType = keyof typeof NEU_DATA;

export default function CompleteProfile() {
  const { user, role, profileComplete, loading } = useAuth();
  const router = useRouter();
  
  const [visitorType, setVisitorType] = useState<VisitorType>("College Student");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
    if (!loading && user && profileComplete === true) {
      if (role === "admin") router.replace("/admin");
      else router.replace("/dashboard");
    }
    if (user && !fullName) {
      setFullName(user.displayName || "");
    }
  }, [user, profileComplete, loading, router, fullName, role]);

  useEffect(() => {
    setSelectedCollege("");
    setSelectedProgram("");
    setYearLevel("");
    setError("");
  }, [visitorType]);

  const colleges = NEU_DATA[visitorType].map(item => item.college);
  const programs = selectedCollege 
    ? NEU_DATA[visitorType].find((item: any) => item.college === selectedCollege)?.programs || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || !db) return;

    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!studentId.trim()) { setError("Institutional ID is required."); return; }
    if (!selectedCollege) { setError("College selection is required."); return; }
    if (!selectedProgram) { setError("Program/Department selection is required."); return; }
    if (visitorType !== "Faculty" && !yearLevel) { setError("Year/Grade level selection is required."); return; }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: fullName.trim(),
        studentId: studentId.trim(),
        visitorType,
        college: selectedCollege,
        program: selectedProgram,
        yearLevel: visitorType === "Faculty" ? "N/A" : yearLevel,
        profileComplete: true,
      });
      
      toast({ title: "Profile Saved", description: "Welcome to NEU Library!" });
      
      if (role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
      setIsSubmitting(false);
    }
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
      <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-[#006600] rounded-xl overflow-hidden bg-white">
        <CardHeader className="space-y-4 pb-2">
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
            {/* Visitor Type Selection */}
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
                    onClick={() => setVisitorType(type.id as VisitorType)}
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

            {/* Basic Info */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Full Name <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 border-2 border-slate-100 focus:border-[#006600] focus:ring-0 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Institutional ID <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="e.g. 24-12377-943"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-12 border-2 border-slate-100 focus:border-[#006600] focus:ring-0 rounded-xl"
              />
            </div>

            {/* Cascading Dropdowns */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select College/Department <span className="text-red-500">*</span></Label>
                <select 
                  value={selectedCollege}
                  onChange={(e) => {
                    setSelectedCollege(e.target.value);
                    setSelectedProgram("");
                  }}
                  className="w-full h-12 border-2 border-slate-100 rounded-xl px-4 py-2 focus:border-[#006600] focus:outline-none bg-white text-sm font-medium"
                >
                  <option value="">Select your college...</option>
                  {colleges.map(college => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </select>
              </div>

              {selectedCollege && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Program/Role <span className="text-red-500">*</span></Label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full h-12 border-2 border-slate-100 rounded-xl px-4 py-2 focus:border-[#006600] focus:outline-none bg-white text-sm font-medium"
                  >
                    <option value="">Select your program...</option>
                    {programs.map((program: string) => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Year Level - Conditional */}
            {visitorType === "College Student" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Year Level <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 flex-wrap">
                  {["1st", "2nd", "3rd", "4th", "Irregular"].map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setYearLevel(year)}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all",
                        yearLevel === year 
                          ? "bg-[#006600] border-[#006600] text-white shadow-md" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {visitorType === "IS Student" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Grade Level <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  {["Grade 11", "Grade 12"].map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setYearLevel(grade)}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all",
                        yearLevel === grade 
                          ? "bg-[#006600] border-[#006600] text-white shadow-md" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold animate-in shake duration-300">
                <AlertCircle className="h-4 w-4" />
                {error}
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
