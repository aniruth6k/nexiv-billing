"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, User, Phone, Mail, MapPin, CreditCard, Calendar, 
  DollarSign, Clock, TrendingUp, BarChart3 
} from "lucide-react";
import AttendanceCalendar from "./AttendanceCalendar";

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
  attendance: Array<{
    date: string;
    status: 'present' | 'absent' | 'late' | 'half_day';
  }>;
  status: string;
  created_at: string;
  additional_info?: {
    age?: number;
    place?: string;
    identification?: string;
  };
}

interface StaffDetailsPanelProps {
  staff: Staff;
  onClose: () => void;
}

export default function StaffDetailsPanel({ staff, onClose }: StaffDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState("details");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAttendanceStats = () => {
    const total = staff.attendance.length;
    const present = staff.attendance.filter(a => a.status === 'present').length;
    const absent = staff.attendance.filter(a => a.status === 'absent').length;
    const late = staff.attendance.filter(a => a.status === 'late').length;
    const halfDay = staff.attendance.filter(a => a.status === 'half_day').length;
    
    const presentRate = total > 0 ? Math.round((present / total) * 100) : 0;
    const punctualityRate = total > 0 ? Math.round(((present + halfDay) / total) * 100) : 0;
    
    return { total, present, absent, late, halfDay, presentRate, punctualityRate };
  };

  const getRecentAttendance = () => {
    return staff.attendance
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  };

  const stats = getAttendanceStats();
  const recentAttendance = getRecentAttendance();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{staff.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-sm">
                  {staff.role}
                </Badge>
                <Badge 
                  variant={staff.status === 'active' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {staff.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Personal Details</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            {/* Personal Details Tab */}
            <TabsContent value="details" className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-blue-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Age</div>
                        <div className="font-medium">
                          {staff.age || staff.additional_info?.age || 'Not specified'} years
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Address</div>
                        <div className="font-medium">
                          {staff.place || staff.additional_info?.place || 'Not specified'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Joining Date</div>
                        <div className="font-medium">
                          {staff.joining_date ? formatDate(staff.joining_date) : 'Not specified'}
                        </div>
                      </div>
                    </div>

                    {staff.salary && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-sm text-gray-600">Monthly Salary</div>
                          <div className="font-medium">₹{staff.salary.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Phone className="w-5 h-5 text-green-600" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-medium">
                          {staff.contact || 'Not specified'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">
                          {staff.email || 'Not specified'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Emergency Contact</div>
                        <div className="font-medium">
                          {staff.emergency_contact || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ID Verification */}
              {(staff.id_type || staff.id_number) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      ID Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CreditCard className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-sm text-gray-600">ID Type</div>
                          <div className="font-medium">{staff.id_type}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CreditCard className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-sm text-gray-600">ID Number</div>
                          <div className="font-medium font-mono">
                            {staff.id_number?.replace(/(.{4})/g, '$1 ') || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {staff.id_verification_notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Additional Notes</div>
                        <div className="text-sm">{staff.id_verification_notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="mt-6">
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                      <div className="text-sm text-gray-600">Present</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                      <div className="text-sm text-gray-600">Absent</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                      <div className="text-sm text-gray-600">Late</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.halfDay}</div>
                      <div className="text-sm text-gray-600">Half Day</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Attendance Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AttendanceCalendar attendance={staff.attendance} />
                  </CardContent>
                </Card>

                {/* Recent Attendance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Attendance (Last 7 days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentAttendance.length > 0 ? (
                      <div className="space-y-2">
                        {recentAttendance.map((record, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="font-medium">
                              {formatDate(record.date)}
                            </div>
                            <Badge 
                              className={
                                record.status === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                record.status === 'late' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                record.status === 'half_day' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : 
                                'bg-red-100 text-red-800 hover:bg-red-100'
                              }
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {record.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No attendance records found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Attendance Rate</div>
                          <div className="text-2xl font-bold text-green-600">{stats.presentRate}%</div>
                        </div>
                        <div className="w-16 h-16 relative">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-300"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-green-600"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${stats.presentRate}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Punctuality Rate</div>
                          <div className="text-2xl font-bold text-blue-600">{stats.punctualityRate}%</div>
                        </div>
                        <div className="w-16 h-16 relative">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-300"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-blue-600"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${stats.punctualityRate}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">Total Working Days</div>
                        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Attendance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'Present', value: stats.present, color: 'bg-green-500', textColor: 'text-green-600' },
                        { label: 'Absent', value: stats.absent, color: 'bg-red-500', textColor: 'text-red-600' },
                        { label: 'Late', value: stats.late, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                        { label: 'Half Day', value: stats.halfDay, color: 'bg-orange-500', textColor: 'text-orange-600' }
                      ].map((item, index) => {
                        const percentage = stats.total > 0 ? (item.value / stats.total) * 100 : 0;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${item.color} h-2 rounded-full transition-all duration-500`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-bold ${item.textColor} w-8 text-right`}>
                                {item.value}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <div className="text-xs text-gray-500 mb-2">Employment Duration</div>
                      <div className="font-semibold text-gray-900">
                        {staff.joining_date 
                          ? `${Math.floor((new Date().getTime() - new Date(staff.joining_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`
                          : 'Not specified'
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}