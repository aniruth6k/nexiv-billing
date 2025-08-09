import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function HotelIndexPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/hotel/auth");
  }

  // Check if hotel exists for this user
  const { data: hotel, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching hotel:", error);
    redirect("/hotel/setup"); // fallback
  }

  if (!hotel) {
    redirect("/hotel/setup");
  }

  // If hotel exists, go to dashboard
  redirect("/dashboard");
}
