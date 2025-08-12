"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

interface AttendanceCalendarProps {
  attendance: AttendanceRecord[];
}

export default function AttendanceCalendar({ attendance }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getAttendanceForDate = (date: string) => {
    return attendance.find(record => record.date === date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'late': return 'bg-yellow-500';
      case 'half_day': return 'bg-orange-500';
      default: return 'bg-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'P';
      case 'absent': return 'A';
      case 'late': return 'L';
      case 'half_day': return 'H';
      default: return '';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getMonthlyStats = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthlyAttendance = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    });

    const present = monthlyAttendance.filter(r => r.status === 'present').length;
    const absent = monthlyAttendance.filter(r => r.status === 'absent').length;
    const late = monthlyAttendance.filter(r => r.status === 'late').length;
    const halfDay = monthlyAttendance.filter(r => r.status === 'half_day').length;
    const total = monthlyAttendance.length;

    return { present, absent, late, halfDay, total };
  };

  const monthlyStats = getMonthlyStats();

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{monthlyStats.present}</div>
          <div className="text-xs text-gray-600">Present</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{monthlyStats.absent}</div>
          <div className="text-xs text-gray-600">Absent</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-600">{monthlyStats.late}</div>
          <div className="text-xs text-gray-600">Late</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">{monthlyStats.halfDay}</div>
          <div className="text-xs text-gray-600">Half Day</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-12 border-r border-b last:border-r-0"></div>;
            }

            const dateString = formatDate(day);
            const attendanceRecord = getAttendanceForDate(dateString);
            const isToday = dateString === new Date().toISOString().split('T')[0];
            const isPast = new Date(dateString) < new Date(new Date().toISOString().split('T')[0]);

            return (
              <div
                key={day}
                className={`h-12 border-r border-b last:border-r-0 flex items-center justify-center relative ${
                  isToday ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                  {day}
                </span>
                
                {attendanceRecord && (
                  <div className={`absolute top-1 right-1 w-4 h-4 rounded-full text-xs text-white flex items-center justify-center font-bold ${getStatusColor(attendanceRecord.status)}`}>
                    {getStatusText(attendanceRecord.status)}
                  </div>
                )}
                
                {isPast && !attendanceRecord && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-300 text-xs text-white flex items-center justify-center font-bold">
                    ?
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Present (P)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Absent (A)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Late (L)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Half Day (H)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span>No Record (?)</span>
        </div>
      </div>
    </div>
  );
}