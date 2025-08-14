// src/app/settings/components/ProfileSettings.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Building, Camera, Lock } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  address?: string;
  logo_url?: string;
  contact_phone?: string;
  contact_email?: string;
  gst_number?: string;
}

interface ProfileSettingsProps {
  hotelId: string;
}

export default function ProfileSettings({ hotelId }: ProfileSettingsProps) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHotelInfo();
  }, []);

  const fetchHotelInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name, address, logo_url, contact_phone, contact_email, gst_number")
        .eq("id", hotelId)
        .single();

      if (error) throw error;

      setHotel(data);
      setName(data.name);
      setAddress(data.address || "");
      setContactPhone(data.contact_phone || "");
      setContactEmail(data.contact_email || "");
      setGstNumber(data.gst_number || "");
      setLogoUrl(data.logo_url || null);
    } catch (error) {
      console.error("Error fetching hotel info:", error);
      toast.error("Failed to load hotel information.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("hotels")
        .update({
          address,
          contact_phone: contactPhone,
          contact_email: contactEmail,
        })
        .eq("id", hotelId);

      if (error) throw error;

      toast.success("Hotel profile updated successfully.");
    } catch (error) {
      console.error("Error updating hotel profile:", error);
      toast.error("Failed to update hotel profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fixed Logo Display Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Hotel Logo
              <Lock className="w-3 h-3 text-gray-400" />
            </label>
            
            <div className="flex items-start gap-4">
              {/* Logo Display */}
              <div className="flex-shrink-0">
                {logoUrl ? (
                  <div className="w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                    <img
                      src={logoUrl}
                      alt="Hotel logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Building className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Fixed Logo Info */}
              <div className="flex-1 space-y-2">
              </div>
            </div>
          </div>

          {/* Hotel Information */}
          <div className="space-y-4">
            {/* Fixed Hotel Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                Hotel Name
                <Lock className="w-3 h-3 text-gray-400" />
              </label>
              <Input
                id="name"
                value={name}
                placeholder="Hotel name"
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Hotel name is fixed and cannot be modified
              </p>
            </div>

            {/* Fixed GST Number Display */}
            <div className="space-y-2">
              <label htmlFor="gstNumber" className="text-sm font-medium flex items-center gap-2">
                GST Number
                <Lock className="w-3 h-3 text-gray-400" />
              </label>
              <Input
                id="gstNumber"
                value={gstNumber || "Not provided"}
                placeholder="GST Number"
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                GST number is fixed and cannot be modified
              </p>
            </div>
            
            {/* Editable Address */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter hotel address"
              />
            </div>
            
            {/* Editable Contact Phone */}
            <div className="space-y-2">
              <label htmlFor="contactPhone" className="text-sm font-medium">
                Contact Phone
              </label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Enter contact phone"
              />
            </div>
            
            {/* Editable Contact Email */}
            <div className="space-y-2">
              <label htmlFor="contactEmail" className="text-sm font-medium">
                Contact Email
              </label>
              <Input
                id="contactEmail"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Enter contact email"
                type="email"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}