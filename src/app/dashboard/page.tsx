
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const reasons = ["Reading", "Researching", "Use of Computer", "Meeting", "Borrowing Books", "Other"];

export default function Dashboard() {
  const { profile } = useAuth();
  const db = useFirestore();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!profile || !db) return;
    const q = query(
      collection(db, "visits"),
      where("uid", "==", profile.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisits(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, db]);

  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !db) return;
    if (!reason) {
      toast({ title: "Reason Required", description: "Please select a reason for your visit.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalReason = reason === "Other" ? otherReason : reason;
      await addDoc(collection(db, "visits"), {
        uid: profile.uid,
        displayName: profile.displayName,
        email: profile.email,
        program: profile.program,
        college: profile.college,
        isEmployee: profile.isEmployee,
        employeeType: profile.employeeType,
        reason: finalReason,
        timestamp: serverTimestamp(),
        date: format(new Date(), "yyyy-MM-dd"),
      });

      toast({ title: "Visit Logged", description: "Your visit has been successfully recorded." });
      setIsOpen(false);
      setReason("");
      setOtherReason("");
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Failed to log visit.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVisits = visits.filter(v => 
    v.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid gap-8">
          {/* Welcome Card */}
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-white/20">
                  <AvatarImage src={profile.photoURL} referrerPolicy="no-referrer" />
                  <AvatarFallback className="text-3xl text-primary">{profile.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left space-y-2">
                  <h1 className="text-3xl font-bold font-headline">Welcome to NEU Library!</h1>
                  <p className="text-primary-foreground/90 text-lg">{profile.displayName}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                    <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                      {profile.program}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                      {profile.college}
                    </Badge>
                  </div>
                </div>
                <div className="md:ml-auto">
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl font-bold px-8">
                        <Plus className="mr-2 h-5 w-5" />
                        Log My Visit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Log Your Library Visit</DialogTitle>
                        <DialogDescription>
                          Let us know the purpose of your visit today.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleLogVisit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Reason for visit</Label>
                          <Select onValueChange={setReason} value={reason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {reasons.map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {reason === "Other" && (
                          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <Label>Specify reason</Label>
                            <Input 
                              placeholder="Type your reason here..." 
                              value={otherReason}
                              onChange={(e) => setOtherReason(e.target.value)}
                              required
                            />
                          </div>
                        )}
                        <DialogFooter className="pt-4">
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Logging..." : "Confirm & Log"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visit History */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Your Visit History
              </h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter by reason..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card className="border-none shadow-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading history...
                      </TableCell>
                    </TableRow>
                  ) : filteredVisits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <BookOpen className="h-12 w-12 opacity-20" />
                          <p>No visits found matching your search.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVisits.map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          {visit.date}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {visit.timestamp ? format(visit.timestamp.toDate(), "hh:mm a") : "..."}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                            {visit.reason}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
