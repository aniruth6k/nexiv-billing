// src/components/layout/Sidebar.tsx
"use client";

import { Home, Users, CreditCard, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/staff", label: "Staff", icon: Users },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isActiveLink = (href: string) => pathname === href;

  return (
    <TooltipProvider>
      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r shadow-sm z-10 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "flex items-center border-b transition-all duration-300",
            collapsed ? "px-2 py-4 justify-center" : "px-6 py-4"
          )}>
            {collapsed ? (
              <div className="text-xl font-bold text-blue-600">N</div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">Nexiv</h1>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6">
            <div className="space-y-2">
              {links.map(({ href, label, icon: Icon }) => {
                const linkContent = (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
                      isActiveLink(href)
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={href}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </div>
          </nav>

          {/* Toggle Button */}
          <div className={cn(
            "p-2 border-t",
            collapsed ? "flex justify-center" : "flex justify-end"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Footer */}
          {!collapsed && (
            <div className="p-4 border-t">
              <div className="text-xs text-gray-500 text-center">
                Hotel Management System
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}