"use client";

import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  return (
    <header className="flex justify-between items-center border-b bg-white px-6 py-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="flex items-center gap-4">
        <Bell className="w-5 h-5 text-gray-500" />
        <Avatar>
          <AvatarImage src="/avatar.png" alt="User" />
          <AvatarFallback>AN</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
