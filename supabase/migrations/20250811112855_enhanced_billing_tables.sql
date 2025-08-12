-- Enhanced billing tables migration
-- File: migrations/20250811120000_enhanced_billing_tables.sql

-- Add missing columns to hotels table for billing
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add missing columns to staff table for enhanced management
ALTER TABLE staff ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS place TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_verification_notes TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary NUMERIC;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated'));

-- Add missing columns to bills table for enhanced billing
ALTER TABLE bills ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_number TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS subtotal NUMERIC;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tax_amount NUMERIC;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'cancelled'));

-- Create bill_items table for detailed item tracking
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('room', 'food', 'service')),
  price NUMERIC NOT NULL,
  quantity INTEGER DEFAULT 1,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on bill_items table
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- Bill items policies
CREATE POLICY "Users can view bill items of their hotels" ON bill_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = bill_items.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert bill items for their hotels" ON bill_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = bill_items.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update bill items of their hotels" ON bill_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = bill_items.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete bill items of their hotels" ON bill_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = bill_items.hotel_id AND hotels.owner_id = auth.uid()
  ));

-- Create room_types table for consistent room management
CREATE TABLE IF NOT EXISTS room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  description TEXT,
  amenities JSONB DEFAULT '[]'::jsonb,
  max_occupancy INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on room_types table
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Room types policies
CREATE POLICY "Users can view room types of their hotels" ON room_types
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert room types for their hotels" ON room_types
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update room types of their hotels" ON room_types
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete room types of their hotels" ON room_types
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()
  ));

-- Create food_items table for consistent food management
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on food_items table
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

-- Food items policies
CREATE POLICY "Users can view food items of their hotels" ON food_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = food_items.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert food items for their hotels" ON food_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = food_items.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update food items of their hotels" ON food_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = food_items.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete food items of their hotels" ON food_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = food_items.hotel_id AND hotels.owner_id = auth.uid()
  ));

-- Create services table for extra services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Users can view services of their hotels" ON services
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = services.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert services for their hotels" ON services
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = services.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update services of their hotels" ON services
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = services.hotel_id AND hotels.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete services of their hotels" ON services
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM hotels WHERE hotels.id = services.hotel_id AND hotels.owner_id = auth.uid()
  ));

-- Insert default room types for existing hotels
INSERT INTO room_types (hotel_id, name, base_price, description, max_occupancy)
SELECT 
  id as hotel_id,
  'King Room' as name,
  3500 as base_price,
  'Spacious room with king-size bed' as description,
  2 as max_occupancy
FROM hotels
WHERE NOT EXISTS (SELECT 1 FROM room_types WHERE room_types.hotel_id = hotels.id);

INSERT INTO room_types (hotel_id, name, base_price, description, max_occupancy)
SELECT 
  id as hotel_id,
  'Queen Room' as name,
  2800 as base_price,
  'Comfortable room with queen-size bed' as description,
  2 as max_occupancy
FROM hotels;

INSERT INTO room_types (hotel_id, name, base_price, description, max_occupancy)
SELECT 
  id as hotel_id,
  'Single Room' as name,
  1500 as base_price,
  'Cozy single occupancy room' as description,
  1 as max_occupancy
FROM hotels;

INSERT INTO room_types (hotel_id, name, base_price, description, max_occupancy)
SELECT 
  id as hotel_id,
  'Deluxe Room' as name,
  4500 as base_price,
  'Premium room with luxury amenities' as description,
  3 as max_occupancy
FROM hotels;

-- Insert default food items
INSERT INTO food_items (hotel_id, name, category, price, description)
SELECT 
  id as hotel_id,
  'Continental Breakfast' as name,
  'Breakfast' as category,
  450 as price,
  'Fresh breakfast with fruits, bread, and beverages' as description
FROM hotels;

INSERT INTO food_items (hotel_id, name, category, price, description)
SELECT 
  id as hotel_id,
  'Indian Thali' as name,
  'Lunch' as category,
  320 as price,
  'Traditional Indian meal with variety of dishes' as description
FROM hotels;

INSERT INTO food_items (hotel_id, name, category, price, description)
SELECT 
  id as hotel_id,
  'Multi-cuisine Dinner' as name,
  'Dinner' as category,
  580 as price,
  'Delicious dinner with multiple cuisine options' as description
FROM hotels;

-- Insert default services
INSERT INTO services (hotel_id, name, price, description)
SELECT 
  id as hotel_id,
  'Swimming Pool Access' as name,
  300 as price,
  'Full day access to swimming pool and poolside amenities' as description
FROM hotels;

INSERT INTO services (hotel_id, name, price, description)
SELECT 
  id as hotel_id,
  'Spa & Wellness' as name,
  1200 as price,
  'Relaxing spa treatment and wellness services' as description
FROM hotels;

INSERT INTO services (hotel_id, name, price, description)
SELECT 
  id as hotel_id,
  'Airport Transfer' as name,
  800 as price,
  'Comfortable transport to and from airport' as description
FROM hotels;