"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/index";
import { 
  collection, 
  query, 
  where,
  getDocs,
  orderBy, 
  onSnapshot, 
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
  Clock, 
  Users, 
  TrendingUp, 
  Loader2,
  CalendarDays,
  LayoutDashboard,
  BarChart,
  Settings
} from "lucide-react";
import { BottomNav } from "@/components/admin/bottom-nav";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Visit {
  id: string;
  displayName: string;
  program: string;
  college: string;
  reason: string;
  date: string;
  timestamp: any;
  email?: string;
}

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  
  // Stats state
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [allTimeCount, setAllTimeCount] = useState(0);
  const [peakHour, setPeakHour] = useState("Loading...");
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("Today");

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const getTodayRange = () => {
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    return { start, end };
  }

  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = endOfDay(new Date());
    return { start, end };
  }

  const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = endOfDay(new Date());
    return { start, end };
  }

  useEffect(() => {
    const visitsRef = collection(db, "visits");
    const q = query(visitsRef, orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recent = snapshot.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(recent);
    });
    return () => unsubscribe();
  }, []);

  const fetchStats = async () => {
    if (!db) return;
    try {
      const visitsRef = collection(db, "visits");
      
      const { start: todayStart, end: todayEnd } = getTodayRange();
      const todayQ = query(visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(todayStart)),
        where("timestamp", "<=", Timestamp.fromDate(todayEnd))
      );
      const todaySnap = await getDocs(todayQ);
      setTodayCount(todaySnap.size);
      
      const initialVisits = todaySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));
      setFilteredVisits(initialVisits);
      
      const { start: weekStart, end: weekEnd } = getWeekRange();
      const weekQ = query(visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(weekStart)),
        where("timestamp", "<=", Timestamp.fromDate(weekEnd))
      );
      const weekSnap = await getDocs(weekQ);
      setWeekCount(weekSnap.size);
      
      const { start: monthStart, end: monthEnd } = getMonthRange();
      const monthQ = query(visitsRef,
        where("timestamp", ">=", Timestamp.fromDate(monthStart)),
        where("timestamp", "<=", Timestamp.fromDate(monthEnd))
      );
      const monthSnap = await getDocs(monthQ);
      setMonthCount(monthSnap.size);

      const allSnap = await getDocs(visitsRef);
      setAllTimeCount(allSnap.size);

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

      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, "yyyy-MM-dd");
      });
      
      const trajectoryData = last7Days.map(dateStr => {
        const count = allSnap.docs.filter(doc => 
          doc.data().date === dateStr
        ).length;
        const dayName = format(new Date(dateStr), "EEE");
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
  }, []);

  const handleFilterChange = async (filter: string) => {
    setLoading(true);
    setActiveFilter(filter);
    let startDate: Date;
    let endDate = endOfDay(new Date());

    if (filter === "Today") {
      const range = getTodayRange();
      startDate = range.start;
    } else if (filter === "This Week") {
      const range = getWeekRange();
      startDate = range.start;
    } else if (filter === "This Month") {
      const range = getMonthRange();
      startDate = range.start;
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
    doc.setFillColor(0, 102, 0); 
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NEU Library Visitor Log", 14, 12);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
    doc.text(`Filter: ${activeFilter}`, 150, 20);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Total Visits: ${filteredVisits.length}`, 14, 35);
    autoTable(doc, {
      startY: 42,
      head: [["Name", "Program", "College", "Reason", "Date", "Time"]],
      body: filteredVisits.map((v: any) => [
        v.displayName || "N/A",
        v.program || "N/A", 
        v.college || "N/A",
        v.reason || "N/A",
        v.date || "N/A",
        v.timestamp?.toDate?.().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) || "N/A",
      ]),
      headStyles: { fillColor: [0, 102, 0], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 245] },
      styles: { fontSize: 8 },
    });
    doc.save(`NEU-Library-Visitors-${activeFilter}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
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
    return <div className="min-h-screen flex items-center justify-center p-6 text-center">Access Denied</div>;
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f8f5]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-primary/10 pt-6 z-20">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#006600] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">NEU</div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-800">NEU Library</h1>
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${pathname === item.href ? 'bg-[#006600] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 md:ml-64 pb-20 md:pb-8">
        <header className="p-4 md:p-6 flex items-center justify-between bg-white border-b sticky top-0 z-10">
          <div className="md:hidden flex items-center gap-3">
            <div className="w-8 h-8 bg-[#006600] rounded-lg flex items-center justify-center text-white font-bold text-[10px]">NEU</div>
            <h1 className="font-bold text-sm text-slate-800">Admin</h1>
          </div>
          <div className="hidden md:block">
            <h2 className="text-xl font-bold text-slate-800">Operational Dashboard</h2>
            <p className="text-xs text-slate-400 font-medium">Real-time overview of library activities</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="h-5 w-5 text-slate-600" />
              </Button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-primary/10 z-50">
                  <div className="p-3 border-b border-primary/10"><h3 className="font-bold text-sm text-[#006600]">Recent Check-ins</h3></div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 border-b border-slate-50">
                        <p className="text-sm font-semibold">{notif.displayName}</p>
                        <p className="text-xs text-slate-500">{notif.program} • {notif.reason}</p>
                        <p className="text-xs text-[#006600]">{notif.timestamp?.toDate?.() ? format(notif.timestamp.toDate(), "h:mm a") : "Just now"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Avatar className="h-9 w-9 border-2 border-[#D4AF37]">
              <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-none shadow-md bg-white">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="h-8 w-8 bg-[#006600]/10 rounded-lg flex items-center justify-center mb-2"><Users className="h-4 w-4 text-[#006600]" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Visits</p><p className="text-2xl md:text-3xl font-bold text-[#006600]">{todayCount}</p></div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-md bg-white">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center mb-2"><CalendarDays className="h-4 w-4 text-[#006600]" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Week</p><p className="text-2xl md:text-3xl font-bold text-slate-800">{weekCount}</p></div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-md bg-white">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center mb-2"><Clock className="h-4 w-4 text-amber-600" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Hour</p><p className="text-lg md:text-xl font-bold text-slate-800">{peakHour}</p></div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-md bg-white">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center mb-2"><TrendingUp className="h-4 w-4 text-purple-600" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All-Time</p><p className="text-2xl md:text-3xl font-bold text-slate-800">{allTimeCount}</p></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Visitor Volume</h3>
              <Card className="rounded-2xl border-none shadow-md p-4 bg-white">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                    <Bar dataKey="count" fill="#006600" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Controls</h3>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {["Today", "This Week", "This Month"].map((f) => (
                    <button key={f} onClick={() => handleFilterChange(f)} className={activeFilter === f ? "bg-[#006600] text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-md transition-all uppercase" : "bg-white border border-slate-200 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-slate-50 transition-all uppercase"}>{f}</button>
                  ))}
                </div>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search records..." className="pl-10 h-12 bg-white border-slate-200 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <Button onClick={handleExportPDF} className="w-full h-12 bg-[#D4AF37] hover:bg-[#c5a02d] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-xs"><Printer className="h-4 w-4" /> Export PDF</Button>
              </div>
            </div>
          </div>

          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
            <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeFilter} Records</h3><Badge variant="outline" className="text-[9px] font-bold text-slate-400 bg-white border-slate-200">{searchFilteredResults.length} Entries</Badge></div>
            <div className="overflow-x-auto">
              <div className="divide-y divide-slate-100 min-w-[600px]">
                {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#006600]" /></div> : searchFilteredResults.map((visit) => (
                  <div key={visit.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="h-10 w-10 bg-[#006600]/5 rounded-xl flex items-center justify-center text-[#006600] font-bold text-xs shrink-0">{getInitials(visit.displayName)}</div>
                    <div className="flex-1 min-w-0"><p className="font-bold text-sm text-slate-800 truncate">{visit.displayName || "Unknown"}</p><p className="text-[10px] text-[#006600] font-bold uppercase tracking-tight">{visit.program || "GENERAL"}</p></div>
                    <div className="flex-1 hidden md:block"><p className="text-[10px] font-bold text-slate-500 uppercase">{visit.college || "N/A"}</p></div>
                    <div className="flex flex-col items-end gap-1 shrink-0"><Badge variant="outline" className="text-[9px] font-bold text-slate-500 border-slate-200 rounded-lg uppercase">{visit.reason ? visit.reason.split(',')[0] : "OTHER"}</Badge><span className="text-[9px] text-slate-400 font-bold">{visit.timestamp?.toDate?.() ? format(visit.timestamp.toDate(), "h:mm a") : "N/A"}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}