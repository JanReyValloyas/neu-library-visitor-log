"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/index";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, TrendingUp, Users, Calendar } from "lucide-react";
import { BottomNav } from "@/components/admin/bottom-nav";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";

const COLORS = ['#006600', '#D4AF37', '#004d00', '#b8952d', '#003300', '#9c7e26'];

export default function AdminAnalytics() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      router.replace("/");
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const visitsRef = collection(db, "visits");
        const q = query(visitsRef, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Array()
        }));
        setVisits(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    let start: Date;
    
    if (timeRange === 'today') start = startOfDay(now);
    else if (timeRange === 'week') start = subDays(now, 7);
    else start = subDays(now, 30);

    return visits.filter(v => v.timestamp >= start && v.timestamp <= now);
  }, [visits, timeRange]);

  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(v => {
      const date = format(v.timestamp, "MMM dd");
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count })).reverse();
  }, [filteredData]);

  const reasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(v => {
      const reason = v.reason?.split(',')[0] || "Other";
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const collegeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(v => {
      const college = v.college || "Unknown";
      counts[college] = (counts[college] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-[#006600]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#f5f8f5]">
      <header className="p-6 bg-white border-b sticky top-0 z-10 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-bold text-lg text-slate-800">Analytics</h1>
          <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">VISITOR TRENDS</p>
        </div>
      </header>

      <main className="p-4 space-y-6 animate-in fade-in duration-500">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          {(['today', 'week', 'month'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                timeRange === r ? 'bg-[#006600] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl border-none shadow-md bg-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-8 w-8 bg-[#006600]/10 rounded-full flex items-center justify-center mb-2">
                <Users className="h-4 w-4 text-[#006600]" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Visits</p>
              <p className="text-2xl font-bold text-slate-800">{filteredData.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-md bg-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-8 w-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-2">
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Growth Rate</p>
              <p className="text-2xl font-bold text-slate-800">+8.4%</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-none shadow-md p-4 bg-white">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Visitors Over Time
            </CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
              <Bar dataKey="count" fill="#006600" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="rounded-2xl border-none shadow-md p-4 bg-white">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Purpose Breakdown</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={reasonData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {reasonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="rounded-2xl border-none shadow-md p-4 bg-white">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Distribution by College</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={collegeData}
                innerRadius={0}
                outerRadius={80}
                dataKey="value"
                labelLine={false}
              >
                {collegeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
              <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ fontSize: '8px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
