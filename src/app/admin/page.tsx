
"use client";

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCards } from "@/components/admin/stats-cards";
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { Search, Download, Shield, ShieldAlert, UserCheck, UserMinus, Zap, Loader2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { format, startOfDay, startOfWeek, startOfMonth, subDays, isSameDay } from "date-fns";
import { classifyVisitReason } from "@/ai/flows/classify-visit-reason";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Visit {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  program: string;
  college: string;
  isEmployee: boolean;
  employeeType: string;
  reason: string;
  timestamp: Timestamp | null;
  date: string;
  aiClassified?: string;
  aiSuggestion?: string;
  aiExplanation?: string;
}

interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "user" | "admin";
  isBlocked: boolean;
  program?: string;
  college?: string;
  isEmployee?: boolean;
  employeeType?: string;
  createdAt: Timestamp | null;
}

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const db = useFirestore();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [reasonFilter, setReasonFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Quick Log
  const [quickSearch, setQuickSearch] = useState("");
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [quickReason, setQuickReason] = useState("");
  const [isQuickLogging, setIsQuickLogging] = useState(false);

  useEffect(() => {
    if (!db || authLoading) return;
    
    // Safety check: ensure user is admin
    if (!profile || profile.role !== "admin") {
      console.log("Not an admin or still loading profile...");
      return;
    }

    setLoadingData(true);
    setError(null);

    let visitsUnsubscribe = () => {};
    let usersUnsubscribe = () => {};

    try {
      const visitsQuery = query(collection(db, "visits"), orderBy("timestamp", "desc"));
      visitsUnsubscribe = onSnapshot(visitsQuery, (snapshot) => {
        const visitsData = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp : null
          } as Visit;
        });
        setVisits(visitsData);
        setLoadingData(false);
      }, (err) => {
        console.error("Visits Snapshot Error:", err);
        setError("Could not load visitor logs. Check permissions.");
        setLoadingData(false);
      });

      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
      usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null
          } as UserProfile;
        });
        setUsers(usersData);
      }, (err) => {
        console.error("Users Snapshot Error:", err);
        toast({ title: "Sync Error", description: "Failed to sync user list.", variant: "destructive" });
      });
    } catch (err) {
      console.error("Firestore initialization error:", err);
      setError("Critical database connection error.");
      setLoadingData(false);
    }

    return () => {
      visitsUnsubscribe();
      usersUnsubscribe();
    };
  }, [db, profile, authLoading]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const week = startOfWeek(new Date());
    const month = startOfMonth(new Date());

    const safeVisits = Array.isArray(visits) ? visits : [];

    return {
      today: safeVisits.filter(v => v.timestamp && isSameDay(v.timestamp.toDate(), today)).length,
      week: safeVisits.filter(v => v.timestamp && v.timestamp.toDate() >= week).length,
      month: safeVisits.filter(v => v.timestamp && v.timestamp.toDate() >= month).length,
      allTime: safeVisits.length
    };
  }, [visits]);

  const chartData = useMemo(() => {
    const safeVisits = Array.isArray(visits) ? visits : [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return {
        date: format(d, "MMM dd"),
        count: safeVisits.filter(v => v.timestamp && isSameDay(v.timestamp.toDate(), d)).length,
      };
    }).reverse();
  }, [visits]);

  const filteredVisits = useMemo(() => {
    const safeVisits = Array.isArray(visits) ? visits : [];
    return safeVisits.filter(v => {
      const matchReason = reasonFilter === "all" || v.reason === reasonFilter;
      const matchCollege = !collegeFilter || (v.college || "").toLowerCase().includes(collegeFilter.toLowerCase());
      const matchEmployee = employeeFilter === "all" || (employeeFilter === "employee" ? v.isEmployee : !v.isEmployee);
      const matchSearch = !searchTerm || 
        (v.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchReason && matchCollege && matchEmployee && matchSearch;
    });
  }, [visits, reasonFilter, collegeFilter, employeeFilter, searchTerm]);

  const handleToggleRole = async (uid: string, currentRole: string) => {
    if (!db) return;
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await updateDoc(doc(db, "users", uid), { role: newRole });
      toast({ title: "Role Updated", description: `User role changed to ${newRole}.` });
    } catch (e) {
      toast({ title: "Update Failed", description: "Permission error or network failure.", variant: "destructive" });
    }
  };

  const handleToggleBlock = async (uid: string, isBlocked: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "users", uid), { isBlocked: !isBlocked });
      toast({ title: isBlocked ? "User Unblocked" : "User Blocked" });
    } catch (e) {
      toast({ title: "Action Failed", variant: "destructive" });
    }
  };

  const handleQuickLookup = async () => {
    if (!db || !quickSearch) return;
    try {
      const q = query(collection(db, "users"), where("email", "==", quickSearch.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setFoundUser({ id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile);
      } else {
        setFoundUser(null);
        toast({ title: "Not Found", description: "No user matches this email.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lookup Error", variant: "destructive" });
    }
  };

  const handleQuickLogVisit = async () => {
    if (!db || !foundUser || !quickReason) return;
    setIsQuickLogging(true);
    try {
      await addDoc(collection(db, "visits"), {
        uid: foundUser.uid,
        displayName: foundUser.displayName,
        email: foundUser.email,
        program: foundUser.program || "Unknown",
        college: foundUser.college || "Unknown",
        isEmployee: foundUser.isEmployee || false,
        employeeType: foundUser.employeeType || "",
        reason: quickReason,
        timestamp: serverTimestamp(),
        date: format(new Date(), "yyyy-MM-dd"),
      });
      toast({ title: "Visit Logged", description: `Manual entry for ${foundUser.displayName} complete.` });
      setFoundUser(null);
      setQuickSearch("");
      setQuickReason("");
    } catch (e) {
      toast({ title: "Logging Failed", variant: "destructive" });
    } finally {
      setIsQuickLogging(false);
    }
  };

  const handleAIDiagnosis = async (visitId: string, currentReason: string) => {
    if (!db) return;
    try {
      toast({ title: "Processing", description: "Classifying entry with AI..." });
      const result = await classifyVisitReason({ reason: currentReason });
      await updateDoc(doc(db, "visits", visitId), { 
        aiClassified: result.classifiedCategory,
        aiSuggestion: result.suggestedNewCategory,
        aiExplanation: result.explanation
      });
      toast({ title: "AI Classification Complete" });
    } catch (e) {
      toast({ title: "AI Error", description: "Classifier service unavailable.", variant: "destructive" });
    }
  };

  if (authLoading || (profile && profile.role === "admin" && loadingData && visits.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse text-muted-foreground">Synchronizing secure data...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unauthorized Access</AlertTitle>
          <AlertDescription>You do not have administrative privileges for this section.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Control Panel</h1>
            <p className="text-muted-foreground">Monitoring NEU Library visitor flow and user governance.</p>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>System Alert</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <StatsCards {...stats} />

        <Tabs defaultValue="visits" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border">
            <TabsTrigger value="visits">Visitor Logs</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="quick-log">Direct Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-3 border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Activity Stream
                    </CardTitle>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search visitor or email..." 
                        className="pl-10 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
                    <Select onValueChange={setReasonFilter} value={reasonFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Reasons" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reasons</SelectItem>
                        {["Reading", "Researching", "Use of Computer", "Meeting", "Borrowing Books", "Other"].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="College (e.g. CCS)" 
                      className="h-9"
                      value={collegeFilter}
                      onChange={(e) => setCollegeFilter(e.target.value)}
                    />
                    <Select onValueChange={setEmployeeFilter} value={employeeFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Visitor Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Visitors</SelectItem>
                        <SelectItem value="employee">Employees</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor Profile</TableHead>
                      <TableHead>Academic Info</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Logged Time</TableHead>
                      <TableHead className="text-right">AI Tools</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          {loadingData ? "Fetching database records..." : "No records found matching filters."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVisits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{visit.displayName || "Unknown User"}</span>
                              <span className="text-[11px] text-muted-foreground">{visit.email || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-medium text-primary">{visit.college || "N/A"}</span>
                              <span className="text-muted-foreground truncate max-w-[150px]">{visit.program || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit text-[10px]">{visit.reason}</Badge>
                              {visit.aiClassified && (
                                <Badge variant="secondary" className="w-fit text-[9px] bg-green-50 text-green-700 border-green-200">
                                  AI: {visit.aiClassified}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-[11px]">
                              <span className="font-medium">{visit.date}</span>
                              <span className="text-muted-foreground">
                                {visit.timestamp ? format(visit.timestamp.toDate(), "hh:mm a") : "---"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {visit.reason === "Other" && !visit.aiClassified && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleAIDiagnosis(visit.id, visit.reason)}
                                className="h-7 w-7 p-0"
                              >
                                <Zap className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>

              <Card className="border-none shadow-md h-fit">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Weekly Trajectory</CardTitle>
                  <CardDescription>Visualizing visitor counts</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px] p-0 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltipContent hideIndicator />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg">User Directory</CardTitle>
                <CardDescription>Granting permissions and managing security status.</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Account</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        No registered users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img src={u.photoURL || `https://picsum.photos/seed/${u.id}/32/32`} className="w-8 h-8 rounded-full bg-muted object-cover" alt={u.displayName} />
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{u.displayName || "Unnamed"}</span>
                              <span className="text-[11px] text-muted-foreground">{u.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px] uppercase">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.isBlocked ? (
                            <Badge variant="destructive" className="text-[10px]">Suspended</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => handleToggleRole(u.id, u.role)}>
                            {u.role === "admin" ? <UserMinus className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                            {u.role === "admin" ? "Demote" : "Promote"}
                          </Button>
                          <Button size="sm" variant={u.isBlocked ? "default" : "destructive"} className="h-8 text-[11px]" onClick={() => handleToggleBlock(u.id, u.isBlocked)}>
                            {u.isBlocked ? <UserCheck className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                            {u.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="quick-log">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Direct Manual Logging</CardTitle>
                  <CardDescription>Bypass self-service for manual visitor registration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter visitor email..." 
                      className="flex-1"
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickLookup()}
                    />
                    <Button onClick={handleQuickLookup}>Find User</Button>
                  </div>

                  {foundUser && (
                    <div className="p-4 border rounded-lg bg-muted/10 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-4 mb-4">
                        <img src={foundUser.photoURL} className="w-12 h-12 rounded-full ring-1 ring-primary" alt="" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-bold">{foundUser.displayName}</p>
                          <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Reason for manual entry</Label>
                          <Select onValueChange={setQuickReason} value={quickReason}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Reading", "Researching", "Use of Computer", "Meeting", "Borrowing Books", "Other"].map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full h-10" onClick={handleQuickLogVisit} disabled={!quickReason || isQuickLogging}>
                          {isQuickLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Execute Log
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground border-none shadow-lg h-fit">
                <CardHeader>
                  <CardTitle className="text-xl">Administrative Duty</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4 text-primary-foreground/90 leading-relaxed">
                  <p>You are authorized to manage the data lifecycle of the NEU Library visitor system.</p>
                  <ul className="space-y-2 list-disc pl-4">
                    <li>Analyze visitor frequency for resource planning.</li>
                    <li>Audit user status for security compliance.</li>
                    <li>Utilize AI for high-accuracy categorization of unspecified visits.</li>
                  </ul>
                  <div className="pt-4 flex items-center gap-2 font-semibold">
                    <Shield className="h-5 w-5" />
                    <span>Secure Admin Session Active</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
