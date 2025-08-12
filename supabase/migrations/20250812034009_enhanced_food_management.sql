-- Enhanced Food Management Migration
-- File: migrations/20250812150000_enhanced_food_management.sql
-- Created: 2025-08-12
-- Description: Enhanced food management system with flexible categories and availability

-- Drop existing food_items table if it exists to recreate with better structure
DROP TABLE IF EXISTS food_items CASCADE;

-- Create enhanced food_items table with better structure
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts')),
  available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15, -- in minutes
  is_vegetarian BOOLEAN DEFAULT true,
  is_vegan BOOLEAN DEFAULT false,
  spice_level TEXT DEFAULT 'mild' CHECK (spice_level IN ('mild', 'medium', 'spicy', 'very_spicy')),
  ingredients TEXT[], -- array of ingredients
  allergens TEXT[], -- array of allergens
  nutritional_info JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on food_items table
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

-- Food items policies - only hotel owners can manage their food items
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

-- Create indexes for better performance
CREATE INDEX idx_food_items_hotel_id ON food_items(hotel_id);
CREATE INDEX idx_food_items_category ON food_items(category);
CREATE INDEX idx_food_items_available ON food_items(available);
CREATE INDEX idx_food_items_sort_order ON food_items(sort_order);
CREATE INDEX idx_food_items_price ON food_items(price);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_food_items_updated_at
    BEFORE UPDATE ON food_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample food items for existing hotels
INSERT INTO food_items (hotel_id, name, description, price, category, preparation_time, is_vegetarian, spice_level)
SELECT 
  h.id as hotel_id,
  'Continental Breakfast' as name,
  'Fresh breakfast with fruits, bread, butter, jam, and beverages' as description,
  450 as price,
  'breakfast' as category,
  15 as preparation_time,
  true as is_vegetarian,
  'mild' as spice_level
FROM hotels h;

INSERT INTO food_items (hotel_id, name, description, price, category, preparation_time, is_vegetarian, spice_level)
SELECT 
  h.id as hotel_id,
  'South Indian Breakfast' as name,
  'Idli, dosa, vada with sambar and coconut chutney' as description,
  280 as price,
  'breakfast' as category,
  20 as preparation_time,
  true as is_vegetarian,
  'medium' as spice_level
FROM hotels h;

INSERT INTO food_items (hotel_id, name, description, price, category, preparation_time, is_vegetarian, spice_level)
SELECT 
  h.id as hotel_id,
  'North Indian Thali' as name,
  'Complete meal with dal, sabzi, roti, rice, pickle, and curd' as description,
  380 as price,
  'lunch' as category,
  25 as preparation_time,
  true as is_vegetarian,
  'medium' as spice_level
FROM hotels h;

INSERT INTO food_items (hotel_id, name, description, price, category, preparation_time, is_vegetarian, spice_level)
SELECT 
  h.id as hotel_id,
  'Chicken Biryani' as name,
  'Aromatic basmati rice with tender chicken and spices' as description,
  520 as price,
  'lunch' as category,
  35 as preparation_time,
  false as is_vegetarian,
  'spicy' as spice_level
FROM hotels h;

INSERT INTO food_items (hotel_id, name, description, price, category, preparation_time, is_vegetarian, spice_level)
SELECT 
  h.id as hotel_id,
  'Multi-cuisine Dinner' as name,
  'Choice of Indian, Chinese, or Continental dishes' as description,
  680 as price,
  'dinner' as category,
  30 as preparation_time,
  true as is_vegetarian,
  'medium' as spice_level
FROM hotels h;

INSERT INTO food_items (hotel_id, name, description, price, category, preparation_time, is_vegetarian, spice_level)
SELECT 
  h.id as hotel_id,
  'Samosa Chat' as name,
  'Crispy samosas with chutneys and yogurt' as description,
  120 as price,
  'snacks' as category,
  10 as preparation_time,
  true as is_vegetarian,
  'mild' as spice_level
