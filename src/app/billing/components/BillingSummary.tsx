"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Receipt, 
  Users, 
  UtensilsCrossed,
  Calendar,
  Clock,
  BarChart3,
  AlertCircle,
  ShoppingCart
} from "lucide-react";
import Link from "next/link";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: 'room' | 'food' | 'service';
  originalPrice: number;
}

interface Bill {
  id: string;
  bill_number: string;
  customer_name: string;
  total: number;
  created_at: string;
  payment_status: string;
  hotel_id: string;
  items?: BillItem[];
}

interface BillingSummaryProps {
  hotelId: string;
}

interface SummaryData {
  totalRevenue: number;
  totalBills: number;
  averageBillAmount: number;
  todayRevenue: number;
  todayBills: number;
  revenueGrowth: number;
  billsGrowth: number;
  categoryBreakdown: {
    room: number;
    food: number;
    service: number;
  };
  recentBills: Array<{
    id: string;
    bill_number: string;
    customer_name: string;
    total: number;
    created_at: string;
    payment_status: string;
  }>;
}

export default function BillingSummary({ hotelId }: BillingSummaryProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

      const { data: allBills, error: billsError } = await supabase
        .from("bills")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });

      if (billsError) throw billsError;

      const { data: recentBills, error: recentError } = await supabase
        .from("bills")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const typedAllBills = allBills as Bill[];
      const typedRecentBills = recentBills as Bill[];

      const totalRevenue = typedAllBills.reduce((sum: number, bill: Bill) => sum + (bill.total || 0), 0);
      const totalBills = typedAllBills.length;
      const averageBillAmount = totalBills > 0 ? totalRevenue / totalBills : 0;

      const todayBills = typedAllBills.filter((bill: Bill) => new Date(bill.created_at) >= today);
      const todayRevenue = todayBills.reduce((sum: number, bill: Bill) => sum + (bill.total || 0), 0);

      const lastMonthBills = typedAllBills.filter((bill: Bill) => {
        const billDate = new Date(bill.created_at);
        return billDate >= lastMonth && billDate < now;
      });
      const lastMonthRevenue = lastMonthBills.reduce((sum: number, bill: Bill) => sum + (bill.total || 0), 0);

      const previousMonthBills = typedAllBills.filter((bill: Bill) => {
        const billDate = new Date(bill.created_at);
        return billDate >= previousMonth && billDate < lastMonth;
      });
      const previousMonthRevenue = previousMonthBills.reduce((sum: number, bill: Bill) => sum + (bill.total || 0), 0);

      const revenueGrowth = previousMonthRevenue > 0 
        ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;
      const billsGrowth = previousMonthBills.length > 0 
        ? ((lastMonthBills.length - previousMonthBills.length) / previousMonthBills.length) * 100 
        : 0;

      const categoryBreakdown = { room: 0, food: 0, service: 0 };
      
      typedAllBills.forEach((bill: Bill) => {
        if (bill.items && Array.isArray(bill.items)) {
          bill.items.forEach((item: BillItem) => {
            const amount = (item.price || 0) * (item.quantity || 1);
            if (item.category === 'room') {
              categoryBreakdown.room += amount;
            } else if (item.category === 'food') {
              categoryBreakdown.food += amount;
            } else if (item.category === 'service') {
              categoryBreakdown.service += amount;
            }
          });
        }
      });

      setSummaryData({
        totalRevenue,
        totalBills,
        averageBillAmount,
        todayRevenue,
        todayBills: todayBills.length,
        revenueGrowth,
        billsGrowth,
        categoryBreakdown,
        recentBills: typedRecentBills.map((bill: Bill) => ({
          id: bill.id,
          bill_number: bill.bill_number,
          customer_name: bill.customer_name,
          total: bill.total,
          created_at: bill.created_at,
          payment_status: bill.payment_status
        }))
      });

    } catch (error: unknown) {
      console.error("Error fetching summary data:", error);
      setError("Failed to load billing summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [hotelId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{"Today's Revenue"}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{summaryData.todayRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summaryData.todayBills} bills today
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <IndianRupee className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{summaryData.totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {summaryData.revenueGrowth > 0 ? (
                    <TrendingUp className="w-3 h-3 text-gray-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-gray-600" />
                  )}
                  <p className="text-xs text-gray-500">
                    {Math.abs(summaryData.revenueGrowth).toFixed(1)}% vs last month
                  </p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <TrendingUp className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryData.totalBills}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {summaryData.billsGrowth > 0 ? (
                    <TrendingUp className="w-3 h-3 text-gray-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-gray-600" />
                  )}
                  <p className="text-xs text-gray-500">
                    {Math.abs(summaryData.billsGrowth).toFixed(1)}% vs last month
                  </p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Receipt className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg. Bill Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{summaryData.averageBillAmount.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Per transaction
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5" />
            Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-gray-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900">₹{summaryData.categoryBreakdown.food.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Food & Beverages</p>
            </div>
            
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900">₹{summaryData.categoryBreakdown.service.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Services</p>
            </div>
            
            <div className="text-center p-4 border border-gray-100 rounded-lg">
              <Receipt className="w-5 h-5 text-gray-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900">₹{summaryData.categoryBreakdown.room.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Rooms</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Clock className="w-5 h-5" />
            Recent Bills
          </CardTitle>
          <p className="text-sm text-gray-600">Latest billing transactions</p>
        </CardHeader>
        <CardContent>
          {summaryData.recentBills.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No recent bills</p>
              <p className="text-sm text-gray-400 mt-1">
                Bills will appear here after creation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {summaryData.recentBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="font-medium text-sm text-gray-900">
                        {bill.customer_name || "Walk-in Customer"}
                      </span>
                      {bill.bill_number && (
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                          #{bill.bill_number.slice(-6)}
                        </Badge>
                      )}
                      <Badge 
                        variant={bill.payment_status === 'paid' ? 'default' : 'secondary'} 
                        className={`text-xs ${
                          bill.payment_status === 'paid' 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {bill.payment_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 ml-5">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(bill.created_at)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(bill.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">
                      ₹{bill.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {summaryData.recentBills.length >= 5 && (
                <>
                  <Separator />
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-3">
                      Showing recent 5 bills
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard">
                        View All Bills
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50" asChild>
            <Link href="/dashboard">
              <Receipt className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-gray-700">View All Bills</span>
            </Link>
          </Button>
          
          <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-400 cursor-not-allowed" disabled>
            <BarChart3 className="w-4 h-4 mr-2" />
            Detailed Analytics (Coming Soon)
          </Button>
          
          <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-400 cursor-not-allowed" disabled>
            <TrendingUp className="w-4 h-4 mr-2" />
            Export Reports (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
