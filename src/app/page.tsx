"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      router.push("/hotel"); // Let /hotel/page.tsx decide auth flow
    };
    checkAuth();
  }, [router]);

  return null;
}
