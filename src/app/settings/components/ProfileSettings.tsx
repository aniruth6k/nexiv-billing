// src/app/settings/components/ProfileSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Building } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  address?: string;
  logo_url?: string;
  contact_phone?: string;
  contact_email?: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHotelInfo();
  }, []);

  const fetchHotelInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name, address, logo_url, contact_phone, contact_email")
        .eq("id", hotelId)
        .single();

      if (error) throw error;

      setHotel(data);
      setName(data.name);
      setAddress(data.address || "");
      setContactPhone(data.contact_phone || "");
      setContactEmail(data.contact_email || "");
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
          name,
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <Building className="w-4 h-4" />
              Hotel Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter hotel name"
              required
            />
          </div>
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
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}