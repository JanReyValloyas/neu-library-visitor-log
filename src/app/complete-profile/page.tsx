
"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/firebase";
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

export default function CompleteProfile() {
  const { profile, loading } = useAuth();
  const db = useFirestore();
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
    if (!profile || !db) return;
    if (!program || !college || !studentId) {
      toast({ title: "Incomplete Form", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
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

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5] font-['Lexend']">
      <Card className="w-full max-w-lg shadow-2xl border-t-8 border-t-[#006600]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#006600]">Complete Your Profile</CardTitle>
          <CardDescription>We need a few more details before you can log your first visit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student / Employee ID</Label>
              <Input 
                id="studentId"
                placeholder="e.g. 24-12377-943"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-11"
                required
              />
              <p className="text-[10px] text-muted-foreground">This ID can be used for quick logging at the library entrance.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Select onValueChange={handleCollegeChange} value={college}>
                <SelectTrigger id="college" className="h-11">
                  <SelectValue placeholder="Select your college" />
                </SelectTrigger>
                <SelectContent>
                  {COLLEGES.map((c) => (
                    <SelectItem key={c.college} value={c.college}>{c.college}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Department / Program</Label>
              <Select onValueChange={setProgram} value={program} disabled={!college}>
                <SelectTrigger id="program" className="h-11">
                  <SelectValue placeholder={college ? "Select your program" : "Select college first"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 py-3 border rounded-lg px-4 bg-white">
              <Label htmlFor="is-employee" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-semibold">Are you an employee?</span>
                <span className="font-normal text-xs text-muted-foreground">Toggle if you are faculty or staff</span>
              </Label>
              <Switch 
                id="is-employee" 
                checked={isEmployee} 
                onCheckedChange={setIsEmployee} 
              />
            </div>

            {isEmployee && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="employee-type">Employee Type</Label>
                <Select onValueChange={setEmployeeType} value={employeeType}>
                  <SelectTrigger id="employee-type" className="h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#006600] hover:bg-[#004d00] text-white font-bold h-12 rounded-xl transition-all shadow-md mt-4" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Start Logging Visits"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
