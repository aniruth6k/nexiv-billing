"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HotelSetupPage() {
  const router = useRouter();
  const [hotelName, setHotelName] = useState("");
  const [address, setAddress] = useState("");
  const [services, setServices] = useState<string[]>(["Rooms"]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hotelId, setHotelId] = useState<string | null>(null);

  const availableServices = ["Rooms", "Meals", "Spa", "Swimming", "Laundry", "Room Service"];

  useEffect(() => {
    const checkAuthAndHotel = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("Authentication error:", authError?.message || "No user found");
          router.replace("/hotel/auth");
          return;
        }
        
        console.log("Authenticated user ID:", user.id);
        setUserId(user.id);

        // Check if hotel already exists
        const { data: hotel, error: hotelError } = await supabase
          .from("hotels")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (hotelError) {
          console.error("Hotel query error:", hotelError);
          if (hotelError.code !== "PGRST116") {
            setErrorMessage("Failed to fetch hotel data. Please try again.");
          }
          return;
        }

        if (hotel) {
          console.log("Hotel found:", hotel);
          setIsEditing(true);
          setHotelId(hotel.id);
          setHotelName(hotel.name || "");
          setAddress(hotel.address || "");
          setServices(Array.isArray(hotel.services) ? hotel.services : ["Rooms"]);
          setLogoUrl(hotel.logo_url || null);
        }
      } catch (error) {
        console.error("Unexpected error in checkAuthAndHotel:", error);
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    checkAuthAndHotel();
  }, [router]);

  const toggleService = (service: string) => {
    setServices((prev) => {
      if (service === "Rooms") return prev; // Always keep Rooms
      return prev.includes(service) 
        ? prev.filter((s) => s !== service) 
        : [...prev, service];
    });
  };

  const handleSubmit = async () => {
    if (!userId) return;

    if (!hotelName.trim()) {
      setErrorMessage("Hotel name is required");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      let finalLogoUrl = logoUrl;

      // Upload logo if a new file is selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("hotel-logos")
          .upload(filePath, logoFile, { 
            upsert: true,
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          setErrorMessage("Failed to upload logo. Please try again.");
          setLoading(false);
          return;
        }

        const { data: publicUrl } = supabase.storage
          .from("hotel-logos")
          .getPublicUrl(filePath);
        
        finalLogoUrl = publicUrl.publicUrl;
      }

      const hotelData = {
        name: hotelName.trim(),
        address: address.trim() || null,
        logo_url: finalLogoUrl,
        services,
        owner_id: userId,
      };

      let error;
      if (isEditing && hotelId) {
        // Update existing hotel
        const { error: updateError } = await supabase
          .from("hotels")
          .update(hotelData)
          .eq("id", hotelId)
          .eq("owner_id", userId);
        error = updateError;
      } else {
        // Insert new hotel
        const { error: insertError } = await supabase
          .from("hotels")
          .insert(hotelData);
        error = insertError;
      }

      if (error) {
        console.error("Hotel save error:", error);
        setErrorMessage("Failed to save hotel data. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Hotel saved successfully, redirecting to dashboard");
      router.push("/dashboard");
    } catch (error) {
      console.error("Unexpected error in handleSubmit:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isEditing ? "Update Hotel Details" : "Setup Your Hotel"}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? "Update your hotel information and services"
                : "Let's get your hotel management system ready"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {errorMessage && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {errorMessage}
              </div>
            )}

            {/* Logo Section */}
            <div className="space-y-4">
              <Label htmlFor="logo">Hotel Logo</Label>
              {logoUrl && (
                <div className="flex justify-center">
                  <img
                    src={logoUrl}
                    alt="Hotel Logo"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>

            {/* Hotel Name */}
            <div className="space-y-2">
              <Label htmlFor="hotelName">Hotel Name *</Label>
              <Input
                id="hotelName"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="Enter your hotel name"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter hotel address"
              />
            </div>

            {/* Services */}
            <div className="space-y-4">
              <Label>Services Offered</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableServices.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={services.includes(service)}
                      onCheckedChange={() => toggleService(service)}
                      disabled={service === "Rooms"} // Always keep Rooms checked
                    />
                    <Label 
                      htmlFor={service}
                      className={service === "Rooms" ? "text-gray-500" : "cursor-pointer"}
                    >
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                * Rooms service is required and cannot be removed
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !hotelName.trim()}
              className="w-full"
              size="lg"
            >
              {loading 
                ? "Saving..." 
                : isEditing 
                  ? "Update Hotel" 
                  : "Create Hotel & Continue to Dashboard"
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}