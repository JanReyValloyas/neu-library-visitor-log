"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const colleges = [
  "CCS", "CBA", "COE", "COED", "CAHS", "CAS", "CRIM", "CITHM"
];

export default function CompleteProfile() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  
  const [program, setProgram] = useState("");
  const [college, setCollege] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeeType, setEmployeeType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!program || !college) {
      toast({ title: "Incomplete Form", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
        program,
        college,
        isEmployee,
        employeeType: isEmployee ? employeeType : "",
      });
      toast({ title: "Profile Updated", description: "Welcome to NEU Library!" });
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg border-t-8 border-t-accent">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Complete Your Profile</CardTitle>
          <CardDescription>We need a few more details before you can log your first visit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="program">Program / Course</Label>
              <Input 
                id="program" 
                placeholder="e.g. BS Computer Science" 
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Select onValueChange={setCollege} value={college}>
                <SelectTrigger id="college">
                  <SelectValue placeholder="Select your college" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 py-2 border rounded-lg px-4 bg-muted/30">
              <Label htmlFor="is-employee" className="flex flex-col gap-1">
                <span>Are you an employee?</span>
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
                  <SelectTrigger id="employee-type">
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
              className="w-full bg-primary hover:bg-primary/90" 
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
