"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/index";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Search, 
  Filter, 
  Menu,
  Loader2,
  LayoutDashboard,
  Users,
  BarChart,
  Settings
} from "lucide-react";
import { BottomNav } from "@/components/admin/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  studentId: string;
  program: string;
  isBlocked: boolean;
  role: "admin" | "user";
  photoURL: string;
}

export default function UsersManagement() {
  const { user: currentUser, role: currentRole, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleToggleBlock = async (uid: string, currentStatus: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "users", uid), { isBlocked: !currentStatus });
      toast({ title: currentStatus ? "User Unblocked" : "User Blocked" });
    } catch (e) {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.program?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "active") return matchesSearch && !u.isBlocked;
    if (filter === "blocked") return matchesSearch && u.isBlocked;
    return matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-[#006600]" />
      </div>
    );
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
          <h1 className="font-bold text-lg text-slate-800">User Management</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><Bell className="h-5 w-5 text-slate-600" /></Button>
            <Avatar className="h-9 w-9 border-2 border-[#D4AF37]"><AvatarFallback className="bg-slate-100 text-[10px] font-bold">AD</AvatarFallback></Avatar>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#006600]" />
              <Input placeholder="Search by name, ID, or program" className="pl-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200 p-0 text-[#006600]"><Filter className="h-5 w-5" /></Button>
            </div>
          </div>

          <div className="flex gap-6 border-b border-slate-200 px-2 overflow-x-auto scrollbar-hide">
            {["all", "active", "blocked"].map((f) => (
              <button key={f} onClick={() => setFilter(f as any)} className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'text-[#006600] border-b-2 border-[#006600]' : 'text-slate-400'}`}>{f === 'all' ? 'All Users' : f}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.uid} className="rounded-2xl border-none shadow-md overflow-hidden bg-white transition-transform active:scale-[0.98]">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className={`h-16 w-16 rounded-xl border-2 ${user.isBlocked ? 'grayscale opacity-50' : 'border-[#006600]/10'}`}>
                    <AvatarImage src={user.photoURL} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 rounded-xl">{user.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm text-slate-800 truncate">{user.displayName}</p>
                      {user.isBlocked && <Badge variant="destructive" className="text-[8px] h-4 px-1 uppercase font-bold">Blocked</Badge>}
                    </div>
                    <p className="text-[10px] text-[#006600] font-bold uppercase tracking-tight truncate">#ID: {user.studentId || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{user.program || 'GENERAL'}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${user.isBlocked ? 'text-red-500' : 'text-green-600'}`}>{user.isBlocked ? 'SUSPENDED' : 'ACTIVE'}</span>
                      <Switch checked={!user.isBlocked} onCheckedChange={() => handleToggleBlock(user.uid, user.isBlocked)} className="scale-75" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredUsers.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm italic">No users found.</div>}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}