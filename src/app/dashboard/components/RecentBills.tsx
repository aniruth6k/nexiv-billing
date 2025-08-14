// src/app/dashboard/components/RecentBills.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Bill {
  id: string;
  customer_name?: string;
  total: string | number;
  created_at: string;
  hotel_id: string;
}

interface RecentBillsProps {
  bills: Bill[];
}

export default function RecentBills({ bills }: RecentBillsProps) {
  if (!bills || bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500 mb-4">No bills created yet</p>
          <Button asChild>
            <Link href="/billing">Create Your First Bill</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bills</CardTitle>
        <Button variant="outline" asChild>
          <Link href="/billing">View All Bills</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">
                  #{bill.id.slice(-8).toUpperCase()}
                </TableCell>
                <TableCell>{bill.customer_name || "Walk-in Customer"}</TableCell>
                <TableCell>₹{parseFloat(bill.total.toString()).toLocaleString()}</TableCell>
                <TableCell>
                  {new Date(bill.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" disabled>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}