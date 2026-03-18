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
    { college: "College of Accountancy", programs: ["BS-Accountancy", "BS-Accounting Information System"] },
    { college: "College of Agriculture", programs: ["BS-Agriculture"] },
    { college: "College of Arts and Sciences", programs: ["BA-Economics", "BS-Psychology", "BA-Public Administration", "BS-Biology", "AB-Political Science"] },
    { college: "College of Business Administration", programs: ["BS-Real Estate Management", "BSBA-Marketing Management", "BSBA-Human Resource Development and Management", "BSBA-Legal Management", "BS-Entrepreneurship", "BSBA-Financial Management"] },
    { college: "College of Communication", programs: ["BA-Communication", "BA-Broadcasting", "BA-Journalism"] },
    { college: "College of Informatics and Computing Studies", programs: ["Bachelor of Library Information Science", "BS-Information Technology", "BS-Information Systems", "BSEMC-Game Development", "BSEMC-Digital Animation", "BS-Computer Science"] },
    { college: "College of Criminology", programs: ["BS-Criminology"] },
    { college: "College of Education", programs: ["BSEd-Filipino", "BSEd-Mathematics", "BSEd-Biological Sciences", "BSEd-Physical Sciences", "BEEd-General Sciences", "BEEd-Special Education", "BEEd-Content Courses", "BSEd-Technology and Livelihood Education", "BSEd-MAPE", "BEEd-Pre-School Education", "BSEd-English", "BSEd-Social Studies"] },
    { college: "College of Engineering and Architecture", programs: ["BS-Astronomy", "BS-Industrial Engineering", "BS-Mechanical Engineering", "BS-Architecture", "BS-Electronics Engineering", "BS-Electrical Engineering", "BS-Civil Engineering"] },
    { college: "School of International Relations", programs: ["BA-Foreign Service"] },
    { college: "College of Law", programs: ["Law"] },
    { college: "College of Medical Technology", programs: ["BS-Medical Technology"] },
    { college: "College of Medicine", programs: ["Medicine"] },
    { college: "College of Midwifery", programs: ["BS-Midwifery"] },
    { college: "College of Music", programs: ["Music Preparatory and Extended Studies", "BM-Choral Conducting", "BM-Piano", "BM-Voice", "BM-Music Education"] },
    { college: "College of Nursing", programs: ["BS-Nursing"] },
    { college: "College of Physical Therapy", programs: ["BS-Physical Therapy"] },
    { college: "College of Respiratory Therapy", programs: ["BS-Respiratory Therapy"] },
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
    if (!loading && !user) router.replace("/");
    if (!loading && user && profileComplete === true) {
      if (role === "admin") router.replace("/admin");
      else router.replace("/dashboard");
    }
    if (user && !fullName) setFullName(user.displayName || "");
  }, [user, profileComplete, loading, router, fullName, role]);

  useEffect(() => {
    setSelectedCollege("");
    setSelectedProgram("");
    setYearLevel("");
  }, [visitorType]);

  const colleges = NEU_DATA[visitorType].map(item => item.college);
  const programs = selectedCollege 
    ? NEU_DATA[visitorType].find((item: any) => item.college === selectedCollege)?.programs || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    if (!fullName.trim() || !studentId.trim() || !selectedCollege || !selectedProgram || (visitorType !== "Faculty" && !yearLevel)) {
      setError("Please fill out all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: fullName.trim(),
        studentId: studentId.trim(),
        visitorType,
        college: selectedCollege,
        program: selectedProgram,
        yearLevel: visitorType === "Faculty" ? "N/A" : yearLevel,
        profileComplete: true,
      });
      toast({ title: "Profile Saved", description: "Welcome to NEU Library!" });
      router.replace(role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#006600]" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]">
      <Card className="w-full max-w-md md:max-w-2xl lg:max-w-3xl shadow-2xl border-t-8 border-t-[#006600] rounded-xl overflow-hidden bg-white">
        <CardHeader className="space-y-4 text-center md:pb-8">
          <img src="/neu-seal.png" alt="NEU Seal" className="w-20 h-20 md:w-24 md:h-24 mx-auto" />
          <CardTitle className="text-2xl md:text-3xl font-bold text-[#006600]">Complete Your Profile</CardTitle>
          <CardDescription className="text-sm md:text-base">Help us personalize your library experience</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 md:grid md:grid-cols-2 md:gap-x-8 md:space-y-0">
            <div className="md:col-span-2 space-y-3 mb-6">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Visitor Type <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {["College Student", "IS Student", "Faculty"].map((type) => (
                  <button key={type} type="button" onClick={() => setVisitorType(type as VisitorType)} className={cn("flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1", visitorType === type ? "bg-[#006600] border-[#006600] text-white shadow-lg" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200")}>
                    {type === "Faculty" ? <Briefcase className="h-5 w-5" /> : type === "IS Student" ? <School className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                    <span className="text-[10px] font-bold uppercase">{type.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 mb-4 md:mb-6"><Label className="text-xs font-bold uppercase text-slate-600">Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 border-2 rounded-xl" /></div>
            <div className="space-y-2 mb-4 md:mb-6"><Label className="text-xs font-bold uppercase text-slate-600">Institutional ID</Label><Input placeholder="e.g. 24-12345-678" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="h-12 border-2 rounded-xl" /></div>
            <div className="space-y-2 mb-4 md:mb-6"><Label className="text-xs font-bold uppercase text-slate-600">College / Department</Label><select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)} className="w-full h-12 border-2 rounded-xl px-4 bg-white text-sm"><option value="">Select...</option>{colleges.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="space-y-2 mb-4 md:mb-6"><Label className="text-xs font-bold uppercase text-slate-600">Program / Role</Label><select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} disabled={!selectedCollege} className="w-full h-12 border-2 rounded-xl px-4 bg-white text-sm disabled:opacity-50"><option value="">Select...</option>{programs.map((p: any) => <option key={p} value={p}>{p}</option>)}</select></div>
            {visitorType !== "Faculty" && (
              <div className="md:col-span-2 space-y-3 mb-6">
                <Label className="text-xs font-bold uppercase text-slate-600">Level</Label>
                <div className="flex flex-wrap gap-2">
                  {(visitorType === "College Student" ? ["1st", "2nd", "3rd", "4th", "Irregular"] : ["Grade 11", "Grade 12"]).map(l => (
                    <button key={l} type="button" onClick={() => setYearLevel(l)} className={cn("px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all", yearLevel === l ? "bg-[#006600] border-[#006600] text-white" : "bg-white text-slate-500 hover:border-slate-200")}>{l}</button>
                  ))}
                </div>
              </div>
            )}
            {error && <div className="md:col-span-2 flex items-center gap-2 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl"><AlertCircle className="h-4 w-4" />{error}</div>}
            <div className="md:col-span-2 pt-4"><Button type="submit" className="w-full bg-[#006600] h-14 rounded-xl font-bold uppercase tracking-widest text-sm" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Complete Profile →"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}