-- Migration: Create Room Types Table
-- File: 20250812140000_create_room_types_table.sql
-- Created: 2025-08-12
-- Description: Creates room_types table for hotel-specific room configurations

-- Create room_types table
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC NOT NULL CHECK (base_price >= 0),
    max_occupancy INTEGER DEFAULT 2 CHECK (max_occupancy > 0),
    amenities JSONB DEFAULT '[]'::JSONB,
    available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_room_types_hotel_id ON room_types(hotel_id);
CREATE INDEX idx_room_types_available ON room_types(available);
CREATE INDEX idx_room_types_sort_order ON room_types(sort_order);
CREATE INDEX idx_room_types_created_at ON room_types(created_at);

-- Create unique constraint for room type names within a hotel
CREATE UNIQUE INDEX idx_room_types_hotel_name_unique 
ON room_types(hotel_id, LOWER(name)) 
WHERE available = true;

-- Enable Row Level Security
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for hotel owners to view their room types
CREATE POLICY "Hotel owners can view their room types" ON room_types
    FOR SELECT USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id = auth.uid()
        )
    );

-- Policy for hotel owners to insert their room types
CREATE POLICY "Hotel owners can insert their room types" ON room_types
    FOR INSERT WITH CHECK (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id = auth.uid()
        )
    );

-- Policy for hotel owners to update their room types
CREATE POLICY "Hotel owners can update their room types" ON room_types
    FOR UPDATE USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id = auth.uid()
        )
    ) WITH CHECK (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id = auth.uid()
        )
    );

-- Policy for hotel owners to delete their room types
CREATE POLICY "Hotel owners can delete their room types" ON room_types
    FOR DELETE USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id = auth.uid()
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_room_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_room_types_updated_at
    BEFORE UPDATE ON room_types
    FOR EACH ROW
    EXECUTE FUNCTION update_room_types_updated_at();

-- Function to get available room types for a hotel
CREATE OR REPLACE FUNCTION get_available_room_types(hotel_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    base_price NUMERIC,
    max_occupancy INTEGER,
    amenities JSONB,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id,
        rt.name,
        rt.description,
        rt.base_price,
        rt.max_occupancy,
        rt.amenities,
        rt.sort_order
    FROM room_types rt
    WHERE rt.hotel_id = hotel_uuid 
    AND rt.available = true
    ORDER BY rt.sort_order ASC, rt.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate room pricing for multiple nights
CREATE OR REPLACE FUNCTION calculate_room_price(
    room_type_id UUID,
    nights INTEGER DEFAULT 1
)
RETURNS NUMERIC AS $$
DECLARE
    base_price NUMERIC;
BEGIN
    SELECT rt.base_price INTO base_price
    FROM room_types rt
    WHERE rt.id = room_type_id AND rt.available = true;
    
    IF base_price IS NULL THEN
        RAISE EXCEPTION 'Room type not found or not available';
    END IF;
    
    RETURN base_price * nights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed data with basic room types for existing hotels
INSERT INTO room_types (hotel_id, name, description, base_price, max_occupancy, amenities, sort_order)
SELECT 
    h.id,
    'Standard Room',
    'Comfortable room with basic amenities',
    1500.00,
    2,
    '["WiFi", "AC", "TV", "Bathroom"]'::JSONB,
    1
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM room_types rt WHERE rt.hotel_id = h.id
);

INSERT INTO room_types (hotel_id, name, description, base_price, max_occupancy, amenities, sort_order)
SELECT 
    h.id,
    'Deluxe Room',
    'Spacious room with premium amenities',
    2500.00,
    3,
    '["WiFi", "AC", "TV", "Bathroom", "Mini Bar", "Balcony"]'::JSONB,
    2
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM room_types rt WHERE rt.hotel_id = h.id AND rt.name = 'Deluxe Room'
);

INSERT INTO room_types (hotel_id, name, description, base_price, max_occupancy, amenities, sort_order)
SELECT 
    h.id,
    'Suite',
    'Luxury suite with separate living area',
    4000.00,
    4,
    '["WiFi", "AC", "TV", "Bathroom", "Mini Bar", "Balcony", "Living Area", "Kitchen"]'::JSONB,
    3
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM room_types rt WHERE rt.hotel_id = h.id AND rt.name = 'Suite'
);

-- Create view for room type statistics
CREATE OR REPLACE VIEW room_type_stats AS
SELECT 
    rt.hotel_id,
    COUNT(*) as total_room_types,
    COUNT(*) FILTER (WHERE rt.available = true) as available_room_types,
    COUNT(*) FILTER (WHERE rt.available = false) as hidden_room_types,
    AVG(rt.base_price) as avg_price,
    MIN(rt.base_price) as min_price,
    MAX(rt.base_price) as max_price
FROM room_types rt
GROUP BY rt.hotel_id;

-- Add helpful comments for documentation
COMMENT ON TABLE room_types IS 'Hotel-specific room type configurations with pricing and amenities';
COMMENT ON COLUMN room_types.hotel_id IS 'Reference to the hotel this room type belongs to';
COMMENT ON COLUMN room_types.name IS 'Name of the room type (e.g., Standard, Deluxe, Suite)';
COMMENT ON COLUMN room_types.description IS 'Detailed description of the room type';
COMMENT ON COLUMN room_types.base_price IS 'Base price per night in the local currency';
COMMENT ON COLUMN room_types.max_occupancy IS 'Maximum number of guests allowed in this room type';
COMMENT ON COLUMN room_types.amenities IS 'JSON array of amenities available in this room type';
COMMENT ON COLUMN room_types.available IS 'Whether this room type is available for booking';
COMMENT ON COLUMN room_types.sort_order IS 'Display order for room types (lower numbers first)';

COMMENT ON FUNCTION get_available_room_types(UUID) IS 'Returns all available room types for a specific hotel';
COMMENT ON FUNCTION calculate_room_price(UUID, INTEGER) IS 'Calculates total room price for specified nights';
COMMENT ON VIEW room_type_stats IS 'Aggregated statistics for room types by hotel';