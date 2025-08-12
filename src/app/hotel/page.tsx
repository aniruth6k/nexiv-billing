"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HotelIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check user authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log("Auth check - User:", user?.id, "Error:", authError?.message);

        if (authError || !user) {
          console.log("No authenticated user found, redirecting to auth");
          router.replace("/hotel/auth");
          return;
        }

        // Check if user has a hotel setup
        const { data: hotel, error: hotelError } = await supabase
          .from("hotels")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        console.log("Hotel check - Hotel:", hotel?.id, "Error:", hotelError?.message);

        if (hotelError) {
          console.error("Hotel query error:", hotelError);
          // If there's a database error, still allow them to try setup
          router.replace("/hotel/setup");
          return;
        }

        if (!hotel) {
          console.log("No hotel found for user, redirecting to setup");
          router.replace("/hotel/setup");
          return;
        }

        // User has hotel setup, redirect to dashboard
        console.log("Hotel found, redirecting to dashboard");
        router.replace("/dashboard");
        
      } catch (error) {
        console.error("Unexpected error in HotelIndexPage:", error);
        router.replace("/hotel/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Checking your account...</div>
        </div>
      </div>
    );
  }

  // This should never render since we redirect, but just in case
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-lg text-gray-600">Redirecting...</div>
      </div>
    </div>
  );
}