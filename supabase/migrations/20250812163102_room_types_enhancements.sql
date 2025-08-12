-- Migration: Room Types Management Enhancements
-- File: 20250812163102_room_types_enhancements.sql
-- Created: 2025-08-12
-- Description: Adds missing room_types columns for availability, sorting, and timestamps

-- Add missing columns to room_types table
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_room_types_hotel_id ON room_types(hotel_id);
CREATE INDEX IF NOT EXISTS idx_room_types_available ON room_types(available);
CREATE INDEX IF NOT EXISTS idx_room_types_sort_order ON room_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_room_types_created_at ON room_types(created_at);

-- Create indexes for rooms table
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_room_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on modifications
DROP TRIGGER IF EXISTS trigger_update_room_types_updated_at ON room_types;
CREATE TRIGGER trigger_update_room_types_updated_at
    BEFORE UPDATE ON room_types
    FOR EACH ROW
    EXECUTE FUNCTION update_room_types_updated_at();

-- Update existing room types to have proper sort order based on creation order
UPDATE room_types 
SET sort_order = subquery.row_num - 1
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY hotel_id ORDER BY created_at) as row_num
    FROM room_types
) as subquery
WHERE room_types.id = subquery.id
AND sort_order = 0;

-- Create a view for room types with room count information
-- Note: Using room type 'name' to match with rooms 'type' column
CREATE OR REPLACE VIEW room_types_with_stats AS
SELECT 
    rt.*,
    COALESCE(room_count.total_rooms, 0) as total_rooms
FROM room_types rt
LEFT JOIN (
    SELECT 
        r.type as room_type_name, 
        COUNT(*) as total_rooms
    FROM rooms r
    GROUP BY r.type
) room_count ON rt.name = room_count.room_type_name
WHERE rt.available = true
ORDER BY rt.sort_order, rt.created_at;

-- Create function to get room count by type for a hotel
CREATE OR REPLACE FUNCTION get_room_counts_by_type(hotel_uuid UUID)
RETURNS TABLE (
    room_type_name TEXT,
    total_rooms BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.type as room_type_name,
        COUNT(*) as total_rooms
    FROM rooms r
    WHERE r.hotel_id = hotel_uuid
    GROUP BY r.type
    ORDER BY r.type;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all room types with their room counts for a hotel
CREATE OR REPLACE FUNCTION get_hotel_room_types_with_counts(hotel_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    base_price NUMERIC,
    description TEXT,
    amenities JSONB,
    max_occupancy INTEGER,
    available BOOLEAN,
    sort_order INTEGER,
    total_rooms BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id,
        rt.name,
        rt.base_price,
        rt.description,
        rt.amenities,
        rt.max_occupancy,
        rt.available,
        rt.sort_order,
        COALESCE(room_counts.total_rooms, 0) as total_rooms,
        rt.created_at,
        rt.updated_at
    FROM room_types rt
    LEFT JOIN (
        SELECT 
            r.type as room_type_name,
            COUNT(*) as total_rooms
        FROM rooms r
        WHERE r.hotel_id = hotel_uuid
        GROUP BY r.type
    ) room_counts ON rt.name = room_counts.room_type_name
    WHERE rt.hotel_id = hotel_uuid
    ORDER BY rt.sort_order, rt.created_at;
END;
$$ LANGUAGE plpgsql;

-- Create function to reorder room types
CREATE OR REPLACE FUNCTION reorder_room_types(
    room_type_ids UUID[],
    hotel_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    i INTEGER;
BEGIN
    -- Update sort_order for each room type
    FOR i IN 1..array_length(room_type_ids, 1) LOOP
        UPDATE room_types 
        SET sort_order = i - 1,
            updated_at = NOW()
        WHERE id = room_type_ids[i] 
        AND hotel_id = hotel_uuid;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments for documentation
COMMENT ON COLUMN room_types.available IS 'Whether this room type is available for booking';
COMMENT ON COLUMN room_types.sort_order IS 'Display order for room types (0-based)';
COMMENT ON COLUMN room_types.updated_at IS 'Timestamp of last update (auto-managed)';
COMMENT ON COLUMN room_types.name IS 'Room type name (e.g., Standard, Deluxe, Suite)';
COMMENT ON COLUMN room_types.base_price IS 'Base price per night for this room type';
COMMENT ON COLUMN room_types.description IS 'Detailed description of room type features';
COMMENT ON COLUMN room_types.amenities IS 'Room amenities stored as JSON array';
COMMENT ON COLUMN room_types.max_occupancy IS 'Maximum number of guests allowed';

COMMENT ON VIEW room_types_with_stats IS 'Room types with room counts (matches rooms.type with room_types.name)';
COMMENT ON FUNCTION get_room_counts_by_type(UUID) IS 'Returns room counts by type for a specific hotel';
COMMENT ON FUNCTION get_hotel_room_types_with_counts(UUID) IS 'Returns all room types for a hotel with their room counts';
COMMENT ON FUNCTION reorder_room_types(UUID[], UUID) IS 'Reorders room types based on provided array of IDs';
COMMENT ON FUNCTION update_room_types_updated_at() IS 'Trigger function to automatically update updated_at timestamp';

-- Ensure all existing room types are available by default
UPDATE room_types SET available = true WHERE available IS NULL;