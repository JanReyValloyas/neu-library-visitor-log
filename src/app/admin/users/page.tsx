"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Menu, 
  Bell, 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck,
  UserCheck,
  UserMinus
} from "lucide-react";
import { BottomNav } from "@/components/admin/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

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
  const db = useFirestore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "blocked">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    });
  }, [db]);

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

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="font-bold text-lg">Users Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="h-8 w-8 bg-[#D4AF37] rounded-full flex items-center justify-center text-white font-bold text-[10px]">
            AD
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#006600]" />
            <Input 
              placeholder="Search by name, ID, or program" 
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 w-11 rounded-xl border-slate-200 p-0 text-[#006600]">
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-200 px-2">
          {["all", "active", "blocked"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'text-[#006600] border-b-2 border-[#006600]' 
                  : 'text-slate-400'
              }`}
            >
              {f === 'all' ? 'All Users' : f}
            </button>
          ))}
        </div>

        {/* User Cards */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.uid} className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className={`h-16 w-16 rounded-xl border-2 ${user.isBlocked ? 'grayscale opacity-50' : 'border-[#006600]/10'}`}>
                  <AvatarImage src={user.photoURL} className="object-cover" />
                  <AvatarFallback className="bg-slate-100 rounded-xl">{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm truncate">{user.displayName}</p>
                    {user.isBlocked && <Badge variant="destructive" className="text-[8px] h-4 px-1 leading-none uppercase">Blocked</Badge>}
                  </div>
                  <p className="text-[10px] text-[#006600] font-bold uppercase tracking-tight truncate">
                    #ID: {user.studentId || 'XXXXX'} • {user.program || 'GENERAL'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${user.isBlocked ? 'text-red-500' : 'text-green-600'}`}>
                      STATUS: {user.isBlocked ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                    <Switch 
                      checked={!user.isBlocked} 
                      onCheckedChange={() => handleToggleBlock(user.uid, user.isBlocked)}
                      className={`scale-75 ${user.isBlocked ? 'data-[state=unchecked]:bg-red-500' : 'data-[state=checked]:bg-[#006600]'}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredUsers.length === 0 && !loading && (
            <div className="p-12 text-center text-muted-foreground text-sm italic">
              No users found matching your filters.
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}