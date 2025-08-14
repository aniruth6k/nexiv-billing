// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import AppLayout from "@/components/layout/AppLayout";
import StatsCards from "./components/StatsCards";
import RecentBills from "./components/RecentBills";

interface Hotel {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
}

export default async function DashboardPage() {
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

    // Fetch staff data
    const { data: staff } = await supabase
      .from("staff")
      .select("*")
      .eq("hotel_id", hotel.id);

    // Fetch recent bills
    const { data: bills } = await supabase
      .from("bills")
      .select("*")
      .eq("hotel_id", hotel.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return (
      <AppLayout hotel={hotel}>
        <div className="max-w-7xl mx-auto space-y-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening at your hotel today.</p>
          </div>

          {/* Stats Cards */}
          <StatsCards staff={staff || []} bills={bills || []} />

          {/* Recent Bills */}
          <RecentBills bills={bills || []} />
        </div>
      </AppLayout>
    );
  } catch (error) {
    console.error("Unexpected error in dashboard:", error);
    redirect("/hotel/auth");
  }
}