// src/app/dashboard/components/StatsCards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, IndianRupee } from "lucide-react";

interface StatsCardsProps {
  staff: any[];
  bills: any[];
}

export default function StatsCards({ staff, bills }: StatsCardsProps) {
  const totalRevenue = bills.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
  const todayBills = bills.filter(bill => {
    const billDate = new Date(bill.created_at).toDateString();
    const today = new Date().toDateString();
    return billDate === today;
  });

  const stats = [
    { 
      title: "Total Revenue", 
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      description: "All time revenue"
    },
    { 
      title: "Active Staff", 
      value: staff.length.toString(),
      icon: Users,
      description: "Total staff members"
    },
    { 
      title: "Bills Today", 
      value: todayBills.length.toString(),
      icon: CreditCard,
      description: "Today's billing count"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
