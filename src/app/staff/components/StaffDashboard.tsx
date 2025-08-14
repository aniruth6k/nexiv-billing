"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Calendar, BarChart3, TrendingUp, Clock } from "lucide-react";
import AddStaffForm from "./AddStaffForm";
import AttendanceGrid from "./AttendanceGrid";

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

interface StaffWithTodayStatus extends Staff {
  todayStatus?: 'present' | 'absent' | 'late' | 'half_day';
  periodRecords: AttendanceRecord[];
}

interface StaffWithAttendanceRate extends Staff {
  attendanceRate: number;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
  notMarked?: number;
  averageAttendance?: number;
}

interface AttendanceTrendDay {
  date: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
}

interface StaffDashboardProps {
  staff: Staff[];
  hotelId: string;
}

type PeriodType = 'today' | 'week' | 'month';

export default function StaffDashboard({ staff, hotelId }: StaffDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');

  const getAttendanceStats = (period: PeriodType = 'today'): AttendanceStats => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.toISOString().split('T')[0]);
    }

    const endDate = period === 'today' ? startDate : now;

    const periodAttendance = staff.map(member => {
      const relevantRecords = member.attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });

      if (period === 'today') {
        const todayRecord = relevantRecords.find(r => r.date === now.toISOString().split('T')[0]);
        return {
          ...member,
          todayStatus: todayRecord?.status,
          periodRecords: relevantRecords
        } as StaffWithTodayStatus;
      }

      return {
        ...member,
        periodRecords: relevantRecords
      } as StaffWithTodayStatus;
    });

    if (period === 'today') {
      const present = periodAttendance.filter(s => s.todayStatus === 'present').length;
      const absent = periodAttendance.filter(s => s.todayStatus === 'absent').length;
      const late = periodAttendance.filter(s => s.todayStatus === 'late').length;
      const halfDay = periodAttendance.filter(s => s.todayStatus === 'half_day').length;
      const notMarked = staff.length - present - absent - late - halfDay;

      return { present, absent, late, halfDay, notMarked, total: staff.length };
    } else {
      // For weekly/monthly stats, calculate averages and totals
      let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalHalfDay = 0, totalRecords = 0;

      periodAttendance.forEach(member => {
        const records = member.periodRecords;
        totalPresent += records.filter(r => r.status === 'present').length;
        totalAbsent += records.filter(r => r.status === 'absent').length;
        totalLate += records.filter(r => r.status === 'late').length;
        totalHalfDay += records.filter(r => r.status === 'half_day').length;
        totalRecords += records.length;
      });

      return {
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        halfDay: totalHalfDay,
        total: totalRecords,
        averageAttendance: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0
      };
    }
  };

  const getTopPerformers = (): StaffWithAttendanceRate[] => {
    return staff
      .map(member => {
        const totalDays = member.attendance.length;
        const presentDays = member.attendance.filter(a => a.status === 'present').length;
        const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        return { ...member, attendanceRate: rate };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);
  };

  const getAttendanceTrend = (): AttendanceTrendDay[] => {
    const last7Days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      
      const dayAttendance = staff.reduce((acc, member) => {
        const record = member.attendance.find(a => a.date === dateString);
        if (record?.status === 'present') acc.present++;
        else if (record?.status === 'absent') acc.absent++;
        else if (record?.status === 'late') acc.late++;
        else if (record?.status === 'half_day') acc.halfDay++;
        return acc;
      }, { present: 0, absent: 0, late: 0, halfDay: 0 });

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        ...dayAttendance,
        total: staff.length
      });
    }
    
    return last7Days;
  };

  const stats = getAttendanceStats(selectedPeriod);
  const topPerformers = getTopPerformers();
  const attendanceTrend = getAttendanceTrend();

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'Today';
    }
  };

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as PeriodType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
        <p className="text-gray-600 mt-1">Manage your hotel staff and attendance</p>
      </div>

      {/* Staff Management Tabs */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="add-staff" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Staff
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-6 space-y-6">
          {/* Enhanced Attendance Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Attendance Summary
                </CardTitle>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-500">
                    {selectedPeriod === 'today' ? 'Total Staff' : 'Total Records'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  <div className="text-sm text-gray-500">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.absent || 0}</div>
                  <div className="text-sm text-gray-500">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                  <div className="text-sm text-gray-500">Late</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.halfDay}</div>
                  <div className="text-sm text-gray-500">Half Day</div>
                </div>
                {selectedPeriod !== 'today' && stats.averageAttendance !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.averageAttendance}%</div>
                    <div className="text-sm text-gray-500">Avg Rate</div>
                  </div>
                )}
                {selectedPeriod === 'today' && stats.notMarked !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{stats.notMarked}</div>
                    <div className="text-sm text-gray-500">Not Marked</div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {getPeriodLabel()} - {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Attendance</CardTitle>
              {staff.length > 0 && (
                <p className="text-sm text-gray-500">
                  Manage daily attendance for {staff.length} team member{staff.length !== 1 ? 's' : ''}. 
                  Click on any staff member to view detailed information and attendance history.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <AttendanceGrid staff={staff} hotelId={hotelId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Staff Tab */}
        <TabsContent value="add-staff" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New Staff Member
              </CardTitle>
              <p className="text-sm text-gray-600">
                Fill in the details to add a new team member to your hotel
              </p>
            </CardHeader>
            <CardContent>
              <AddStaffForm hotelId={hotelId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* Top Performers */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.length > 0 ? topPerformers.map((member, index) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            member.attendanceRate >= 90 ? 'text-green-600' : 
                            member.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {member.attendanceRate}%
                          </div>
                          <div className="text-xs text-gray-500">Attendance</div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        No staff members yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Staff by Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(new Set(staff.map(s => s.role))).map(role => {
                      const count = staff.filter(s => s.role === role).length;
                      const percentage = staff.length > 0 ? (count / staff.length) * 100 : 0;
                      
                      return (
                        <div key={role} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">{role}</div>
                            <div className="text-xs text-gray-500">({count})</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 w-10 text-right">
                              {percentage.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  7-Day Attendance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {attendanceTrend.map((day, index) => {
                      const presentRate = day.total > 0 ? (day.present / day.total) * 100 : 0;
                      return (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-600 mb-2">{day.date}</div>
                          <div className="h-20 bg-gray-100 rounded-lg flex flex-col justify-end overflow-hidden">
                            <div 
                              className="bg-green-500 rounded-b-lg transition-all duration-500" 
                              style={{ height: `${presentRate}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 mt-2">
                            {day.present}/{day.total}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-xs text-gray-500">
                    Green bars show present staff ratio for each day
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Additions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Additions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staff
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map(member => (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {new Date(member.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {Math.floor((new Date().getTime() - new Date(member.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </div>
                        </div>
                      </div>
                    ))}
                  {staff.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No staff members added yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}