"use client";

import { useState, useMemo } from "react";
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
  const { user, role, loading } = useAuth();
  const router = useRouter();
  
  const [studentId, setStudentId] = useState("");
  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeType, setEmployeeType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!program || !college || !studentId) {
      toast({ title: "Incomplete Form", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        studentId: studentId.trim(),
        program,
        college,
        isEmployee,
        employeeType: isEmployee ? employeeType : "",
      });
      toast({ title: "Profile Updated", description: "Welcome to NEU Library!" });
      router.push("/dashboard");
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
        <CardHeader className="bg-white/50">
          <CardTitle className="text-2xl font-bold text-[#006600]">Complete Your Profile</CardTitle>
          <CardDescription>We need a few more details before you can log your first visit.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-xs font-bold uppercase tracking-wider text-slate-600">Student / Employee ID</Label>
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
              <Label htmlFor="college" className="text-xs font-bold uppercase tracking-wider text-slate-600">College</Label>
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
              <Label htmlFor="program" className="text-xs font-bold uppercase tracking-wider text-slate-600">Department / Program</Label>
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
                <span className="font-medium text-[10px] text-muted-foreground uppercase">Faculty or Staff</span>
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
                <Label htmlFor="employee-type" className="text-xs font-bold uppercase tracking-wider text-slate-600">Employee Type</Label>
                <Select onValueChange={setEmployeeType} value={employeeType}>
                  <SelectTrigger id="employee-type" className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Teacher" className="rounded-lg">Teacher</SelectItem>
                    <SelectItem value="Staff" className="rounded-lg">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#006600] hover:bg-[#004d00] text-white font-bold h-14 rounded-xl transition-all shadow-lg mt-4 uppercase tracking-widest text-sm" 
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Logging Visits"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}