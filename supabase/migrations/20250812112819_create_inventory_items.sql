-- Inventory Items Migration
-- File: migrations/20250812200000_create_inventory_items.sql
-- Created: 2025-08-12
-- Description: Create inventory_items table for hotel inventory management

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT quantity_non_negative CHECK (quantity >= 0),
  CONSTRAINT minimum_stock_non_negative CHECK (minimum_stock >= 0),
  CONSTRAINT price_non_negative CHECK (price_per_unit >= 0)
);

-- Enable RLS on inventory_items table
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Inventory items policies - users can only manage their hotel's inventory
CREATE POLICY "Users can view their hotel's inventory" ON inventory_items
  FOR SELECT USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their hotel's inventory" ON inventory_items
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their hotel's inventory" ON inventory_items
  FOR UPDATE USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their hotel's inventory" ON inventory_items
  FOR DELETE USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_hotel_id ON inventory_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON inventory_items(hotel_id, quantity, minimum_stock);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE inventory_items IS 'Hotel inventory management - tracks stock levels, prices, and suppliers';
COMMENT ON COLUMN inventory_items.category IS 'Item category: Food & Beverages, Cleaning Supplies, Toiletries, etc.';
COMMENT ON COLUMN inventory_items.quantity IS 'Current stock quantity';
COMMENT ON COLUMN inventory_items.unit IS 'Unit of measurement: pieces, kg, liters, boxes, etc.';
COMMENT ON COLUMN inventory_items.minimum_stock IS 'Minimum stock level for low stock alerts';
COMMENT ON COLUMN inventory_items.price_per_unit IS 'Cost per unit for inventory valuation';
COMMENT ON COLUMN inventory_items.supplier IS 'Supplier or vendor information';