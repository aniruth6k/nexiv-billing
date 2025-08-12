// src/app/billing/page.tsx
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, BarChart3, Plus, History, UtensilsCrossed } from "lucide-react";
import BillingForm from "./components/BillingForm";
import BillingSummary from "./components/BillingSummary";
import BillingHistory from "./components/BillingHistory";
import ReceiptViewer from "./components/ReceiptViewer";
import FoodManagement from "./components/FoodManagement";

interface Hotel {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
}

export default async function BillingPage() {
  const supabase = await createServerClient();

  try {
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/hotel/auth");
    }

    // Check if user has a hotel setup
    const { data: hotelData, error: hotelError } = await supabase
      .from("hotels")
      .select("id, name, logo_url, address")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (hotelError || !hotelData) {
      redirect("/hotel/setup");
    }

    const hotel: Hotel = {
      id: hotelData.id,
      name: hotelData.name,
      logo_url: hotelData.logo_url,
      address: hotelData.address,
    };

    return (
      <AppLayout hotel={hotel}>
        <div className="max-w-7xl mx-auto space-y-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing System</h1>
            <p className="text-gray-600 mt-1">Manage your menu and create customer bills</p>
          </div>

          {/* Billing Tabs */}
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Food Menu
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Bill
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="receipts" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Receipts
              </TabsTrigger>
            </TabsList>

            {/* Food Menu Tab */}
            <TabsContent value="menu" className="mt-6">
              <FoodManagement hotelId={hotel.id} />
            </TabsContent>

            {/* Create Bill Tab */}
            <TabsContent value="create" className="mt-6">
              <BillingForm hotelId={hotel.id} />
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="mt-6">
              <BillingSummary hotelId={hotel.id} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <BillingHistory hotelId={hotel.id} />
            </TabsContent>

            {/* Receipts Tab */}
            <TabsContent value="receipts" className="mt-6">
              <ReceiptViewer hotelId={hotel.id} />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  } catch (error) {
    console.error("Unexpected error in billing page:", error);
    redirect("/hotel/auth");
  }
}