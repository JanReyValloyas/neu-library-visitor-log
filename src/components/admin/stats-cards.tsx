"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, BarChart3 } from "lucide-react";

interface StatsProps {
  today: number;
  week: number;
  month: number;
  allTime: number;
}

export function StatsCards({ today, week, month, allTime }: StatsProps) {
  const stats = [
    { title: "Visitors Today", value: today, icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "This Week", value: week, icon: Calendar, color: "text-green-600", bg: "bg-green-100" },
    { title: "This Month", value: month, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "All-Time Visitors", value: allTime, icon: Users, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`${stat.bg} p-2 rounded-lg`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
