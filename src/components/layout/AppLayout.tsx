// src/components/layout/AppLayout.tsx
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
  hotel?: {
    id: string;
    name: string;
    logo_url?: string;
    address?: string;
  };
}

export default function AppLayout({ children, hotel }: AppLayoutProps) {
  const pathname = usePathname();

  // Check if we're on auth or setup pages (no sidebar needed)
  const isAuthPage = pathname?.includes('/auth') || pathname?.includes('/setup') || pathname === '/hotel';
  
  if (isAuthPage) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 ml-64">
        {/* Header */}
        <Header hotel={hotel} />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}