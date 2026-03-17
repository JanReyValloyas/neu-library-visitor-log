"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/index";
import { 
  collection, 
  query, 
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
  reason: string;
  timestamp: Timestamp | null;
}

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "visits"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setVisits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Visit)));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching visits:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const todayVisits = visits.filter(v => v.timestamp && isSameDay(v.timestamp.toDate(), today));
    return {
      todayCount: todayVisits.length,
      insideCount: Math.min(todayVisits.length, 12),
      peakTime: "2:00 PM"
    };
  }, [visits]);

  const chartData = useMemo(() => {
    // Mock data for weekly trajectory
    return [
      { date: 'Mon', count: 120 },
      { date: 'Tue', count: 150 },
      { date: 'Wed', count: 180 },
      { date: 'Thu', count: 140 },
      { date: 'Fri', count: 210 },
      { date: 'Sat', count: 90 },
      { date: 'Sun', count: 40 },
    ];
  }, []);

  const filteredVisits = visits.filter(v => 
    v.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "??";

  if (authLoading || loading) {
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
    <div className="flex flex-col min-h-screen pb-20">
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
        <div className="space-y-4">
          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Visitors Today</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#006600]">{stats.todayCount}</span>
                  <span className="text-[10px] font-bold text-green-600">↑ 12% vs yesterday</span>
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currently Inside</p>
                <span className="text-3xl font-bold text-slate-800">{stats.insideCount}</span>
                <Progress value={45} className="h-1.5 bg-slate-100" />
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
                <span className="text-3xl font-bold text-slate-800">{stats.peakTime}</span>
                <p className="text-[10px] font-medium text-muted-foreground">Estimated based on trends</p>
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
            <Button size="sm" className="bg-[#006600] hover:bg-[#004d00] text-white rounded-full px-5 text-xs font-bold">Today</Button>
            <Button size="sm" variant="outline" className="rounded-full border-slate-200 text-xs font-bold bg-white">This Week <ChevronDown className="ml-1 h-3 w-3" /></Button>
            <Button size="sm" variant="outline" className="rounded-full border-slate-200 text-xs font-bold bg-white">This Month <ChevronDown className="ml-1 h-3 w-3" /></Button>
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
            <Button className="w-full h-11 bg-[#D4AF37] hover:bg-[#b8952d] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider">
              <Printer className="h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
          <div className="p-4 border-b bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredVisits.map((visit) => (
              <div key={visit.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="h-10 w-10 bg-[#006600]/10 rounded-full flex items-center justify-center text-[#006600] font-bold text-xs shrink-0">
                  {getInitials(visit.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{visit.displayName || "Unknown User"}</p>
                  <p className="text-[10px] text-[#006600] font-bold uppercase truncate tracking-tight">{visit.program || "GENERAL"}</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground border-slate-200 rounded-lg shrink-0 uppercase">
                  {visit.reason ? visit.reason.split(',')[0] : "OTHER"}
                </Badge>
              </div>
            ))}
            {filteredVisits.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm italic">
                No matching records found
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50/50 border-t flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400">Showing {filteredVisits.length} entries</p>
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