"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
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
  AlertCircle
} from "lucide-react";
import { BottomNav } from "@/components/admin/bottom-nav";
import { toast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Auth & Profile State
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Library Info State
  const [libraryName, setLibraryName] = useState("NEU Main Library");
  const [libraryHours, setLibraryHours] = useState("7:00 AM - 9:00 PM");
  const [isSavingLibrary, setIsSavingLibrary] = useState(false);

  // Advanced Settings State
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

  // Load existing settings from Firestore on mount
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
      // Update Auth Profile
      await updateProfile(user, { displayName });
      // Update User Doc
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { 
        displayName,
        updatedAt: serverTimestamp() 
      });
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

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[#f5f8f5]">
      <header className="p-6 bg-white border-b sticky top-0 z-10">
        <h1 className="font-bold text-lg text-slate-800">Settings</h1>
        <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">ADMINISTRATION PANEL</p>
      </header>

      <main className="p-4 space-y-6 animate-in fade-in duration-500">
        {/* Profile Card */}
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

        {/* Account Management */}
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
                onClick={handleSaveAccount} 
                className="w-full bg-[#006600] hover:bg-[#004d00] h-11 rounded-xl font-bold uppercase tracking-wider text-xs gap-2"
                disabled={isSavingAccount}
              >
                {isSavingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Account Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Library Configuration */}
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
                    className="pl-10 h-11 border-slate-200 rounded-xl focus-visible:ring-[#006600]"
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
                    className="pl-10 h-11 border-slate-200 rounded-xl focus-visible:ring-[#006600]"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveLibrary} 
                className="w-full bg-[#006600] hover:bg-[#004d00] h-11 rounded-xl font-bold uppercase tracking-wider text-xs gap-2"
                disabled={isSavingLibrary}
              >
                {isSavingLibrary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Library Info
              </Button>
              
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
                      <Input 
                        type="number"
                        value={maxVisitors}
                        onChange={(e) => setMaxVisitors(Number(e.target.value))}
                        className="h-11 border-slate-200 rounded-xl focus-visible:ring-[#006600] bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Require Student ID for Check-in
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-slate-200 p-0.5 transition-colors has-[:checked]:bg-[#006600]">
                          <input 
                            type="checkbox" 
                            className="peer invisible absolute" 
                            checked={requireStudentId}
                            onChange={(e) => setRequireStudentId(e.target.checked)}
                          />
                          <div className="h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 peer-checked:translate-x-5"></div>
                        </label>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                          {requireStudentId ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Auto Sign-out After Check-in
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-slate-200 p-0.5 transition-colors has-[:checked]:bg-[#006600]">
                          <input 
                            type="checkbox" 
                            className="peer invisible absolute"
                            checked={autoSignOut}
                            onChange={(e) => setAutoSignOut(e.target.checked)}
                          />
                          <div className="h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 peer-checked:translate-x-5"></div>
                        </label>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                          {autoSignOut ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Allowed Email Domain
                      </label>
                      <Input 
                        type="text"
                        value={allowedDomain}
                        onChange={(e) => setAllowedDomain(e.target.value)}
                        className="h-11 border-slate-200 rounded-xl focus-visible:ring-[#006600] bg-white"
                      />
                    </div>

                    <Button 
                      onClick={handleSaveAdvanced}
                      disabled={savingAdvanced}
                      className="w-full bg-[#006600] hover:bg-green-800 text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition shadow-md gap-2"
                    >
                      {savingAdvanced ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : advancedSaved ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Settings Saved!
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Advanced Settings
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
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