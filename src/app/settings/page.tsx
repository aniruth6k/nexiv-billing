// src/app/settings/page.tsx
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, User, Palette, Bug, Mail, Calendar } from "lucide-react";
import CrashReportForm from "./components/CrashReportForm";
import ProfileSettings from "./components/ProfileSettings";
import ThemeSettings from "./components/ThemeSettings";

interface Hotel {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  services?: string[];
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
      .select("id, name, logo_url, address, services")
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
      services: hotelData.services,
    };

    return (
      <AppLayout hotel={hotel}>
        <div className="max-w-6xl mx-auto space-y-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account, hotel, and system preferences.</p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Hotel Profile
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Support
              </TabsTrigger>
            </TabsList>

            {/* Hotel Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <ProfileSettings hotelId={hotel.id} />
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Email
                    </p>
                    <p className="text-gray-800 ml-6">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      Account Created
                    </p>
                    <p className="text-gray-800 ml-6">
                      {new Date(user.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="mt-6">
              <ThemeSettings />
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5" />
                    Report an Issue
                  </CardTitle>
                  <p className="text-sm text-gray-600 pt-1">
                    Encountered a bug or have a suggestion? Let us know.
                  </p>
                </CardHeader>
                <CardContent>
                  <CrashReportForm hotelId={hotel.id} userId={user.id} />
                </CardContent>
              </Card>
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