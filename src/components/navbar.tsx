"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { profile, logout } = useAuth();

  if (!profile) return null;

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">NEU</span>
          </div>
          <span className="font-headline font-bold text-lg hidden sm:inline-block">
            Library Visitor Log
          </span>
        </div>

        <div className="flex items-center gap-4">
          {profile.role === "admin" && (
            <div className="hidden md:flex items-center gap-1 bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold border border-accent/20">
              <Shield className="h-3 w-3" />
              Administrator
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                  <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