FROM hotels h;

INSERT INTO food_items (hotel_id, name, description, price, category, preparation_time, is_vegetarian, spice_level)
SELECT 
  h.id as hotel_id,
  'Fresh Lime Soda' as name,
  'Refreshing lime soda with mint and ice' as description,
  80 as price,
  'beverages' as category,
  5 as preparation_time,
  true as is_vegetarian,
  'mild' as spice_level
FROM hotels h;

INSERT INTO food_items (hotel_id, name, description, price, category, preparation_time, is_vegetarian, spice_level)
SELECT 
  h.id as hotel_id,
  'Gulab Jamun' as name,
  'Sweet milk dumplings in sugar syrup (2 pieces)' as description,
  90 as price,
  'desserts' as category,
  5 as preparation_time,
  true as is_vegetarian,
  'mild' as spice_level
FROM hotels h;

-- Create a view for easy food item statistics
CREATE OR REPLACE VIEW food_items_stats AS
SELECT 
    fi.hotel_id,
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE fi.available = true) as available_items,
    COUNT(*) FILTER (WHERE fi.category = 'breakfast') as breakfast_items,
    COUNT(*) FILTER (WHERE fi.category = 'lunch') as lunch_items,
    COUNT(*) FILTER (WHERE fi.category = 'dinner') as dinner_items,
    COUNT(*) FILTER (WHERE fi.category = 'snacks') as snacks_items,
    COUNT(*) FILTER (WHERE fi.category = 'beverages') as beverages_items,
    COUNT(*) FILTER (WHERE fi.category = 'desserts') as desserts_items,
    AVG(fi.price) as average_price,
    MIN(fi.price) as min_price,
    MAX(fi.price) as max_price,
    COUNT(*) FILTER (WHERE fi.is_vegetarian = true) as vegetarian_items,
    COUNT(*) FILTER (WHERE fi.is_vegan = true) as vegan_items
FROM food_items fi
GROUP BY fi.hotel_id;

-- Create function to get food items by category and availability
CREATE OR REPLACE FUNCTION get_food_items_by_category(
    hotel_uuid UUID,
    food_category TEXT DEFAULT NULL,
    include_unavailable BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price NUMERIC,
    category TEXT,
    available BOOLEAN,
    preparation_time INTEGER,
    is_vegetarian BOOLEAN,
    is_vegan BOOLEAN,
    spice_level TEXT,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fi.id,
        fi.name,
        fi.description,
        fi.price,
        fi.category,
        fi.available,
        fi.preparation_time,
        fi.is_vegetarian,
        fi.is_vegan,
        fi.spice_level,
        fi.sort_order
    FROM food_items fi
    WHERE fi.hotel_id = hotel_uuid
    AND (food_category IS NULL OR fi.category = food_category)
    AND (include_unavailable OR fi.available = true)
    ORDER BY fi.sort_order ASC, fi.category ASC, fi.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE food_items IS 'Enhanced food items with flexible categories and detailed attributes';
COMMENT ON COLUMN food_items.category IS 'Food category: breakfast, lunch, dinner, snacks, beverages, desserts';
COMMENT ON COLUMN food_items.preparation_time IS 'Estimated preparation time in minutes';
COMMENT ON COLUMN food_items.spice_level IS 'Spice level: mild, medium, spicy, very_spicy';
COMMENT ON COLUMN food_items.ingredients IS 'Array of ingredients used in the dish';
COMMENT ON COLUMN food_items.allergens IS 'Array of known allergens in the dish';
COMMENT ON COLUMN food_items.nutritional_info IS 'Nutritional information stored as JSONB';
COMMENT ON COLUMN food_items.sort_order IS 'Sort order for display purposes';

COMMENT ON VIEW food_items_stats IS 'Statistical overview of food items per hotel';
COMMENT ON FUNCTION get_food_items_by_category(UUID, TEXT, BOOLEAN) IS 'Get food items filtered by category and availability';