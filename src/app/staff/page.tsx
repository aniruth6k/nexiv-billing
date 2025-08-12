// src/app/staff/page.tsx
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import AppLayout from "@/components/layout/AppLayout";
import StaffDashboard from "./components/StaffDashboard";

interface Hotel {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
}

export default async function StaffPage() {
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

    // Fetch staff data with all necessary fields
    const { data: staff } = await supabase
      .from("staff")
      .select(`
        id,
        name,
        role,
        contact,
        email,
        age,
        place,
        id_type,
        id_number,
        id_verification_notes,
        salary,
        joining_date,
        emergency_contact,
        attendance,
        status,
        created_at,
        additional_info
      `)
      .eq("hotel_id", hotel.id)
      .order("created_at", { ascending: false });

    return (
      <AppLayout hotel={hotel}>
        <div className="max-w-7xl mx-auto p-6">
          <StaffDashboard staff={staff || []} hotelId={hotel.id} />
        </div>
      </AppLayout>
    );
  } catch (error) {
    console.error("Unexpected error in staff page:", error);
    redirect("/hotel/auth");
  }
}