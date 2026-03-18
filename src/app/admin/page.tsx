"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/index";
import { 
  collection, 
  query, 
  where,
  getDocs,
  orderBy, 
  onSnapshot, 
  limit, 
  Timestamp 
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bell, 
  Search, 
  Printer, 
  Plus, 
  Clock, 
  Users, 
  TrendingUp, 
  Calendar as CalendarIcon,
  ChevronDown,
  Loader2
} from "lucide-react";
import { BottomNav } from "@/components/admin/bottom-nav";
import { format, isSameDay, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Visit {
  id: string;
  displayName: string;
  program: string;
  college: string;
  reason: string;
  date: string;
  timestamp: Timestamp | null;
}

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Stats state
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [allTimeCount, setAllTimeCount] = useState(0);
  const [currentlyInside, setCurrentlyInside] = useState(0);
  const [peakHour, setPeakHour] = useState("Loading...");
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("Today");

  const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const fetchStats = async () => {
    if (!db) return;
    try {
      const visitsRef = collection(db, "visits");
      
      // TODAY count
      const { start: todayStart, end: todayEnd } = getTodayRange();
      const todayQ = query(visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(todayStart)),
        where("timestamp", "<=", Timestamp.fromDate(todayEnd))
      );
      const todaySnap = await getDocs(todayQ);
      setTodayCount(todaySnap.size);
      
      // Initial view: Today
      const initialVisits = todaySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));
      setVisits(initialVisits);
      setFilteredVisits(initialVisits);
      setCurrentlyInside(todaySnap.size);
      
      // THIS WEEK count
      const { start: weekStart, end: weekEnd } = getWeekRange();
      const weekQ = query(visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(weekStart)),
        where("timestamp", "<=", Timestamp.fromDate(weekEnd))
      );
      const weekSnap = await getDocs(weekQ);
      setWeekCount(weekSnap.size);
      
      // THIS MONTH count
      const { start: monthStart, end: monthEnd } = getMonthRange();
      const monthQ = query(visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(monthStart)),
        where("timestamp", "<=", Timestamp.fromDate(monthEnd))
      );
      const monthSnap = await getDocs(monthQ);
      setMonthCount(monthSnap.size);

      // ALL TIME count
      const allSnap = await getDocs(visitsRef);
      setAllTimeCount(allSnap.size);

      // PEAK HOUR
      const hourCounts: Record<number, number> = {};
      todaySnap.docs.forEach(doc => {
        const ts = doc.data().timestamp?.toDate();
        if (ts) {
          const hour = ts.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      const peakHourEntry = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])[0];
      if (peakHourEntry) {
        const h = parseInt(peakHourEntry[0]);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        setPeakHour(`${h12}:00 ${ampm}`);
      } else {
        setPeakHour("No data yet");
      }

      // VISITOR TRAJECTORY
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      
      const trajectoryData = last7Days.map(dateStr => {
        const count = allSnap.docs.filter(doc => 
          doc.data().date === dateStr
        ).length;
        const dayName = new Date(dateStr).toLocaleDateString(
          "en-US", { weekday: "short" }
        );
        return { date: dayName, count };
      });
      setChartData(trajectoryData);

      setLoading(false);
    } catch (error) {
      console.error("Stats error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [db]);

  const handleFilterChange = async (filter: string) => {
    setLoading(true);
    setActiveFilter(filter);
    let startDate: Date;
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (filter === "Today") {
      const range = getTodayRange();
      startDate = range.start;
      endDate = range.end;
    } else if (filter === "This Week") {
      const range = getWeekRange();
      startDate = range.start;
      endDate = range.end;
    } else if (filter === "This Month") {
      const range = getMonthRange();
      startDate = range.start;
      endDate = range.end;
    } else {
      setLoading(false);
      return;
    }

    try {
      const visitsRef = collection(db, "visits");
      const q = query(visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<=", Timestamp.fromDate(endDate)),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id, ...doc.data()
      } as Visit));
      setFilteredVisits(data);
      setCurrentlyInside(snap.size);
    } catch (e) {
      console.error("Filter error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 102, 0);
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NEU Library Visitor Log", 14, 12);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
    doc.text(`Filter: ${activeFilter}`, 150, 20);
    
    // Stats row
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Total Visits: ${filteredVisits.length}`, 14, 35);
    
    // Table
    autoTable(doc, {
      startY: 42,
      head: [["Name", "Program", "College", "Reason", "Date", "Time"]],
      body: filteredVisits.map((v: any) => [
        v.displayName || "N/A",
        v.program || "N/A", 
        v.college || "N/A",
        v.reason || "N/A",
        v.date || "N/A",
        v.timestamp?.toDate?.()
          .toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit"
          }) || "N/A",
      ]),
      headStyles: { 
        fillColor: [0, 102, 0],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      styles: { fontSize: 9 },
    });
    
    doc.save(`NEU-Library-Visitors-${activeFilter}-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const searchFilteredResults = filteredVisits.filter(v => 
    v.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "??";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-[#006600]" />
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#f5f8f5]">
      <header className="p-6 flex items-center justify-between bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#006600] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
            NEU
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-800">NEU Library</h1>
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">ADMIN DASHBOARD</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-5 w-5 text-slate-600" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </Button>
          <Avatar className="h-8 w-8 border-2 border-[#D4AF37]">
            <AvatarFallback className="bg-slate-100 text-[10px]">{user.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="p-4 space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 gap-4">
          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Visitors Today</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#006600]">{todayCount}</span>
                  <span className="text-[10px] font-bold text-green-600">Active Logs</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-[#006600]/10 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#006600]" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-3 flex-1 mr-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currently Logged</p>
                <span className="text-3xl font-bold text-slate-800">{currentlyInside}</span>
                <Progress value={Math.min((currentlyInside / 100) * 100, 100)} className="h-1.5 bg-slate-100" />
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Peak Hour</p>
                <span className="text-3xl font-bold text-slate-800">{peakHour}</span>
                <p className="text-[10px] font-medium text-muted-foreground">Based on today&apos;s activity</p>
              </div>
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest px-1">Visitor Trajectory</h3>
          <Card className="rounded-2xl border-none shadow-md p-4 bg-white">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#006600" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => handleFilterChange("Today")}
              className={activeFilter === "Today" 
                ? "bg-[#006600] text-white px-5 py-2 rounded-full text-xs font-bold shadow-md transition-all"
                : "bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-full text-xs font-bold hover:bg-slate-50 transition-all"}
            >
              Today
            </button>
            <button 
              onClick={() => handleFilterChange("This Week")}
              className={activeFilter === "This Week" 
                ? "bg-[#006600] text-white px-5 py-2 rounded-full text-xs font-bold shadow-md transition-all"
                : "bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-full text-xs font-bold hover:bg-slate-50 transition-all"}
            >
              This Week
            </button>
            <button 
              onClick={() => handleFilterChange("This Month")}
              className={activeFilter === "This Month" 
                ? "bg-[#006600] text-white px-5 py-2 rounded-full text-xs font-bold shadow-md transition-all"
                : "bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-full text-xs font-bold hover:bg-slate-50 transition-all"}
            >
              This Month
            </button>
            <Button size="sm" variant="ghost" className="rounded-full text-slate-400 p-2"><CalendarIcon className="h-4 w-4" /></Button>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#006600] transition-colors" />
              <Input 
                placeholder="Search name, program, or reason..." 
                className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-[#006600] shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleExportPDF}
              className="w-full h-11 bg-[#D4AF37] hover:bg-[#b8952d] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Printer className="h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
          <div className="p-4 border-b bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {activeFilter} Records
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#006600]" />
              </div>
            ) : searchFilteredResults.map((visit) => (
              <div key={visit.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="h-10 w-10 bg-[#006600]/10 rounded-full flex items-center justify-center text-[#006600] font-bold text-xs shrink-0">
                  {getInitials(visit.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{visit.displayName || "Unknown User"}</p>
                  <p className="text-[10px] text-[#006600] font-bold uppercase truncate tracking-tight">{visit.program || "GENERAL"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground border-slate-200 rounded-lg uppercase">
                    {visit.reason ? visit.reason.split(',')[0] : "OTHER"}
                  </Badge>
                  <span className="text-[8px] text-slate-400 font-bold">
                    {visit.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {!loading && searchFilteredResults.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm italic">
                No matching records found for {activeFilter}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50/50 border-t flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400">Showing {searchFilteredResults.length} entries</p>
          </div>
        </Card>
      </main>

      <Button className="fixed bottom-20 right-6 h-14 w-14 bg-[#006600] hover:bg-[#004d00] text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40">
        <Plus className="h-7 w-7" />
      </Button>

      <BottomNav />
    </div>
  );
}