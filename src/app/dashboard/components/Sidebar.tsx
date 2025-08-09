"use client";

import { Home, Users, CreditCard, Settings } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/staff", label: "Staff", icon: Users },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-8">Nexiv</h1>
      <nav className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
