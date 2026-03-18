"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/index";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LogOut, User as UserIcon, Settings as SettingsIcon, 
  Library, Clock, ShieldCheck, ChevronRight, Loader2, Save,
  ChevronDown, ChevronUp, Settings2
} from "lucide-react";
import { BottomNav } from "@/components/admin/bottom-nav";
import { toast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [libraryName, setLibraryName] = useState("NEU Main Library");
  const [libraryHours, setLibraryHours] = useState("7:00 AM - 9:00 PM");
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      router.replace("/");
    }
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user, role, authLoading, router]);

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

  const handleUpdateAccount = async () => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "users", user.uid), { displayName });
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-[#006600]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#f5f8f5]">
      <header className="p-6 bg-white border-b sticky top-0 z-10">
        <h1 className="font-bold text-lg text-slate-800">Settings</h1>
        <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">ADMINISTRATION PANEL</p>
      </header>

      <main className="p-4 space-y-6 animate-in fade-in duration-500">
        <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
          <CardContent className="p-6 flex items-center gap-4 bg-gradient-to-br from-[#006600] to-[#004d00] text-white">
            <Avatar className="h-16 w-16 border-2 border-[#D4AF37] shadow-lg">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="bg-[#D4AF37] text-white font-bold">{user?.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{user?.displayName}</h2>
              <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">AUTHORIZED ADMINISTRATOR</p>
              <div className="flex items-center gap-1 mt-1 opacity-80">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[10px] font-medium truncate">{user?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Account Management</h3>
          <Card className="rounded-2xl border-none shadow-md bg-white overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Display Name</Label>
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#006600]" />
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 h-11 border-slate-200 rounded-xl focus-visible:ring-[#006600]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address (Read-only)</Label>
                <Input 
                  value={user?.email || ""} 
                  disabled
                  className="h-11 border-slate-200 bg-slate-50 rounded-xl opacity-70"
                />
              </div>
              <Button 
                onClick={handleUpdateAccount} 
                className="w-full bg-[#006600] hover:bg-[#004d00] h-11 rounded-xl font-bold uppercase tracking-wider text-xs gap-2"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Account Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Library Configuration</h3>
          <Card className="rounded-2xl border-none shadow-md bg-white overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Library System Name</Label>
                <div className="relative">
                  <Library className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    value={libraryName} 
                    onChange={(e) => setLibraryName(e.target.value)}
                    className="pl-10 h-11 border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operational Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    value={libraryHours} 
                    onChange={(e) => setLibraryHours(e.target.value)}
                    className="pl-10 h-11 border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-[#006600] transition group bg-white"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-[#006600]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Advanced Settings
                    </span>
                  </div>
                  {showAdvanced ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 group-hover:text-[#006600]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-[#006600]" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="border border-slate-200 rounded-xl p-4 space-y-5 mt-2 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Max Visitors Per Day
                      </label>
                      <input 
                        type="number"
                        defaultValue={500}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006600] text-sm font-medium bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Require Student ID for Check-in
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-slate-200 p-0.5 transition-colors has-[:checked]:bg-[#006600]">
                          <input type="checkbox" className="peer invisible absolute" defaultChecked />
                          <div className="h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 peer-checked:translate-x-5"></div>
                        </label>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Enabled</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Auto Sign-out After Check-in
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-slate-200 p-0.5 transition-colors has-[:checked]:bg-[#006600]">
                          <input type="checkbox" defaultChecked className="peer invisible absolute"/>
                          <div className="h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 peer-checked:translate-x-5"></div>
                        </label>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Enabled</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Allowed Email Domain
                      </label>
                      <input 
                        type="text"
                        defaultValue="neu.edu.ph"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006600] text-sm font-medium bg-white"
                      />
                    </div>

                    <button className="w-full bg-[#006600] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-800 transition shadow-md mt-2">
                      Save Advanced Settings
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 pb-4">
          <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">Danger Zone</h3>
          <Card className="rounded-2xl border-2 border-red-50 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-5">
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full h-11 rounded-xl font-bold uppercase tracking-wider text-xs gap-2 shadow-lg"
              >
                {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Sign Out from Portal
              </Button>
              <p className="text-[9px] text-center text-slate-400 mt-3 font-medium uppercase tracking-widest">Session ID: {user?.uid.slice(0, 12)}...</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
