// src/app/settings/page.tsx
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, AlertTriangle, Bed } from "lucide-react";
import ProfileSettings from "./components/ProfileSettings";
import InventoryManagement from "./components/InventoryManagement";
import CrashReportForm from "./components/CrashReportForm";
import RoomTypeManagement from "./components/RoomTypeManagement";

interface Hotel {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
}

export default async function SettingsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your hotel configuration and preferences</p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="rooms" className="flex items-center gap-2">
                <Bed className="w-4 h-4" />
                Room Types
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="crash-report" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Report Issue
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings Tab */}
            <TabsContent value="profile" className="mt-6">
              <ProfileSettings hotelId={hotel.id} />
            </TabsContent>

            {/* Room Type Management Tab */}
            <TabsContent value="rooms" className="mt-6">
              <RoomTypeManagement hotelId={hotel.id} />
            </TabsContent>

            {/* Inventory Management Tab */}
            <TabsContent value="inventory" className="mt-6">
              <InventoryManagement hotelId={hotel.id} />
            </TabsContent>

            {/* Crash Report Tab */}
            <TabsContent value="crash-report" className="mt-6">
              <CrashReportForm hotelId={hotel.id} userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  } catch (error) {
    console.error("Unexpected error in settings page:", error);
    redirect("/hotel/auth");
  }
}