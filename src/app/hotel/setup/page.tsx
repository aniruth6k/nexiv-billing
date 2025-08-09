"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function HotelSetupPage() {
  const router = useRouter();
  const [hotelName, setHotelName] = useState("");
  const [address, setAddress] = useState("");
  const [services, setServices] = useState<string[]>(["Rooms"]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/hotel/auth");
        return;
      }
      setUserId(user.id);
      fetchHotel();
    };

    const fetchHotel = async () => {
      const { data } = await supabase.from("hotels").select("*").single();
      if (data) {
        setHotelName(data.name);
        setAddress(data.address || "");
        setServices(data.services || []);
        setLogoUrl(data.logo_url || null);
      }
    };

    checkAuth();
  }, [router]);

  const toggleService = (service: string) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = async () => {
    if (!userId) return; // extra safety

    setLoading(true);

    let finalLogoUrl = logoUrl;

    if (logoFile) {
      const filePath = `logos/${Date.now()}-${logoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("hotel-logos")
        .upload(filePath, logoFile, { upsert: true });
      if (uploadError) {
        console.error(uploadError);
        setLoading(false);
        return;
      }
      const { data: publicUrl } = supabase.storage
        .from("hotel-logos")
        .getPublicUrl(filePath);
      finalLogoUrl = publicUrl.publicUrl;
    }

    const { error } = await supabase.from("hotels").upsert({
      name: hotelName,
      address,
      logo_url: finalLogoUrl,
      services,
      owner_id: userId,
    });

    setLoading(false);
    if (error) console.error(error);
    else router.push("/dashboard");
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 p-6">
      <h1 className="text-2xl font-bold">Setup Hotel</h1>

      {logoUrl && (
        <img
          src={logoUrl}
          alt="Hotel Logo"
          className="w-24 h-24 object-cover rounded"
        />
      )}

      <Label>Hotel Logo</Label>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
      />

      <Label>Hotel Name</Label>
      <Input
        value={hotelName}
        onChange={(e) => setHotelName(e.target.value)}
      />

      <Label>Address</Label>
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <div className="space-y-2">
        <Label>Services</Label>
        {["Rooms", "Meals", "Spa", "Swimming"].map((service) => (
          <div key={service} className="flex items-center space-x-2">
            <Checkbox
              checked={services.includes(service)}
              onCheckedChange={() => toggleService(service)}
            />
            <span>{service}</span>
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
