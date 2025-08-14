"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, MapPin, Phone, Users2, Clock, Trash2, Eye } from "lucide-react";
import StaffDetailsPanel from "./StaffDetailsPanel";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

interface AdditionalInfo {
  age?: number;
  place?: string;
  identification?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  contact?: string;
  email?: string;
  age?: number;
  place?: string;
  id_type?: string;
  id_number?: string;
  id_verification_notes?: string;
  salary?: number;
  joining_date?: string;
  emergency_contact?: string;
  attendance: AttendanceRecord[];
  status: string;
  created_at: string;
  additional_info?: AdditionalInfo;
}

interface AttendanceGridProps {
  staff: Staff[];
  hotelId: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';

export default function AttendanceGrid({ staff }: AttendanceGridProps) {
  const router = useRouter();
  const [attendanceLoading, setAttendanceLoading] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const markAttendance = async (staffId: string, status: AttendanceStatus) => {
    setAttendanceLoading(staffId);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current staff data
      const { data: currentStaff, error: fetchError } = await supabase
        .from("staff")
        .select("attendance")
        .eq("id", staffId)
        .single();

      if (fetchError) {
        console.error("Error fetching staff:", fetchError);
        return;
      }

      const currentAttendance = Array.isArray(currentStaff.attendance) ? currentStaff.attendance : [];
      
      // Remove any existing attendance for today
      const filteredAttendance = currentAttendance.filter((a: AttendanceRecord) => a.date !== today);
      
      // Add new attendance record
      const updatedAttendance = [...filteredAttendance, { date: today, status }];

      const { error } = await supabase
        .from("staff")
        .update({ attendance: updatedAttendance })
        .eq("id", staffId);

      if (error) {
        console.error("Error updating attendance:", error);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setAttendanceLoading(null);
    }
  };

  const markBulkAttendance = async (status: 'present' | 'absent') => {
    if (selectedStaff.length === 0) return;

    const promises = selectedStaff.map(staffId => markAttendance(staffId, status));
    await Promise.all(promises);
    setSelectedStaff([]);
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", staffToDelete.id);

      if (error) {
        console.error("Error deleting staff:", error);
        return;
      }

      router.refresh();
      setStaffToDelete(null);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTodayAttendance = (attendance: AttendanceRecord[]) => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.date === today);
  };

  const getAttendanceRate = (attendance: AttendanceRecord[]) => {
    const totalDays = attendance.length;
    if (totalDays === 0) return 0;
    
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const halfDays = attendance.filter(a => a.status === 'half_day').length;
    
    const effectiveDays = presentDays + (lateDays * 0.8) + (halfDays * 0.5);
    return Math.round((effectiveDays / totalDays) * 100);
  };

  if (staff.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users2 className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No staff members yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">Add your first staff member to start tracking attendance and managing your team effectively.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Bulk Actions */}
        {selectedStaff.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{selectedStaff.length}</span>
                  </div>
                  <span className="text-sm font-medium text-blue-900">
                    {selectedStaff.length} staff member{selectedStaff.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => markBulkAttendance('present')}
                    className="bg-green-600 hover:bg-green-700 h-9"
                  >
                    Mark Present
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => markBulkAttendance('absent')}
                    className="h-9"
                  >
                    Mark Absent
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedStaff([])}
                    className="h-9"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff Grid */}
        <div className="space-y-3">
          {staff.map((member) => {
            const todayAttendance = getTodayAttendance(member.attendance);
            const attendanceRate = getAttendanceRate(member.attendance);
            const isSelected = selectedStaff.includes(member.id);
            
            return (
              <Card key={member.id} className={`transition-all hover:shadow-md ${isSelected ? "ring-2 ring-blue-500 border-blue-200" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    {/* Left section - Staff Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStaff([...selectedStaff, member.id]);
                          } else {
                            setSelectedStaff(selectedStaff.filter(id => id !== member.id));
                          }
                        }}
                        className="h-5 w-5"
                      />
                      
                      <div 
                        className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => setSelectedStaffForDetails(member)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">{member.name}</h3>
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {member.role}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          {(member.age || member.additional_info?.age) && (
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="w-4 h-4" />
                              {member.age || member.additional_info?.age} years
                            </span>
                          )}
                          {member.contact && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-4 h-4" />
                              {member.contact}
                            </span>
                          )}
                          {(member.place || member.additional_info?.place) && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {member.place || member.additional_info?.place}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center section - Attendance Rate */}
                    <div className="text-center px-4">
                      <div className="text-xs text-gray-500 mb-1">Attendance Rate</div>
                      <div className={`text-xl font-bold ${
                        attendanceRate >= 90 ? 'text-green-600' : 
                        attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {attendanceRate}%
                      </div>
                    </div>

                    {/* Right section - Actions */}
                    <div className="flex items-center gap-3">
                      {todayAttendance ? (
                        <Badge 
                          className={`px-3 py-1 text-sm font-medium ${
                            todayAttendance.status === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                            todayAttendance.status === 'late' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                            todayAttendance.status === 'half_day' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : 
                            'bg-red-100 text-red-800 hover:bg-red-100'
                          }`}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {todayAttendance.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ) : (
                        <Select
                          onValueChange={(value) => markAttendance(member.id, value as AttendanceStatus)}
                          disabled={attendanceLoading === member.id}
                        >
                          <SelectTrigger className="w-36 h-10">
                            <SelectValue placeholder="Mark Today" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">
                              <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Present
                              </span>
                            </SelectItem>
                            <SelectItem value="absent">
                              <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Absent
                              </span>
                            </SelectItem>
                            <SelectItem value="late">
                              <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                Late
                              </span>
                            </SelectItem>
                            <SelectItem value="half_day">
                              <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                Half Day
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStaffForDetails(member)}
                          className="h-10 w-10 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setStaffToDelete(member)}
                          className="h-10 w-10 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Staff Details Panel */}
      {selectedStaffForDetails && (
        <StaffDetailsPanel
          staff={selectedStaffForDetails}
          onClose={() => setSelectedStaffForDetails(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {staffToDelete && (
        <DeleteConfirmDialog
          staffName={staffToDelete.name}
          onConfirm={handleDeleteStaff}
          onCancel={() => setStaffToDelete(null)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}