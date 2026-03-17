
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/index";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { COLLEGES } from "@/lib/colleges";
import { Loader2 } from "lucide-react";

export default function CompleteProfile() {
  const { user, role, profileComplete, loading } = useAuth();
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeType, setEmployeeType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [user, role, profileComplete, loading, router, fullName]);

  const departments = useMemo(() => {
    const selected = COLLEGES.find(c => c.college === college);
    return selected ? selected.departments : [];
  }, [college]);

  const handleCollegeChange = (val: string) => {
    setCollege(val);
    setProgram("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!fullName || !studentId || !college || !program) {
      toast({ title: "Validation Error", description: "Please fill in all required fields marked with *.", variant: "destructive" });
      return;
    }

    if (isEmployee && !employeeType) {
      toast({ title: "Validation Error", description: "Please select an employee type.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: fullName.trim(),
        studentId: studentId.trim(),
        college,
        program,
        isEmployee,
        employeeType: isEmployee ? employeeType : "",
        profileComplete: true,
      });
      
      toast({ title: "Profile Saved", description: "Your details have been recorded. Welcome to NEU Library!" });
      
      if (role === "admin") router.replace("/admin");
      else router.replace("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    } finally {
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-600 flex gap-1">
                Full Name <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="studentId" className="text-xs font-bold uppercase tracking-wider text-slate-600 flex gap-1">
                Student / Employee ID <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="studentId"
                placeholder="e.g. 24-12377-943"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-12 border-slate-200 focus-visible:ring-[#006600] rounded-xl"
                required
              />
              <p className="text-[10px] text-muted-foreground font-medium">This ID is used for quick logging at the entrance.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="college" className="text-xs font-bold uppercase tracking-wider text-slate-600 flex gap-1">
                College <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={handleCollegeChange} value={college}>
                <SelectTrigger id="college" className="h-12 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select your college" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {COLLEGES.map((c) => (
                    <SelectItem key={c.college} value={c.college} className="rounded-lg">{c.college}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program" className="text-xs font-bold uppercase tracking-wider text-slate-600 flex gap-1">
                Program / Course <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={setProgram} value={program} disabled={!college}>
                <SelectTrigger id="program" className="h-12 rounded-xl border-slate-200">
                  <SelectValue placeholder={college ? "Select your program" : "Select college first"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept} className="rounded-lg">{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4 border border-slate-100 rounded-xl px-4 bg-white shadow-sm">
              <Label htmlFor="is-employee" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-bold text-sm text-slate-800">Are you an employee?</span>
                <span className="font-medium text-[10px] text-muted-foreground uppercase">Faculty, Staff, or Admin</span>
              </Label>
              <Switch 
                id="is-employee" 
                checked={isEmployee} 
                onCheckedChange={setIsEmployee} 
                className="data-[state=checked]:bg-[#006600]"
              />
            </div>

            {isEmployee && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="employee-type" className="text-xs font-bold uppercase tracking-wider text-slate-600 flex gap-1">
                  Employee Type <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={setEmployeeType} value={employeeType}>
                  <SelectTrigger id="employee-type" className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Teacher" className="rounded-lg">Teacher</SelectItem>
                    <SelectItem value="Staff" className="rounded-lg">Staff</SelectItem>
                    <SelectItem value="Administrator" className="rounded-lg">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#006600] hover:bg-[#004d00] text-white font-bold h-14 rounded-xl transition-all shadow-lg mt-4 uppercase tracking-widest text-sm" 
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
