"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/index";
import { signOut, updateProfile } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  LogOut, 
  User as UserIcon, 
  Library, 
  Clock, 
  ShieldCheck, 
  Loader2, 
  Save,
  ChevronDown, 
  ChevronUp, 
  Settings2,
  CheckCircle2,
  LayoutDashboard,
  Users,
  BarChart,
  Settings,
  Monitor
} from "lucide-react";
import { BottomNav } from "@/components/admin/bottom-nav";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AdminSettings() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [libraryName, setLibraryName] = useState("NEU Main Library");
  const [libraryHours, setLibraryHours] = useState("7:00 AM - 9:00 PM");
  const [isSavingLibrary, setIsSavingLibrary] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxVisitors, setMaxVisitors] = useState(500);
  const [requireStudentId, setRequireStudentId] = useState(false);
  const [autoSignOut, setAutoSignOut] = useState(true);
  const [allowedDomain, setAllowedDomain] = useState("neu.edu.ph");
  const [savingAdvanced, setSavingAdvanced] = useState(false);
  const [advancedSaved, setAdvancedSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      router.replace("/");
    }
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, "settings", "library");
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data();
          setMaxVisitors(data.maxVisitors ?? 500);
          setRequireStudentId(data.requireStudentId ?? false);
          setAutoSignOut(data.autoSignOut ?? true);
          setAllowedDomain(data.allowedDomain ?? "neu.edu.ph");
          setLibraryName(data.libraryName ?? "NEU Main Library");
          setLibraryHours(data.operationalHours ?? "7:00 AM - 9:00 PM");
        }
      } catch (error) {
        console.error("Load settings error:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout failed", variant: "destructive" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!user || !db) return;
    setIsSavingAccount(true);
    try {
      await updateProfile(user, { displayName });
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { displayName, updatedAt: serverTimestamp() });
      toast({ title: "Account updated successfully" });
    } catch (error) {
      console.error("Save account error:", error);
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSaveLibrary = async () => {
    if (!db) return;
    setIsSavingLibrary(true);
    try {
      const settingsRef = doc(db, "settings", "library");
      await setDoc(settingsRef, {
        libraryName,
        operationalHours: libraryHours,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: "Library settings saved!" });
    } catch (error) {
      console.error("Save library error:", error);
      toast({ title: "Failed to save library info", variant: "destructive" });
    } finally {
      setIsSavingLibrary(false);
    }
  };

  const handleSaveAdvanced = async () => {
    if (!db || !user) return;
    setSavingAdvanced(true);
    try {
      const settingsRef = doc(db, "settings", "library");
      await setDoc(settingsRef, {
        maxVisitors,
        requireStudentId,
        autoSignOut,
        allowedDomain,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
      }, { merge: true });
      setAdvancedSaved(true);
      toast({ title: "Advanced settings saved!" });
      setTimeout(() => setAdvancedSaved(false), 3000);
    } catch (error) {
      console.error("Save advanced error:", error);
      toast({ title: "Failed to save advanced settings", variant: "destructive" });
    } finally {
      setSavingAdvanced(false);
    }
  };

  if (authLoading) {
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
    { name: "Kiosk Mode", href: "/admin/kiosk", icon: Monitor },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f8f5]">
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-primary/10 pt-6 z-20">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#006600] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">NEU</div>
          <div><h1 className="font-bold text-sm text-slate-800">NEU Library</h1><p className="text-[10px] font-bold text-[#D4AF37] uppercase">Admin Panel</p></div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase ${pathname === item.href ? 'bg-[#006600] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><item.icon className="h-4 w-4" />{item.name}</Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 md:ml-64 pb-20 md:pb-8">
        <header className="p-4 md:p-6 bg-white border-b sticky top-0 z-10">
          <h1 className="font-bold text-lg text-slate-800">Portal Settings</h1>
          <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Administration</p>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
            <CardContent className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 bg-gradient-to-br from-[#006600] to-[#004d00] text-white">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-[#D4AF37] shadow-xl">
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback className="bg-[#D4AF37] text-white font-bold text-2xl">{user?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-bold text-2xl md:text-3xl">{user?.displayName}</h2>
                <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mt-1">Authorized Administrator</p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-3 opacity-90"><ShieldCheck className="h-4 w-4" /><span className="text-sm">{user?.email}</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Account Management</h3>
              <Card className="rounded-2xl border-none shadow-md bg-white p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Display Name</Label>
                  <div className="relative group"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#006600]" /><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10 h-12 rounded-xl" /></div>
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-slate-400">Email Address (Read-only)</Label><Input value={user?.email || ""} disabled className="h-12 bg-slate-50 rounded-xl opacity-70" /></div>
                <Button onClick={handleSaveAccount} className="w-full bg-[#006600] h-12 rounded-xl font-bold uppercase text-xs gap-2" disabled={isSavingAccount}>{isSavingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile</Button>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Library Configuration</h3>
              <Card className="rounded-2xl border-none shadow-md bg-white p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">System Name</Label>
                  <div className="relative"><Library className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input value={libraryName} onChange={(e) => setLibraryName(e.target.value)} className="pl-10 h-12 rounded-xl" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Operating Hours</Label>
                  <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input value={libraryHours} onChange={(e) => setLibraryHours(e.target.value)} className="pl-10 h-12 rounded-xl" /></div>
                </div>
                <Button onClick={handleSaveLibrary} className="w-full bg-[#006600] h-12 rounded-xl font-bold uppercase text-xs gap-2" disabled={isSavingLibrary}>{isSavingLibrary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Library Info</Button>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Advanced Controls</h3>
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-[#006600] transition">
              <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-[#006600]" /><span className="font-bold text-xs uppercase text-slate-700">Advanced System Settings</span></div>
              {showAdvanced ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
            </button>
            {showAdvanced && (
              <Card className="rounded-2xl border-none shadow-md bg-white p-6 md:p-10 space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Max Daily Visitors</label><Input type="number" value={maxVisitors} onChange={(e) => setMaxVisitors(Number(e.target.value))} className="h-12 rounded-xl" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Allowed Domain</label><Input value={allowedDomain} onChange={(e) => setAllowedDomain(e.target.value)} className="h-12 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50"><span className="text-xs font-bold text-slate-600 uppercase">Require Student ID</span><Switch checked={requireStudentId} onCheckedChange={setRequireStudentId} /></div>
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50"><span className="text-xs font-bold text-slate-600 uppercase">Auto Sign-out</span><Switch checked={autoSignOut} onCheckedChange={setAutoSignOut} /></div>
                </div>
                <Button onClick={handleSaveAdvanced} disabled={savingAdvanced} className="w-full bg-[#006600] h-14 rounded-xl font-bold uppercase text-sm gap-2">{savingAdvanced ? <Loader2 className="h-5 w-5 animate-spin" /> : advancedSaved ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />} Save Global Configuration</Button>
              </Card>
            )}
          </div>

          <Card className="rounded-2xl border-2 border-red-50 shadow-sm bg-white p-5"><Button variant="destructive" onClick={handleSignOut} disabled={isLoggingOut} className="w-full h-12 rounded-xl font-bold uppercase text-xs gap-2">{isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Sign Out from Admin Portal</Button></Card>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
