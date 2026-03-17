
"use client";

import { useAuthInstance } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { loading } = useAuth();
  const auth = useAuthInstance();
  const googleProvider = new GoogleAuthProvider();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl border-t-8 border-t-primary">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary w-20 h-20 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-3xl font-headline">NEU</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold font-headline">NEU Library</CardTitle>
            <CardDescription className="text-base">Visitor Log System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <p className="text-center text-muted-foreground text-sm">
            Please sign in with your NEU Google account to access the library visitor log.
          </p>
          <Button 
            className="w-full h-12 text-lg font-medium transition-all hover:scale-[1.02]" 
            size="lg"
            onClick={handleLogin}
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-50">
            <BookOpen className="h-3 w-3" />
            <span>Empowering Research & Learning</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
