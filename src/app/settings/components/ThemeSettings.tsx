// src/app/settings/components/ThemeSettings.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, CircleDollarSign, Clock, Globe } from "lucide-react";

export default function ThemeSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          System Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-500" />
            Theme
          </p>
          <Button variant="outline" className="w-full" disabled>
            Light Mode (Coming Soon)
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-gray-500" />
            Currency
          </p>
          <Button variant="outline" className="w-full" disabled>
            INR ₹ (Coming Soon)
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Time Zone
          </p>
          <Button variant="outline" className="w-full" disabled>
            IST (Coming Soon)
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            Language
          </p>
          <Button variant="outline" className="w-full" disabled>
            English (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}