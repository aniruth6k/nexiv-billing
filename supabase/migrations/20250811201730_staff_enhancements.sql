-- Migration: Complete Staff Management Enhancements
-- File: 20250812120000_staff_enhancements.sql
-- Created: 2025-08-12
-- Description: Adds missing staff columns, performance indexes, and attendance optimization

-- Add missing columns to staff table that are used in the components
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS place TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_verification_notes TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary NUMERIC;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add computed column for quick attendance rate calculation
ALTER TABLE staff ADD COLUMN IF NOT EXISTS attendance_rate INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staff_hotel_id ON staff(hotel_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_created_at ON staff(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_joining_date ON staff(joining_date);

-- Add a GIN index for attendance array queries (for faster attendance lookups)
CREATE INDEX IF NOT EXISTS idx_staff_attendance_gin ON staff USING GIN (attendance);

-- Create a function to calculate attendance rate from attendance array
CREATE OR REPLACE FUNCTION calculate_attendance_rate(attendance_data JSONB)
RETURNS INTEGER AS $$
BEGIN
    -- Return 0 if no attendance data
    IF attendance_data IS NULL OR jsonb_array_length(attendance_data) = 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate attendance rate
    RETURN ROUND(
        (
            SELECT COUNT(*)::FLOAT / jsonb_array_length(attendance_data) * 100
            FROM jsonb_array_elements(attendance_data) AS elem
            WHERE elem->>'status' = 'present'
        )::INTEGER
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to update attendance rate when attendance is modified
CREATE OR REPLACE FUNCTION update_staff_attendance_rate()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and update attendance rate
    NEW.attendance_rate := calculate_attendance_rate(NEW.attendance);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update attendance rate on attendance changes
DROP TRIGGER IF EXISTS trigger_update_attendance_rate ON staff;
CREATE TRIGGER trigger_update_attendance_rate
    BEFORE INSERT OR UPDATE OF attendance ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_attendance_rate();

-- Update existing records with calculated attendance rate
UPDATE staff 
SET attendance_rate = calculate_attendance_rate(attendance)
WHERE attendance_rate = 0 OR attendance_rate IS NULL;

-- Create a view for easy attendance statistics and reporting
CREATE OR REPLACE VIEW staff_attendance_stats AS
SELECT 
    s.id,
    s.name,
    s.role,
    s.hotel_id,
    s.status,
    s.attendance_rate,
    s.joining_date,
    s.created_at,
    COALESCE(jsonb_array_length(s.attendance), 0) as total_days,
    
    -- Count different attendance statuses
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(s.attendance) AS elem
        WHERE elem->>'status' = 'present'
    ) as present_days,
    
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(s.attendance) AS elem
        WHERE elem->>'status' = 'absent'
    ) as absent_days,
    
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(s.attendance) AS elem
        WHERE elem->>'status' = 'late'
    ) as late_days,
    
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(s.attendance) AS elem
        WHERE elem->>'status' = 'half_day'
    ) as half_days,
    
    -- Get today's attendance status
    (
        SELECT elem->>'status'
        FROM jsonb_array_elements(s.attendance) AS elem
        WHERE elem->>'date' = CURRENT_DATE::text
        LIMIT 1
    ) as today_status,
    
    -- Get this week's attendance count
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(s.attendance) AS elem
        WHERE elem->>'status' = 'present'
        AND (elem->>'date')::date >= CURRENT_DATE - INTERVAL '7 days'
    ) as week_present_days,
    
    -- Get this month's attendance count
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(s.attendance) AS elem
        WHERE elem->>'status' = 'present'
        AND (elem->>'date')::date >= date_trunc('month', CURRENT_DATE)::date
    ) as month_present_days

FROM staff s
WHERE s.status IS NULL OR s.status = 'active';

-- Create helper function for attendance queries by date range
CREATE OR REPLACE FUNCTION get_staff_attendance_by_period(
    staff_id UUID,
    period_start DATE,
    period_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    attendance_date DATE,
    attendance_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (elem->>'date')::date as attendance_date,
        elem->>'status' as attendance_status
    FROM staff s,
         jsonb_array_elements(s.attendance) AS elem
    WHERE s.id = staff_id
    AND (elem->>'date')::date >= period_start
    AND (elem->>'date')::date <= period_end
    ORDER BY (elem->>'date')::date DESC;
END;
$$ LANGUAGE plpgsql;

-- Update any existing staff records to have active status if null
UPDATE staff SET status = 'active' WHERE status IS NULL;

-- Add helpful comments for documentation
COMMENT ON COLUMN staff.email IS 'Staff member email address';
COMMENT ON COLUMN staff.age IS 'Staff member age in years';
COMMENT ON COLUMN staff.place IS 'Staff member address/location';
COMMENT ON COLUMN staff.id_type IS 'Type of identification document (Aadhaar, PAN, etc.)';
COMMENT ON COLUMN staff.id_number IS 'Identification document number';
COMMENT ON COLUMN staff.id_verification_notes IS 'Additional notes for ID verification';
COMMENT ON COLUMN staff.salary IS 'Monthly salary amount';
COMMENT ON COLUMN staff.joining_date IS 'Date when staff member joined';
COMMENT ON COLUMN staff.emergency_contact IS 'Emergency contact phone number';
COMMENT ON COLUMN staff.status IS 'Staff status (active, inactive, terminated)';
COMMENT ON COLUMN staff.attendance IS 'Array of attendance records with date and status';
COMMENT ON COLUMN staff.attendance_rate IS 'Calculated attendance rate percentage (auto-updated)';
COMMENT ON COLUMN staff.additional_info IS 'Additional staff information stored as JSONB';

COMMENT ON VIEW staff_attendance_stats IS 'Pre-calculated attendance statistics for better performance and reporting';
COMMENT ON FUNCTION calculate_attendance_rate(JSONB) IS 'Calculates attendance rate percentage from attendance array';
COMMENT ON FUNCTION get_staff_attendance_by_period(UUID, DATE, DATE) IS 'Returns attendance records for a staff member within date range';

-- Create a function to get attendance summary for a hotel
CREATE OR REPLACE FUNCTION get_hotel_attendance_summary(
    hotel_uuid UUID,
    summary_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_staff BIGINT,
    present_today BIGINT,
    absent_today BIGINT,
    late_today BIGINT,
    half_day_today BIGINT,
    not_marked_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_staff,
        COUNT(*) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements(s.attendance) AS elem
                WHERE elem->>'date' = summary_date::text 
                AND elem->>'status' = 'present'
            )
        ) as present_today,
        COUNT(*) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements(s.attendance) AS elem
                WHERE elem->>'date' = summary_date::text 
                AND elem->>'status' = 'absent'
            )
        ) as absent_today,
        COUNT(*) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements(s.attendance) AS elem
                WHERE elem->>'date' = summary_date::text 
                AND elem->>'status' = 'late'
            )
        ) as late_today,
        COUNT(*) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements(s.attendance) AS elem
                WHERE elem->>'date' = summary_date::text 
                AND elem->>'status' = 'half_day'
            )
        ) as half_day_today,
        COUNT(*) FILTER (
            WHERE NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements(s.attendance) AS elem
                WHERE elem->>'date' = summary_date::text
            )
        ) as not_marked_today
    FROM staff s
    WHERE s.hotel_id = hotel_uuid 
    AND (s.status IS NULL OR s.status = 'active');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_hotel_attendance_summary(UUID, DATE) IS 'Returns attendance summary for all staff in a hotel for a specific date';