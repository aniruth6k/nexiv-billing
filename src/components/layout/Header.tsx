// src/components/layout/Header.tsx
"use client";

import { LogOut, User, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  hotel?: {
    id: string;
    name: string;
    logo_url?: string;
    owner_id?: string;
  };
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ hotel, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Find logo file for this hotel using owner_id
  useEffect(() => {
    const findLogo = async () => {
      if (!hotel?.id) return;

      try {
        console.log("Looking for logo for hotel:", hotel.id, "owner:", hotel.owner_id);

        let ownerId = hotel.owner_id;
        if (!ownerId) {
          const { data: hotelData } = await supabase
            .from("hotels")
            .select("owner_id")
            .eq("id", hotel.id)
            .single();
          ownerId = hotelData?.owner_id;
        }

        if (!ownerId) {
          console.log("No owner ID found for hotel");
          return;
        }

        console.log("Using owner ID:", ownerId);

        const { data: files, error } = await supabase.storage
          .from("hotel-logos")
          .list(ownerId, { limit: 10 });

        if (error) {
          console.error("Storage list error:", error);
          return;
        }

        console.log("Files in owner folder:", files);

        if (files && files.length > 0) {
          const imageFile = files.find(
            (f) =>
              f.name.includes(".png") ||
              f.name.includes(".jpg") ||
              f.name.includes(".jpeg")
          );

          if (imageFile) {
            const fullPath = `${ownerId}/${imageFile.name}`;
            console.log("✅ Found logo at:", fullPath);

            const { data } = supabase.storage
              .from("hotel-logos")
              .getPublicUrl(fullPath);

            console.log("Generated URL:", data.publicUrl);
            setLogoUrl(data.publicUrl);

            await supabase
              .from("hotels")
              .update({ logo_url: data.publicUrl })
              .eq("id", hotel.id);

            console.log("✅ Updated hotel logo URL in database");
          } else {
            console.log("❌ No image files found in owner folder");
          }
        } else {
          console.log("❌ No files found in owner folder");
        }
      } catch (error) {
        console.error("Error finding logo:", error);
      }
    };

    findLogo();
  }, [hotel?.id, hotel?.owner_id || ""]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/hotel/auth");
  };

  return (
    <header className="flex justify-between items-center bg-white border-b px-6 py-3 shadow-sm min-h-[64px]">
      {/* Left side - Hotel Info */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button - only show on mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-8 w-8 p-0"
          onClick={onToggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Hotel Info */}
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Hotel Logo"
              className="w-8 h-8 object-cover rounded-md border"
              onError={() => setLogoUrl(null)}
            />
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {hotel?.name || "Hotel Management"}
            </h2>
          </div>
        </div>
      </div>

      {/* Right side - User Menu */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/avatar.png" alt="User" />
                <AvatarFallback className="bg-blue-500 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  Hotel Administrator
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}