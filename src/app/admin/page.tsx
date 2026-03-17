
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
import { ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { Search, Download, Shield, ShieldAlert, UserCheck, UserMinus, Zap, Filter, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { format, startOfDay, startOfWeek, startOfMonth, subDays, isSameDay } from "date-fns";
import { classifyVisitReason } from "@/ai/flows/classify-visit-reason";

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

  // Filters
  const [reasonFilter, setReasonFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Quick Log
  const [quickSearch, setQuickSearch] = useState("");
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [quickReason, setQuickReason] = useState("");

  useEffect(() => {
    if (!db || !profile || profile.role !== "admin") return;

    const visitsUnsubscribe = onSnapshot(
      query(collection(db, "visits"), orderBy("timestamp", "desc")),
      (snapshot) => {
        setVisits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Visit)));
        setLoadingData(false);
      },
      (error) => {
        console.error("Error fetching visits:", error);
        toast({ title: "Data Error", description: "Failed to load visitor logs.", variant: "destructive" });
      }
    );

    const usersUnsubscribe = onSnapshot(
      query(collection(db, "users"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
      },
      (error) => {
        console.error("Error fetching users:", error);
        toast({ title: "Data Error", description: "Failed to load user management data.", variant: "destructive" });
      }
    );

    return () => {
      visitsUnsubscribe();
      usersUnsubscribe();
    };
  }, [db, profile]);

  // Stats Logic
  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const week = startOfWeek(now);
    const month = startOfMonth(now);

    const safeToDate = (ts: Timestamp | null) => ts ? ts.toDate() : null;

    return {
      today: visits.filter(v => {
        const d = safeToDate(v.timestamp);
        return d && isSameDay(d, today);
      }).length,
      week: visits.filter(v => {
        const d = safeToDate(v.timestamp);
        return d && d >= week;
      }).length,
      month: visits.filter(v => {
        const d = safeToDate(v.timestamp);
        return d && d >= month;
      }).length,
      allTime: visits.length
    };
  }, [visits]);

  // Chart Data Logic (Visitors per day last 7 days)
  const chartData = useMemo(() => {
    const safeToDate = (ts: Timestamp | null) => ts ? ts.toDate() : null;
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return {
        date: format(d, "MMM dd"),
        count: visits.filter(v => {
          const vd = safeToDate(v.timestamp);
          return vd && isSameDay(vd, d);
        }).length,
      };
    }).reverse();
    return days;
  }, [visits]);

  // Filtering Logic
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const matchReason = reasonFilter === "all" || v.reason === reasonFilter;
      const matchCollege = collegeFilter === "" || v.college?.toLowerCase().includes(collegeFilter.toLowerCase());
      const matchEmployee = employeeFilter === "all" || (employeeFilter === "employee" ? v.isEmployee : !v.isEmployee);
      const matchSearch = searchTerm === "" || 
        v.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchReason && matchCollege && matchEmployee && matchSearch;
    });
  }, [visits, reasonFilter, collegeFilter, employeeFilter, searchTerm]);

  // Handlers
  const handleToggleRole = async (uid: string, currentRole: string) => {
    if (!db) return;
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await updateDoc(doc(db, "users", uid), { role: newRole });
      toast({ title: "Role Updated", description: `User is now a ${newRole}.` });
    } catch (error) {
      toast({ title: "Update Failed", description: "Failed to update user role.", variant: "destructive" });
    }
  };

  const handleToggleBlock = async (uid: string, currentStatus: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "users", uid), { isBlocked: !currentStatus });
      toast({ 
        title: currentStatus ? "User Unblocked" : "User Blocked", 
        description: `User access has been ${currentStatus ? "restored" : "revoked"}.`,
        variant: currentStatus ? "default" : "destructive" 
      });
    } catch (error) {
      toast({ title: "Action Failed", description: "Failed to change block status.", variant: "destructive" });
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
        toast({ title: "Not Found", description: "No user found with this email.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Lookup Error", description: "Search failed. Please try again.", variant: "destructive" });
    }
  };

  const handleQuickLogVisit = async () => {
    if (!db || !foundUser || !quickReason) return;
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
      toast({ title: "Visit Logged", description: `Successfully logged visit for ${foundUser.displayName}.` });
      setFoundUser(null);
      setQuickSearch("");
      setQuickReason("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to log visit.", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    toast({ title: "Export Started", description: "Standard browser print dialog opened." });
    window.print();
  };

  const handleAIDiagnosis = async (visitId: string, currentReason: string) => {
    if (!db) return;
    toast({ title: "AI Classifier", description: "Processing reason category..." });
    try {
      const result = await classifyVisitReason({ reason: currentReason });
      await updateDoc(doc(db, "visits", visitId), { 
        aiClassified: result.classifiedCategory,
        aiSuggestion: result.suggestedNewCategory,
        aiExplanation: result.explanation
      });
      toast({ title: "AI Processed", description: `Classified as: ${result.classifiedCategory}` });
    } catch (e) {
      toast({ title: "AI Error", description: "Failed to process with AI.", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || profile.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage library visitors and user access control.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        </header>

        <StatsCards {...stats} />

        <Tabs defaultValue="visits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-auto h-12 p-1 bg-muted/50">
            <TabsTrigger value="visits" className="data-[state=active]:bg-background">Visitor Logs</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-background">User Management</TabsTrigger>
            <TabsTrigger value="quick-log" className="data-[state=active]:bg-background">Quick Log</TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-3 border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Visit History
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search name, course, reason..." 
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
                    <Select onValueChange={setReasonFilter} value={reasonFilter}>
                      <SelectTrigger>
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
                      placeholder="Filter by College..." 
                      value={collegeFilter}
                      onChange={(e) => setCollegeFilter(e.target.value)}
                    />
                    <Select onValueChange={setEmployeeFilter} value={employeeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Visitors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Visitors</SelectItem>
                        <SelectItem value="employee">Employees Only</SelectItem>
                        <SelectItem value="student">Students Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitor</TableHead>
                        <TableHead>College/Program</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingData ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex justify-center items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading visits...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredVisits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            No visitor records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVisits.map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold">{visit.displayName}</span>
                                <span className="text-xs text-muted-foreground">{visit.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{visit.college}</span>
                                <span className="text-xs text-muted-foreground">{visit.program}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="w-fit">{visit.reason}</Badge>
                                {visit.aiClassified && (
                                  <Badge variant="secondary" className="w-fit text-[10px] bg-green-100 text-green-800">
                                    AI: {visit.aiClassified}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs">
                                <span>{visit.date}</span>
                                <span className="text-muted-foreground">
                                  {visit.timestamp ? format(visit.timestamp.toDate(), "hh:mm a") : "..."}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {visit.isEmployee ? (
                                <Badge className="bg-blue-100 text-blue-800 border-none">{visit.employeeType}</Badge>
                              ) : (
                                <Badge variant="secondary" className="border-none">Student</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {visit.reason === "Other" && !visit.aiClassified && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleAIDiagnosis(visit.id, visit.reason)}
                                  className="h-8 w-8 p-0"
                                  title="AI Classify"
                                >
                                  <Zap className="h-4 w-4 text-accent" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              <Card className="border-none shadow-md h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Overview</CardTitle>
                  <CardDescription>Visitors per day (Last 7 days)</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
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
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Registered Users</CardTitle>
                <CardDescription>Manage user roles and access status.</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>User Information</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>College/Program</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img src={u.photoURL} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" alt={u.displayName} />
                            <div className="flex flex-col">
                              <span className="font-bold">{u.displayName}</span>
                              <span className="text-xs text-muted-foreground">{u.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p className="font-medium">{u.college || "N/A"}</p>
                            <p className="text-muted-foreground">{u.program || "Profile incomplete"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.isBlocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleToggleRole(u.id, u.role)}
                          >
                            {u.role === "admin" ? <UserMinus className="h-4 w-4 mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
                            {u.role === "admin" ? "Demote" : "Promote"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant={u.isBlocked ? "default" : "destructive"} 
                            onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                          >
                            {u.isBlocked ? <UserCheck className="h-4 w-4 mr-1" /> : <ShieldAlert className="h-4 w-4 mr-1" />}
                            {u.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="quick-log">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Quick Log Visitor</CardTitle>
                  <CardDescription>Log a visit manually by searching for an email address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by email..." 
                        className="pl-10"
                        value={quickSearch}
                        onChange={(e) => setQuickSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickLookup()}
                      />
                    </div>
                    <Button onClick={handleQuickLookup}>Lookup</Button>
                  </div>

                  {foundUser && (
                    <div className="p-6 border rounded-xl bg-muted/20 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-4 mb-6">
                        <img src={foundUser.photoURL} className="w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2" referrerPolicy="no-referrer" alt={foundUser.displayName} />
                        <div>
                          <h3 className="text-xl font-bold">{foundUser.displayName}</h3>
                          <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                          <Badge variant="outline" className="mt-1">{foundUser.college} • {foundUser.program}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select Visit Reason</Label>
                          <Select onValueChange={setQuickReason} value={quickReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Reading", "Researching", "Use of Computer", "Meeting", "Borrowing Books", "Other"].map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full h-12" onClick={handleQuickLogVisit}>
                          Log Visit for {foundUser.displayName.split(' ')[0]}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap className="h-32 w-32" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl font-headline">Admin Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Filter className="h-5 w-5" />
                      </div>
                      <p className="text-sm">Use the filters to narrow down specific data ranges or visitor types for detailed reporting.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Download className="h-5 w-5" />
                      </div>
                      <p className="text-sm">Export filtered results to PDF for easy sharing and physical record-keeping.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Zap className="h-5 w-5" />
                      </div>
                      <p className="text-sm">AI Classification helps categorize "Other" reasons automatically for cleaner analytics.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
