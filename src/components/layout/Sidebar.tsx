// src/components/layout/Sidebar.tsx
"use client";

import { Home, Users, CreditCard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/staff", label: "Staff", icon: Users },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isActiveLink = (href: string) => pathname === href;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r shadow-sm z-10">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Nexiv</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActiveLink(href)
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="text-xs text-gray-500 text-center">
            Hotel Management System
          </div>
        </div>
      </div>
    </aside>
  );
}