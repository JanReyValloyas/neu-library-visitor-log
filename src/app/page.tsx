
"use client";

import { useEffect, useState } from "react";
import { useAuthInstance } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const { loading: authLoading } = useAuth();
  const auth = useAuthInstance();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!auth) return;

    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Successfully signed in via redirect");
        }
      } catch (error: any) {
        console.error("Error handling redirect result:", error);
        // Common error codes like 'auth/popup-closed-by-user' don't apply to redirect
        // but we'll show a generic error for others.
        toast({
          title: "Sign-in Error",
          description: error.message || "An error occurred while completing the sign-in process.",
          variant: "destructive",
        });
      }
    };

    checkRedirectResult();
  }, [auth]);

  const handleLogin = async () => {
    if (!auth) {
      toast({
        title: "Auth Error",
        description: "Authentication service is not available.",
        variant: "destructive",
      });
      return;
    }

    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      setRedirecting(true);
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      setRedirecting(false);
      console.error("Login redirect failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred while initiating sign in.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">
            {redirecting ? "Redirecting to Google..." : "Authenticating..."}
          </p>
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
            disabled={redirecting}
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
