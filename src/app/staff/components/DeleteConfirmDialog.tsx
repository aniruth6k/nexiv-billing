"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmDialogProps {
  staffName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function DeleteConfirmDialog({ 
  staffName, 
  onConfirm, 
  onCancel, 
  loading 
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              Confirm Deletion
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-gray-700">
            Are you sure you want to delete <strong>{staffName}</strong>? 
          </div>
          
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. All attendance records 
              and staff information will be permanently deleted.
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Deleting..." : "Delete Staff"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}