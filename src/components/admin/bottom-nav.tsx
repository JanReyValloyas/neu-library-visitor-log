"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[28rem] h-16 bg-white border-t flex items-center justify-around z-50">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-[#006600]" : "text-muted-foreground hover:text-[#006600]/70"
            )}
          >
            <tab.icon className={cn("h-5 w-5", isActive && "fill-current")} />
            <span className="text-[10px] font-medium">{tab.name}</span>
            {isActive && pathname === "/admin/users" && tab.name === "Users" && (
              <div className="w-1 h-1 bg-[#006600] rounded-full mt-0.5" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}