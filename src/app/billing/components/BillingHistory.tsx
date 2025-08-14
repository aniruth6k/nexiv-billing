"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Filter, Receipt, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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
  customer_name?: string;
  customer_phone?: string;
  total: string;
  subtotal: string;
  tax_amount: string;
  created_at: string;
  bill_number?: string;
  payment_method: string;
  payment_status: string;
  items: BillItem[];
}

interface BillingHistoryProps {
  hotelId: string;
}

export default function BillingHistory({ hotelId }: BillingHistoryProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    fetchBills();
  }, [hotelId]);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, dateFilter, paymentFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (error: unknown) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    const filtered = [...bills];

    if (searchTerm) {
      filtered.splice(0, filtered.length, ...filtered.filter(bill =>
        bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer_phone?.includes(searchTerm) ||
        bill.bill_number?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered.splice(0, filtered.length, ...filtered.filter(bill => {
        const billDate = new Date(bill.created_at);
        
        switch (dateFilter) {
          case "today":
            return billDate >= today;
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return billDate >= weekAgo;
          case "month":
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return billDate >= monthAgo;
          default:
            return true;
        }
      }));
    }

    if (paymentFilter !== "all") {
      filtered.splice(0, filtered.length, ...filtered.filter(bill => bill.payment_status === paymentFilter));
    }

    setFilteredBills(filtered);
  };

  const deleteBill = async (billId: string, billNumber?: string) => {
    const customerName = bills.find(b => b.id === billId)?.customer_name || "Walk-in Customer";
    const billRef = billNumber ? `#${billNumber.slice(-8)}` : "this bill";
    
    toast.custom((t) => (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-red-200 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">Delete Bill</h3>
            <p className="text-sm text-gray-600 mb-3 break-words">
              Are you sure you want to delete {billRef} for {customerName}? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  toast.dismiss(t);
                  try {
                    const { error } = await supabase
                      .from("bills")
                      .delete()
                      .eq("id", billId);

                    if (error) throw error;
                    
                    setBills(prev => prev.filter(bill => bill.id !== billId));
                    toast.success("Bill deleted successfully");
                  } catch (error: unknown) {
                    console.error("Error deleting bill:", error);
                    toast.error("Failed to delete bill");
                  }
                }}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.dismiss(t)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center'
    });
  };

  const getTotalRevenue = () => {
    return filteredBills.reduce((sum, bill) => sum + parseFloat(bill.total), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold">{filteredBills.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{getTotalRevenue().toLocaleString()}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Bill Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{filteredBills.length > 0 ? (getTotalRevenue() / filteredBills.length).toFixed(0) : '0'}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Bills</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredBills.filter(b => b.payment_status === 'paid').length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchBills}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bills History</CardTitle>
          <p className="text-sm text-gray-600">
            Showing {filteredBills.length} of {bills.length} bills
          </p>
        </CardHeader>
        <CardContent>
          {filteredBills.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bills found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBills.map((bill) => (
                <div key={bill.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">
                          {bill.customer_name || "Walk-in Customer"}
                        </h4>
                        {bill.bill_number && (
                          <Badge variant="outline" className="text-xs">
                            #{bill.bill_number.slice(-8)}
                          </Badge>
                        )}
                        <Badge 
                          variant={bill.payment_status === 'paid' ? 'default' : bill.payment_status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {bill.payment_status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span><br />
                          {format(new Date(bill.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span><br />
                          {format(new Date(bill.created_at), 'hh:mm a')}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span><br />
                          {bill.items?.length || 0} items
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span><br />
                          {bill.customer_phone || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        ₹{parseFloat(bill.total).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteBill(bill.id, bill.bill_number)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}