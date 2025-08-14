"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Search, Receipt as ReceiptIcon, ArrowLeft } from "lucide-react";

interface BillItem {
  name: string;
  category?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
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

interface Hotel {
  id: string;
  name: string;
  address?: string;
  logo_url?: string;
  contact_phone?: string;
  contact_email?: string;
}

interface ReceiptViewerProps {
  hotelId: string;
}

export default function ReceiptViewer({ hotelId }: ReceiptViewerProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [hotelInfo, setHotelInfo] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  const fetchHotelInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name, address, logo_url, contact_phone, contact_email")
        .eq("id", hotelId)
        .single();

      if (error) throw error;
      setHotelInfo(data);
    } catch (error) {
      console.error("Error fetching hotel info:", error);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchBills();
    fetchHotelInfo();
  }, [fetchBills, fetchHotelInfo]);

  const filteredBills = bills.filter(bill =>
    bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_phone?.includes(searchTerm) ||
    bill.bill_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    if (!selectedBill) return;
    
    const printContent = document.getElementById('receipt-print-area');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${selectedBill.bill_number}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px;
                  background: white;
                }
                .receipt { 
                  max-width: 400px; 
                  margin: 0 auto; 
                  background: white;
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 20px; 
                }
                .logo { 
                  max-width: 80px; 
                  margin-bottom: 10px; 
                }
                .separator { 
                  border-top: 1px dashed #000; 
                  margin: 15px 0; 
                }
                .item-row { 
                  display: flex; 
                  justify-content: space-between; 
                  margin: 8px 0; 
                  font-size: 14px;
                }
                .total-row { 
                  font-weight: bold; 
                  font-size: 16px; 
                }
                .text-center { text-align: center; }
                .text-sm { font-size: 12px; }
                .font-bold { font-weight: bold; }
                .mb-2 { margin-bottom: 8px; }
                .mb-4 { margin-bottom: 16px; }
                .mt-4 { margin-top: 16px; }
                @media print { 
                  body { margin: 0; padding: 10px; }
                  .receipt { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handleDownload = () => {
    if (!selectedBill) return;
    
    const receiptContent = document.getElementById('receipt-print-area');
    if (receiptContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${selectedBill.bill_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt { max-width: 400px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .logo { max-width: 80px; margin-bottom: 10px; }
                .separator { border-top: 1px dashed #000; margin: 15px 0; }
                .item-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .total-row { font-weight: bold; font-size: 16px; }
              </style>
            </head>
            <body onload="window.print();window.close();">
              ${receiptContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }

  if (selectedBill) {
    return (
      <div className="space-y-6">
        {/* Back Button and Actions */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setSelectedBill(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Receipt Display */}
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div id="receipt-print-area" className="receipt">
              {/* Hotel Header */}
              <div className="header text-center mb-6">
                {hotelInfo?.logo_url && (
                  <img 
                    src={hotelInfo.logo_url} 
                    alt="Hotel Logo" 
                    className="logo mx-auto mb-3 w-20 h-20 object-contain"
                  />
                )}
                <h2 className="text-xl font-bold mb-2">{hotelInfo?.name || "Hotel Name"}</h2>
                {hotelInfo?.address && (
                  <p className="text-sm text-gray-600 mb-2">{hotelInfo.address}</p>
                )}
                <div className="text-sm text-gray-600">
                  {hotelInfo?.contact_phone && <p>Phone: {hotelInfo.contact_phone}</p>}
                  {hotelInfo?.contact_email && <p>Email: {hotelInfo.contact_email}</p>}
                </div>
              </div>

              <div className="separator"></div>

              {/* Bill Details */}
              <div className="mb-4">
                <div className="item-row">
                  <span className="font-bold">Bill No:</span>
                  <span className="font-mono text-sm">{selectedBill.bill_number}</span>
                </div>
                <div className="item-row">
                  <span className="font-bold">Date:</span>
                  <span>{new Date(selectedBill.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="item-row">
                  <span className="font-bold">Time:</span>
                  <span>{new Date(selectedBill.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="separator"></div>

              {/* Customer Details */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Customer Details:</h3>
                <div className="item-row text-sm">
                  <span>Name:</span>
                  <span>{selectedBill.customer_name || "Walk-in Customer"}</span>
                </div>
                {selectedBill.customer_phone && (
                  <div className="item-row text-sm">
                    <span>Phone:</span>
                    <span>{selectedBill.customer_phone}</span>
                  </div>
                )}
              </div>

              <div className="separator"></div>

              {/* Items */}
              <div className="mb-4">
                <h3 className="font-bold mb-3">Bill Details:</h3>
                <div className="space-y-2">
                  {selectedBill.items?.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.category?.toUpperCase()} - ₹{item.originalPrice || item.price} × {item.quantity || 1}
                        </div>
                      </div>
                      <div className="font-medium">
                        ₹{((item.price || item.originalPrice || 0) * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>

              <div className="separator"></div>

              {/* Totals */}
              <div className="mb-4">
                <div className="item-row">
                  <span>Subtotal:</span>
                  <span>₹{parseFloat(selectedBill.subtotal || selectedBill.total).toFixed(2)}</span>
                </div>
                <div className="item-row">
                  <span>GST (18%):</span>
                  <span>₹{parseFloat(selectedBill.tax_amount || '0').toFixed(2)}</span>
                </div>
                <div className="separator"></div>
                <div className="item-row total-row">
                  <span>Total:</span>
                  <span>₹{parseFloat(selectedBill.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="separator"></div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-600 mt-4">
                <p>Thank you for choosing us!</p>
                <p className="mt-2">Please visit again</p>
                <p className="mt-3">Generated by Nexiv Hotel Management System</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5" />
            Receipt Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer name, phone, or bill number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={fetchBills}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
          <p className="text-sm text-gray-600">
            Click on any bill to view its receipt
          </p>
        </CardHeader>
        <CardContent>
          {filteredBills.length === 0 ? (
            <div className="text-center py-8">
              <ReceiptIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bills found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredBills.map((bill) => (
                <div
                  key={bill.id}
                  onClick={() => setSelectedBill(bill)}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
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
                          variant={bill.payment_status === 'paid' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {bill.payment_status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>
                          {new Date(bill.created_at).toLocaleDateString('en-IN')} at{' '}
                          {new Date(bill.created_at).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <span>{bill.items?.length || 0} items</span>
                        {bill.customer_phone && <span>{bill.customer_phone}</span>}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ₹{parseFloat(bill.total).toLocaleString()}
                      </div>
                      <Button size="sm" variant="outline" className="mt-1">
                        View Receipt
                      </Button>
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