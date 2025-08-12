// src/app/settings/components/ProfileSettings.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Building, Upload, X, Camera } from "lucide-react";

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setLogoUrl(data.logo_url || null);
    } catch (error) {
      console.error("Error fetching hotel info:", error);
      toast.error("Failed to load hotel information.");
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file.");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${hotelId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old logo if exists
      if (hotel?.logo_url) {
        try {
          // Extract filename from full URL if it's a storage URL
          let oldFileName = hotel.logo_url;
          if (hotel.logo_url.includes('/hotel-logos/')) {
            oldFileName = hotel.logo_url.split('/hotel-logos/').pop() || hotel.logo_url;
          }
          // Remove old file from storage
          await supabase.storage.from('hotel-logos').remove([oldFileName]);
        } catch (error) {
          console.log('Old logo file not found in storage, continuing with upload');
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('hotel-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hotel-logos')
        .getPublicUrl(filePath);

      // Update hotel record with full public URL
      const { error: updateError } = await supabase
        .from('hotels')
        .update({ logo_url: publicUrl })
        .eq('id', hotelId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast.success("Logo uploaded successfully!");
      
      // Refresh hotel data to ensure consistency
      fetchHotelInfo();
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setIsUploadingLogo(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl || !hotel?.logo_url) return;

    setIsUploadingLogo(true);

    try {
      // Extract filename from URL for storage deletion
      if (hotel.logo_url.includes('/hotel-logos/')) {
        const fileName = hotel.logo_url.split('/hotel-logos/').pop();
        if (fileName) {
          await supabase.storage.from('hotel-logos').remove([fileName]);
        }
      }

      // Update hotel record to remove logo URL
      const { error } = await supabase
        .from('hotels')
        .update({ logo_url: null })
        .eq('id', hotelId);

      if (error) throw error;

      setLogoUrl(null);
      toast.success("Logo removed successfully!");
      
      // Refresh hotel data to ensure consistency
      fetchHotelInfo();
    } catch (error) {
      console.error("Error removing logo:", error);
      toast.error("Failed to remove logo. Please try again.");
    } finally {
      setIsUploadingLogo(false);
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Hotel Logo
            </label>
            
            <div className="flex items-start gap-4">
              {/* Logo Display */}
              <div className="flex-shrink-0">
                {logoUrl ? (
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
                      <img
                        src={logoUrl}
                        alt="Hotel logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleRemoveLogo}
                      disabled={isUploadingLogo}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Building className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingLogo ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                </Button>
                <p className="text-xs text-gray-500">
                  Recommended: Square image, max 5MB (JPG, PNG, GIF)
                </p>
              </div>
            </div>
          </div>

          {/* Hotel Information */}
          <div className="space-y-4">
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
          </div>

          <Button type="submit" disabled={isSubmitting || isUploadingLogo} className="w-full">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}